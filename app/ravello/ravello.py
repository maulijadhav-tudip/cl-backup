from app import flaskapp
from flask import request, Response, jsonify
from bson import json_util, ObjectId
import json
import time
import datetime
import dateutil.parser
import logging
import xmltodict as xmltodict
from .tests import *
from threading import Thread
import requests
from config import *


HEADERS = {
    'cache-control': "no-cache",
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

VERIFY  =  not flaskapp.config['DEBUG']
BASE_URL = "https://cloud.ravellosystems.com/api/v1/"
# BASE_URL = "http://localhost:8000/"
def buckets():
    url = BASE_URL + "costBuckets"
    return requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), verify=VERIFY).text


def locations(id):
    url = BASE_URL + "blueprints/" + \
        str(id) + "/publishLocations"
    return requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), verify=VERIFY).text


def blueprints():
    url = BASE_URL + "blueprints"
    return requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), verify=VERIFY).text


def delete_env(env):
    url = BASE_URL + "applications/" + str(env)
    response = requests.request(
        "DELETE", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), verify=VERIFY)
    flaskapp.logger.info("Env " + str(env) + " deleted.")
    return response.status_code


def applications():
    url = BASE_URL + "applications/"
    raw = requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']),
        verify=VERIFY).text
    return raw


def application(app_id):
    url = BASE_URL + "applications/" + str(app_id)
    raw = requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']),
        verify=VERIFY).text
    return raw


def delete_token(tokenID):
    url = BASE_URL + "ephemeralAccessTokens/" + \
        str(tokenID)
    response = requests.request(
        "DELETE", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), verify=VERIFY)
    flaskapp.logger.info("Token " + str(tokenID) + " deleted.")
    return response.status_code


def set_env_expiration(env, duration):
    url = BASE_URL + "applications/" + \
        str(env) + "/setExpiration"
    data = {
        "expirationFromNowSeconds": int(duration) * 60
    }

    response = requests.request(
        "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)
    flaskapp.logger.info("Env " + str(env) + " expiration updated.")
    return response.status_code


def update_application_name(env, name, blueprint):
    settings = flaskapp.config['SETTINGS_COLLECTION'].find_one()
    url = BASE_URL + "applications/" + str(env)
    raw = requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), verify=VERIFY).text
    json_dict = json.loads(raw)
    json_dict['name'] = name
    response = requests.request(
        "PUT", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=json_dict, verify=VERIFY)

    flaskapp.logger.info("Env " + str(env) + " name updated.")
    return response.status_code


