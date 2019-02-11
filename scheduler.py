from app import flaskapp
import datetime
from config import *
import werkzeug.security
import time
import json
from werkzeug.security import generate_password_hash
from app.ravello.ravello import *
from app.azure.functions import delete_azure_by_email, create_azure_env, delete_azure_by_username
from random import randint
import random
import string

flaskapp.logger.debug("Starting Scheduler")

def check():
    cursor = REQUEST_COLLECTION.find()

    for student in cursor:
        if datetime.datetime.utcnow() > (student['lastCleared'] + datetime.timedelta(hours=24)):
            cur = REQUEST_COLLECTION.update_one(
                {"email":student['email']}, {'$set': {"requestedEnvs": 0, "lastCleared": datetime.datetime.utcnow()}})


    cursor = CLASS_COLLECTION.find()
    for scheduledClass in cursor:
        # If a class is a schedule class (Has envs) and the current time is after the startTime - buffer time
        if scheduledClass['type'] == "pregen" and datetime.datetime.utcnow() > (scheduledClass['startTime'] - datetime.timedelta(minutes=scheduledClass['buffer'])):
            # and there are still environments to create, and the time in between publish blocks has been surpassed
            if scheduledClass['createdEnvs'] < scheduledClass['envs'] and datetime.datetime.utcnow() > (scheduledClass['lastPublished'] + datetime.timedelta(minutes=scheduledClass['blockDelay'])):
                create_apps(scheduledClass)  # Then create a block
        elif scheduledClass['type'] == "hot":
            # if group is before start but in roll-out
            if int(scheduledClass['hotenvs']) > len(scheduledClass['envs']) and datetime.datetime.utcnow() > (scheduledClass['startTime']- datetime.timedelta(minutes=scheduledClass['buffer'])) and datetime.datetime.utcnow() < scheduledClass['startTime']:
                if scheduledClass['createdEnvs'] < int(scheduledClass['hotenvs']) and datetime.datetime.utcnow() > (scheduledClass['lastPublished'] + datetime.timedelta(minutes=scheduledClass['blockDelay'])):
                    for i in range(scheduledClass['createdEnvs'], int(min(scheduledClass['createdEnvs'] + scheduledClass['blockSize'], int(scheduledClass['hotenvs'])))):
                        create_hot_class(scheduledClass)
            if  datetime.datetime.utcnow() < scheduledClass['endTime'] and  datetime.datetime.utcnow() > scheduledClass['startTime']:
                if (int(scheduledClass['createdEnvs']) + int(scheduledClass['usedEnvs'])) < int(scheduledClass['hotenvs']) and int(scheduledClass['hotenvs']) > len(scheduledClass['envs']):
                    create_hot_class(scheduledClass)
            if datetime.datetime.utcnow() > scheduledClass['endTime'] +  datetime.timedelta(minutes=int(scheduledClass['endBuffer'])):
                for item in scheduledClass['envs']:
                    if scheduledClass['lab']['type'] == "ravello":
                        # delete_env(item['env'])
                        # delete_token(item['tokenID'])
                        pass
                    else:
                        delete_azure_by_username(item['azure_name'])
                flaskapp.config['CLASS_COLLECTION'].update_one({
                    'id': scheduledClass['id']
                },{'$set': {"envs":[]}})

    cursor = HOT_COLLECTION.find()
    for group in cursor:
        # if group is before start but in roll-out
        if int(group['hotenvs']) > len(group['envs']) and datetime.datetime.utcnow() > (group['startTime']- datetime.timedelta(minutes=group['buffer'])) and datetime.datetime.utcnow() < group['startTime']:
            if group['createdEnvs'] < int(group['hotenvs']) and datetime.datetime.utcnow() > (group['lastPublished'] + datetime.timedelta(minutes=group['blockDelay'])):
                for i in range(group['createdEnvs'], int(min(group['createdEnvs'] + group['blockSize'], int(group['hotenvs'])))):
                    create_hot(group)

        # if hot start is active
        if  datetime.datetime.utcnow() < group['endTime'] and  datetime.datetime.utcnow() > group['startTime']:
            if "class" in group and (int(group['createdEnvs']) + int(group['usedEnvs'])) < int(group['hotenvs']) and int(group['hotenvs']) > len(group['envs']):
                create_hot(group)
            elif "class" not in group and int(group['hotenvs']) > len(group['envs']):
                create_hot(group)

        # if group is expired
        if datetime.datetime.utcnow() > group['endTime']:
            for item in group['envs']:
                if group['lab']['type'] == "ravello":
                    delete_env(item['env'])
                    delete_token(item['tokenID'])
                else:
                    delete_azure_by_username(item['azure_name'])

            HOT_COLLECTION.delete_one({"lab.name": group['lab']['name']})

    cursor = USERS_COLLECTION.find()

    for student in cursor:
        if student['publishedTime'] != "" and datetime.datetime.utcnow() > student['endTime']:
            if student['lab']['type'] == "ravello":
                delete_app_by_email(student['email'])
            else:
                delete_azure_by_email(student['email'])

            USERS_COLLECTION.delete_one({
                'email': student['email']
            })