def update_token(tokenName, tokenID, duration, env):
    url = BASE_URL + "ephemeralAccessTokens/" + \
        str(tokenID)
    raw = requests.request(
        "GET", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']),  verify=VERIFY).text
    json_dict = json.loads(raw)
    json_dict['expirationTime'] = int(
        round(time.time() * 1000)) + (int(duration) * 60 * 1000)
    json_dict['name'] = tokenName
    response = requests.request(
        "PUT", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=json_dict, verify=VERIFY)
    flaskapp.logger.info("Token " + str(tokenName) + " updated.")
    return response.status_code


def create_or_assign_env(name, lab, classId=None):
    if classId:
        hot = flaskapp.config['CLASS_COLLECTION'].find_one_and_update({"id": classId},{'$pop': {'envs': -1 },  '$inc': {"usedEnvs": 1}})
    else:
        hot = flaskapp.config['HOT_COLLECTION'].find_one_and_update({"lab._id": lab['_id'], "startTime": {"$lt":datetime.datetime.utcnow() + datetime.timedelta(minutes=15)}, "endTime":{"$gt":datetime.datetime.utcnow()}},{'$pop': {'envs': -1 },  '$inc': {"usedEnvs": 1}})
    if hot and len(hot['envs']) > 0:
        return hot['envs'][0]
    else:
        return create_env(name, int(lab['blueprint']['id']))


def create_env(name, blueprint):

    settings = flaskapp.config['SETTINGS_COLLECTION'].find_one()

    url = BASE_URL + "applications"
    data = {
        "name": name,
        "baseBlueprintId": blueprint,
        "costBucket": {"id": settings['bucket']['id']}
    }
    response = requests.request(
        "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)

    failCount = 0

    try:
        # If the API Call Fails, Keep Trying
        while response.status_code != 201:
            # If failed a certain amount, send an email to the admin
            if failCount == int(flaskapp.config['API_FAIL']):
                raise Exception(
                    "Creating Application has failed " + str(failCount) + " times.")

            response = requests.request(
                "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)
            flaskapp.logger.error("Error Creating Application " + name + ", trying again, Response: " +
                                     str(response.status_code))
            failCount += 1
            time.sleep(18)

    except:
        flaskapp.logger.critical("Error Creating Application " + name + ", Response: " +
                                 str(response.status_code) + ", Skipping user")
        return 1

    if response.status_code == 201:
        response_data = json.loads(response.text)
        flaskapp.logger.info("Created Env " + str(response_data['id']))
        return response_data['id']

    return 1


def publish_env(env, lab, duration):
        # API Call to publish app
    url = BASE_URL + "applications/" + \
        str(env) + "/publish"

    if lab['optimizationLevel'] == "PERFORMANCE_OPTIMIZED":
        data = {
            "optimizationLevel": "PERFORMANCE_OPTIMIZED",
            "preferredRegion": lab['region']
        }
    else:
        data = {
            "optimizationLevel": "COST_OPTIMIZED"
        }

    response = requests.request(
        "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)

    failCount = 0

    try:
        # If API Call fails, retry
        while response.status_code != 202:
                # If failed a certain amount, send an email to the admin
            if failCount == int(flaskapp.config['API_FAIL']):
                raise Exception(
                    "Creating Application has failed " + str(failCount) + " times.")

            response = requests.request(
                "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)
            flaskapp.logger.error("Error Publishing Application, trying again, Response: " +
                                     str(response.status_code))
            failCount += 1
            time.sleep(18)
    except:
        flaskapp.logger.critical("Error Publishing Application " + str(env) + ", Response: " +
                                 str(response.status_code) + ", Skipping user")
        return 1

    url = BASE_URL + "applications/" + \
        str(env) + "/setExpiration"
    data = {
        "expirationFromNowSeconds": int(duration) * 60
    }
    response = requests.request(
        "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)

    if response.status_code != 200:
        return 1

    flaskapp.logger.info("Published Env " + str(env))
    return 0


def create_token(name, duration, env):
    url = BASE_URL + "ephemeralAccessTokens"
    data = {
        "name": name,
        "expirationTime": int(round(time.time() * 1000)) + (int(duration) * 60 * 1000),
        "permissions": [
            {
                "actions": [
                    "READ",
                    "EXECUTE"
                ],
                "resourceType":  "APPLICATION",
                "filterCriterion": {
                    "type":  "COMPLEX",
                    "operator":  "And",
                    "criteria": [
                        {
                            "type":  "SIMPLE",
                            "operator":  "Equals",
                            "propertyName":  "ID",
                            "operand":  env
                        }
                    ]
                }
            }
        ]
    }
    response = requests.request(
        "POST", url, headers=HEADERS, auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']), json=data, verify=VERIFY)

    failCount = 0

    try:
        while response.status_code != 201:
            if failCount == int(flaskapp.config['API_FAIL']):
                raise Exception("Creating Token has failed " +
                                str(failCount) + " times.")
            response = requests.request(
                "POST", url, headers=HEADERS, auth=(RAVELLO_EMAIL, RAVELLO_PASSWORD), json=data, verify=VERIFY)
            flaskapp.logger.error("Error Creating token, trying again" +
                                     str(response.status_code))
            time.sleep(18)
    except:
        flaskapp.logger.critical("Error Creating Token Application " + name + ", Response: " +
                                 str(response.status_code) + ", Skipping user")
        return 1

    if response.status_code == 201:
        response_data = json.loads(response.text)
        flaskapp.logger.info("Created Token " + str(response_data['token']))
        data['token'] = response_data['token']
        data['tokenID'] = response_data['id']
        return data
    return 1


def delete_app_by_email(email):
    user = flaskapp.config['USERS_COLLECTION'].find_one(
        {"email": email})
    if user:
        if user['createdApp']:
            delete_env(str(user['env']))

        if user['createdToken']:
            delete_token(str(user['tokenID']))


def create_or_assign_env_to_user(user):
    if not user['createdApp']:
        result = create_or_assign_env(
            user['email'] + "-" + user['lab']['blueprint']["name"], user['lab'])
        if isinstance(result, int):
            if result != 1:
                flaskapp.config['USERS_COLLECTION'].update_one({
                    'email': user['email']
                }, {
                    '$set': {
                        'createdApp':  True,
                        'env': result
                    }
                })
            else:
                return 1
        else:
            set_env_expiration(result['env'], user['duration'])
            update_token(user['email'] + "-" + user['lab']['blueprint']
                         ["name"], result['tokenID'], user['duration'], result['env'])
            update_application_name(
                result['env'], user['email'] + "-" + user['lab']['blueprint']["name"], user['lab']['blueprint']['id'])

            flaskapp.config['USERS_COLLECTION'].update_one({
                'email': user['email']
            }, {
                '$set': {
                    'createdApp':  True,
                    'env': result['env'],
                    'tokenID': result['tokenID'],
                    'token': result['token'],
                    'publishedTime': result['publishedTime'],
                    'createdToken': True,
                    'startTime': datetime.datetime.utcnow(),
                    'endTime': datetime.datetime.utcnow() + datetime.timedelta(minutes=int(user['duration']))
                }
            })
    return 0


def publish_or_assign_env_to_user(user,enteredClass):
    if not user['createdApp']:
        result = create_or_assign_env(
            user['email'] + "-" + user['lab']['blueprint']["name"], user['lab'], enteredClass['id'])
        if isinstance(result, int):
            if result != 1:
                flaskapp.config['USERS_COLLECTION'].update_one({
                    'email': user['email']
                }, {
                    '$set': {
                        'createdApp':  True,
                        'env': result
                    }
                })

                user = flaskapp.config['USERS_COLLECTION'].find_one(
                    {"email": user['email']})

                result = publish_env(
                    user['env'], user['lab'], user['duration'])
                if result != 1:

                    if user['startTime'] == "":
                        user['startTime'] = datetime.datetime.utcnow()
                        user['endTime'] = datetime.datetime.utcnow(
                        ) + datetime.timedelta(minutes=int(user['duration']))

                    result1 = create_token(
                        user['email'] + "-" + user['lab']['blueprint']["name"], user['duration'], user['env'])

                    if result1 != 1:
                        user['token'] = result1['token']
                        user['tokenID'] = result1['tokenID']
                        user['publishedTime'] = datetime.datetime.utcnow()
                        user['createdToken'] = True
                        flaskapp.config['USERS_COLLECTION'].update_one({
                            'email': user['email']
                        }, {
                            '$set': user
                        })


                    else:
                        return 1
                else:
                    return 1
            else:
                return 0
        else:
            set_env_expiration(result['env'], user['duration'])
            update_token(user['email'] + "-" + user['lab']['blueprint']
                         ["name"], result['tokenID'], user['duration'], result['env'])
            update_application_name(
                result['env'], user['email'] + "-" + user['lab']['blueprint']["name"], user['lab']['blueprint']['id'])

            flaskapp.config['USERS_COLLECTION'].update_one({
                'email': user['email']
            }, {
                '$set': {
                    'createdApp':  True,
                    'env': result['env'],
                    'tokenID': result['tokenID'],
                    'token': result['token'],
                    'publishedTime': result['publishedTime'],
                    'createdToken': True,
                    'startTime': datetime.datetime.utcnow()
                }
            })
    return 0


# create test template API
@flaskapp.route('/api/ravello/test-template', methods=['POST', 'GET'])
def create_template():
    if request.method == 'POST':
        test_name = []
        if request.form['test1'] == 'true':
            test_name.append('Test 1')

        if request.form['test2'] == 'true':
            test_name.append('Test 2')

        if request.form['test3'] == 'true':
            test_name.append('Test 3')

        test_template = {
                "name": request.form['name'],
                "description": request.form['description'],
                "testNames": test_name,
                "testParams": {
                        "vmname": request.form["vmname"],
                        "vmusername": request.form["vmusername"],
                        "vmpassword": request.form["password"]
                }
             }
        flaskapp.config['TEST_TEMPLATES_COLLECTION'].insert_one(test_template)
        return jsonify({"status": "OK"}), 200

    if request.method == 'GET':
        tests = json_util.dumps(flaskapp.config['TEST_TEMPLATES_COLLECTION'].find())
        return jsonify({"test_details": json.loads(tests)}), 200

    return Response("BAD REQUESTS"), 400


# edit test template details
@flaskapp.route('/api/ravello/edit-test-template/<string:id>', methods=['PUT', 'GET', 'DELETE'])
def edit_details(id):
    tests = json_util.dumps(flaskapp.config['TEST_TEMPLATES_COLLECTION'].find_one({"_id": ObjectId(id)}))

    if request.method == 'GET':
        return jsonify({"test_details": json.loads(tests)}), 200

    if request.method == 'PUT':
        if tests:
            test_names = []
            if request.form['test1'] == 'true':
                test_names.append('Test 1')

            if request.form['test2'] == 'true':
                test_names.append('Test 2')

            if request.form['test3'] == 'true':
                test_names.append('Test 3')

            flaskapp.config['TEST_TEMPLATES_COLLECTION'].update_one({"_id":ObjectId(id)},
                                  {'$set': {"name": request.form['name'],
                                            "description": request.form['description'],
                                            "testNames": test_names,
                                            "testParams.vmname": request.form["vmname"],
                                            "testParams.vmusername": request.form["vmusername"],
                                            "testParams.vmpassword": request.form["password"]
                                            }})
            return jsonify({"template-test-details": "updated"}), 200

    if request.method == 'DELETE':
        flaskapp.config['TEST_TEMPLATES_COLLECTION'].remove({"_id": ObjectId(id)})
        return jsonify({"status": "successfully deleted"}), 200
    return Response("BAD REQUESTS"), 400


# show test details API
@flaskapp.route('/api/ravello/test-detail', methods=['POST', 'GET'])
def test_details():
    if request.method == 'GET':
        temp_list = json_util.dumps(flaskapp.config['TEST_TEMPLATES_COLLECTION'].find())

        assigned_env_list = []
        hot_env_list = []
        tested_env_list = []
        env_list = []

        for user_detail in flaskapp.config['USERS_COLLECTION'].find({"env": {'$ne': ""}}, {'env': 1, '_id': 0}):
            assigned_env_list.append(user_detail['env'])

        for class_detail in flaskapp.config['CLASS_COLLECTION'].find({}, {'envs': 1, '_id': 0}):
            for env_id in class_detail['envs']:
                hot_env_list.append(env_id)

        for test_detail in flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].find(
                {"environmentId": {'$ne': ""}}, {'environmentId': 1, '_id': 0}):
            tested_env_list.append(test_detail['environmentId'])

        assigned_env_list = list(set(assigned_env_list) - set(tested_env_list))
        hot_env_list = list(set(hot_env_list) - set(tested_env_list))

        for assigned_env_id in assigned_env_list:
            pre_gen_env_details = application(assigned_env_id)
            env_list.append({"environmentId": assigned_env_id,
                             "environment_name": json.loads(pre_gen_env_details)['name'],
                             "assigned": "True", "class": "Pre-generated"})

        for hot_env_id in hot_env_list:
            hot_env_detail = application(hot_env_id)
            env_list.append({"environmentId": hot_env_id, "environment_name": json.loads(hot_env_detail)['name'],
                             "assigned": "False", "class": "Hot"})

        tested_envs = json.loads(json_util.dumps(flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].find({})))

        return jsonify({"test-list": json.loads(temp_list),
                        "env_test": env_list + tested_envs
                        }), 200

    if request.method == 'POST':
        env_test_data = json.loads(request.form['mySelection'])
        test_template = json.loads(request.form['testTemplate'])

        for env_test in env_test_data:
            try:
                if env_test['testTemplate'] or env_test['status']:
                    del env_test["_id"], env_test['created_at']
                    env_test['testTemplate'] = test_template['name']
                    env_test['status'] = "In progress"
            except:
                env_test['testTemplate'] = test_template['name']
                env_test['status'] = "In progress"

        test_ids = flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].insert(env_test_data)
        environment_list = list(flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].find({'_id': {'$in': test_ids}},
                                                                                  {'environmentId': 1, '_id': 0}))
        fqdn_list = []
        for env_id in environment_list:
            fqdn = []
            app_id = str(env_id['environmentId'])
            get_fqdn(app_id, fqdn)
            fqdn_list.append(fqdn)

        if fqdn_list and test_template:
            for ngfw, test_id in zip(fqdn_list,test_ids):
                run_tests(test_id, test_template, ngfw[0])
        else:
            print('No test ran as there was no VM named as NGFW')

        return jsonify({"status": "OK"}), 200
    return Response("BAD REQUESTS"), 400


@flaskapp.route('/api/ravello/restart-test', methods=['POST'])
def restart_test():
    if request.method == 'POST':
        env_test_data = json.loads(request.form['mySelection'])
        flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].update_one({'_id': ObjectId(env_test_data['_id'])},
                                                                  {'$set': {'status': 'In progress'}})
        test_template = json.loads(json_util.dumps(flaskapp.config['TEST_TEMPLATES_COLLECTION'].find_one({'name': env_test_data['testTemplate']})))
        app_id = env_test_data['environmentId']

        fqdn = []
        get_fqdn(app_id, fqdn)

        for ngfw in fqdn:
            print(ObjectId(env_test_data['_id']), type(ObjectId(env_test_data['_id'])))
            run_tests(ObjectId(env_test_data['_id']), test_template, ngfw)
        return jsonify({"status": "updated"}), 200

    return Response("BAD REQUESTS"), 400