def create_hot(group):
    HOT_COLLECTION.update_one({'_id': group['_id']},{'$set': {"lastPublished":datetime.datetime.utcnow() }})

    current = datetime.datetime.utcnow()
    settings = SETTINGS_COLLECTION.find_one()
    env = {}
    duration = int((group['endTime'] -
                    current).total_seconds() / 60)

    group = HOT_COLLECTION.find_one({"_id":group['_id']})

    if group['lab']['type'] == "ravello":
        name = "hot" +  str(format(group['createdEnvs'], '03d')) + "-" + group['lab']['blueprint']["name"] + "-" + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10))
        env['env'] = create_env( name ,int(group['lab']['blueprint']['id']))
        if env['env'] != 1:
            result = publish_env(env['env'], group['lab'], duration)
            if result != 1:
                data = create_token(name, duration, env['env'])
                if data != 1:
                    flaskapp.logger.info("Created Ravello Hot Start Environment " + name)
                    env['token'] = data['token']
                    env['tokenID'] = data['tokenID']
                    env['publishedTime'] = datetime.datetime.utcnow()

                else:
                    flaskapp.logger.error("Failed Creating Ravello Hot Start Environment Token")
                    return 1
            else:
                flaskapp.logger.error("Failed Publishing Ravello Hot Start Environment ")
                return 1
        else:
            flaskapp.logger.error("Failed Creating Ravello Hot Start Environment ")
            return 1
    elif group['lab']['type'] == "azure":
        name = "hot" + str(format(group['createdEnvs'], '03d')) + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10))
        password = ''.join(random.SystemRandom().choice(
            string.ascii_uppercase + string.digits + string.ascii_lowercase + string.punctuation) for _ in range(16))

        template = None

        if group['lab']['template'] != "":
            template = group['lab']['template']

        result = create_azure_env(name,password,group['lab']['region'], template)

        if result != 1:
            flaskapp.logger.info("Created Azure Hot Start Environment " + name)
            env['azure_email'] = name + "@azure.panw-labs.net"
            env['azure_password'] = password
            env['azure_name'] = name
            env['publishedTime'] = datetime.datetime.utcnow()
        else:
            flaskapp.logger.error("Failed Creating Azure Hot Start Environment " + name)
            delete_azure_by_username(name)
            return 1

    HOT_COLLECTION.update_one({'_id': group['_id']},{'$inc': {"createdEnvs": 1}, '$push': {'envs': env}})


def create_hot_class(scheduledClass):
    CLASS_COLLECTION.update_one({'_id': scheduledClass['_id']},{'$set': {"lastPublished":datetime.datetime.utcnow() }})

    current = datetime.datetime.utcnow()
    settings = SETTINGS_COLLECTION.find_one()
    env = {}
    duration = int((scheduledClass['endTime'] -
                    current).total_seconds() / 60)

    scheduledClass = CLASS_COLLECTION.find_one({"_id":scheduledClass['_id']})

    if scheduledClass['lab']['type'] == "ravello":
        name = str(scheduledClass['id']) + "-hot" +  str(format(scheduledClass['createdEnvs'], '03d')) + "-" + scheduledClass['lab']['blueprint']["name"] + "-" + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10))
        env['env'] = create_env( name ,int(scheduledClass['lab']['blueprint']['id']))
        if env['env'] != 1:
            result = publish_env(env['env'], scheduledClass['lab'], duration)
            if result != 1:
                data = create_token(name, duration, env['env'])
                if data != 1:
                    flaskapp.logger.info("Created Ravello Hot Start Environment " + name)
                    env['token'] = data['token']
                    env['tokenID'] = data['tokenID']
                    env['publishedTime'] = datetime.datetime.utcnow()

                else:
                    flaskapp.logger.error("Failed Creating Ravello Hot Start Environment Token")
                    return 1
            else:
                flaskapp.logger.error("Failed Publishing Ravello Hot Start Environment ")
                return 1
        else:
            flaskapp.logger.error("Failed Creating Ravello Hot Start Environment ")
            return 1
    elif scheduledClass['lab']['type'] == "azure":
        name = str(scheduledClass['id']) + "-hot" + str(format(scheduledClass['createdEnvs'], '03d')) + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10))
        password = ''.join(random.SystemRandom().choice(
            string.ascii_uppercase + string.digits + string.ascii_lowercase + string.punctuation) for _ in range(16))

        template = None

        if scheduledClass['lab']['template'] != "":
            template = scheduledClass['lab']['template']

        result = create_azure_env(name,password,scheduledClass['lab']['region'], template)

        if result != 1:
            flaskapp.logger.info("Created Azure Hot Start Environment " + name)
            env['azure_email'] = name + "@azure.panw-labs.net"
            env['azure_password'] = password
            env['azure_name'] = name
            env['publishedTime'] = datetime.datetime.utcnow()
        else:
            flaskapp.logger.error("Failed Creating Azure Hot Start Environment " + name)
            delete_azure_by_username(name)
            return 1

    CLASS_COLLECTION.update_one({'_id': scheduledClass['_id']},{'$inc': {"createdEnvs": 1}, '$push': {'envs': env}})




def create_apps(scheduledClass):
    CLASS_COLLECTION.update_one({
        'id': scheduledClass['id']
    }, {
        '$set':  {"lastPublished":datetime.datetime.utcnow()}
    })
    settings = SETTINGS_COLLECTION.find_one()

    for i in range(scheduledClass['createdEnvs'], int(min(scheduledClass['createdEnvs'] + scheduledClass['blockSize'], scheduledClass['envs']))):
        current = datetime.datetime.utcnow()

        # Duration is current time until the end of the scheduledClass
        duration = int((scheduledClass['endTime'] -
                        current + datetime.timedelta(minutes=15)).total_seconds() / 60)

        exist = USERS_COLLECTION.find_one(
            {"email": scheduledClass['baseName'] + str(format(i, '03d'))})
        if exist:
            flaskapp.logger.critical("The user " + scheduledClass['baseName'] + str(format(i, '03d')) +" already exists in the database!")
            scheduledClass['createdEnvs'] = scheduledClass['createdEnvs'] + 1
            CLASS_COLLECTION.update_one({
                'id': scheduledClass['id']
            }, {
                '$set': scheduledClass
            })
            continue


        newID = USERS_COLLECTION.insert_one(
            {"email": scheduledClass['baseName'] + str(format(i, '03d')),
             "password": werkzeug.security.generate_password_hash(scheduledClass['studentPass'], method='pbkdf2:sha256'),
             "role": "student",
             "duration": duration,
             "createdApp": False,
             "createdToken": False,
             "token": "",
             "env": "",
             "tokenID": "",
             "startTime": scheduledClass['startTime'] - datetime.timedelta(minutes=15),
             "endTime": scheduledClass['endTime'] + datetime.timedelta(minutes=int(scheduledClass['endBuffer'])),
             "publishedTime": "",
             "loggedIn":False,
             "lab": scheduledClass['lab']
             }).inserted_id

        user = USERS_COLLECTION.find_one(
            {"_id": newID})

        if scheduledClass['lab']['type'] == "ravello":
            result = create_env(user['email'] + "-" + user['lab']['blueprint']["name"],int(user['lab']['blueprint']['id']))
        else:
            name = user['email'].split("@")[0] + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10))
            password = ''.join(random.SystemRandom().choice(
                string.ascii_uppercase + string.digits + string.ascii_lowercase + string.punctuation) for _ in range(16))

            template = None
            if scheduledClass['lab']['template'] != "":
                template = scheduledClass['lab']['template']

            result = create_azure_env(name, password,scheduledClass['lab']['region'], template)

        if result == 1: # Error creating user
            scheduledClass['createdEnvs'] = scheduledClass['createdEnvs'] + 1
            CLASS_COLLECTION.update_one({
                'id': scheduledClass['id']
            }, {
                '$set': scheduledClass
            })
            continue
        else:
            if scheduledClass['lab']['type'] == "ravello":
                flaskapp.config['USERS_COLLECTION'].update_one({
                    'email': user['email']
                }, {
                    '$set': {
                        'createdApp':  True,
                        'env': result
                    }
                })
                user = USERS_COLLECTION.find_one(
                    {"_id": newID})

                result = publish_env(user['env'],user['lab'],user['duration'])
                if result != 1:

                    result1 = create_token(user['email'] + "-" + user['lab']['blueprint']["name"],user['duration'],user['env'])

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
                        scheduledClass['createdEnvs'] = scheduledClass['createdEnvs'] + 1
                        CLASS_COLLECTION.update_one({
                            'id': scheduledClass['id']
                        }, {
                            '$set': scheduledClass
                        })
                        continue
                else:
                    scheduledClass['createdEnvs'] = scheduledClass['createdEnvs'] + 1
                    CLASS_COLLECTION.update_one({
                        'id': scheduledClass['id']
                    }, {
                        '$set': scheduledClass
                    })
                    continue
            else:
                user['createdApp'] = True
                user['createdToken'] = True
                user['publishedTime'] = datetime.datetime.utcnow()
                user['azure_email'] = name + "@azure.panw-labs.net"
                user['azure_password'] = password
                user['azure_name'] = name

                flaskapp.config['USERS_COLLECTION'].update_one({
                    'email': user['email']
                }, {
                    '$set': user
                })

        flaskapp.logger.info("Created App " + scheduledClass['baseName'] + str(i))
        scheduledClass['createdEnvs'] = scheduledClass['createdEnvs'] + 1
        CLASS_COLLECTION.update_one({
            'id': scheduledClass['id']
        }, {
            '$set': scheduledClass
        })

while True:
    check()

    time.sleep(3)
