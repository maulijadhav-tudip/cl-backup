from .user import User
from .resourcegroup import ResourceGroup
from app import flaskapp
import random
import string
import datetime
from azure.mgmt.resource.subscriptions import SubscriptionClient
from azure.common.client_factory import get_client_from_cli_profile
VERIFY = not flaskapp.config['DEBUG']


def get_locations(subscription_id):
    client = get_client_from_cli_profile(SubscriptionClient)
    regions = []
    for item in client.subscriptions.list_locations(subscription_id=subscription_id):
        regions.append({"name": item.name, "display_name": item.display_name})
    return regions


def create_azure_env(name, password, region, template=None):
    rg = ResourceGroup(name, region['name'])
    azure_user = User(user_principal_name=name + "@azure.panw-labs.net", display_name=name,
                      mail_nickname=name, password=password, subscription_id=flaskapp.config["AZURE_SUBSCRIPTION"], verify=VERIFY)
    try:
        azure_user.create()
        flaskapp.logger.info("Azure User " + name +
                             "@azure.panw-labs.net created")
    except Exception as e:
        flaskapp.logger.error("Error Creating User " +
                              name + "@azure.panw-labs.net: " + str(e))
        return 1

    try:
        rg.create()
        flaskapp.logger.info("Azure Resource Group " + name + " created")
    except Exception as e:
        flaskapp.logger.error(
            "Error Creating ResourceGroup " + name + ": " + str(e))
        return 1

    if template:
        try:
            rg.deploy_template(template, {})
            flaskapp.logger.info("Template Deployed")
        except Exception as e:
            flaskapp.logger.error("Deploying Template: " + str(e))
            return 1

    try:
        azure_user.assign_resource_group(name)
        flaskapp.logger.info("Resource group " + name + " assigned to user.")
    except Exception as e:
        flaskapp.logger.error(
            "Error assigning resource group " + name + ": " + str(e))
        return 1

    return 0


def delete_azure_by_username(username):
    try:
        rg = ResourceGroup(username)
        rg.destroy()
        flaskapp.logger.info("Azure Resource Group " + username + " deleted.")
    except Exception as e:
        flaskapp.logger.error(
            "Deletion of Azure Resource Group " + username + " failed: " + str(e))
    try:
        azure_user = User(user_principal_name=username + "@azure.panw-labs.net",
                          subscription_id=flaskapp.config["AZURE_SUBSCRIPTION"], verify=VERIFY)
        azure_user.destroy()
        flaskapp.logger.info("Azure User " + username + " deleted.")
    except Exception as e:
        flaskapp.logger.error(
            "Deletion of Azure User " + username + " failed: " + str(e))

    return 0


def delete_azure_by_email(email):
    user = flaskapp.config['USERS_COLLECTION'].find_one(
        {"email": email})
    if user:
        if 'azure_email' in user.keys():
            try:
                rg = ResourceGroup(user['azure_name'])
                rg.destroy()
                flaskapp.logger.info(
                    "Azure Resource Group " + user['azure_name'] + " deleted.")
            except Exception as e:
                flaskapp.logger.error(
                    "Deletion of Azure Resource Group " + user['azure_name'] + " failed: " + str(e))
            try:
                azure_user = User(
                    user_principal_name=user['azure_name'] + "@azure.panw-labs.net", subscription_id=flaskapp.config["AZURE_SUBSCRIPTION"], verify=VERIFY)
                azure_user.destroy()
                flaskapp.logger.info(
                    "Azure User " + user['azure_email'] + " deleted.")
            except Exception as e:
                flaskapp.logger.error(
                    "Deletion of Azure User " + user['azure_email'] + " failed: " + str(e))

        return 0


def create_or_assign_azure(name, lab):
    hot = flaskapp.config['HOT_COLLECTION'].find_one({"lab._id": lab['_id'], "startTime": {"$lt": (
        datetime.datetime.utcnow() + datetime.timedelta(minutes=15))}, "endTime": {"$gt": datetime.datetime.utcnow()}})
    if hot and len(hot['envs']) > 0:
        flaskapp.config['HOT_COLLECTION'].update_one({'_id': hot['_id']}, {
            '$inc': {"usedEnvs": 1}}, upsert=True)
        return hot['envs'][0]
    else:
        return create_env(name, int(lab['blueprint']['id']))


def create_or_assign_azure_to_user(user):
    if not user['createdApp']:
        hot = flaskapp.config['HOT_COLLECTION'].find_one({"lab._id": user['lab']['_id'], "startTime": {"$lt": (
            datetime.datetime.utcnow() + datetime.timedelta(minutes=15))}, "endTime": {"$gt": datetime.datetime.utcnow()}})
        if hot and len(hot['envs']) > 0:
            env = hot['envs'][0]

            flaskapp.config['HOT_COLLECTION'].update_one(
                {'_id': hot['_id']},
                {'$pull': {'envs': {'azure_name': env['azure_name']}}})

            flaskapp.config['HOT_COLLECTION'].update_one({'_id': hot['_id']}, {
                '$inc': {"usedEnvs": 1}}, upsert=True)

            flaskapp.config['USERS_COLLECTION'].update_one({
                'email': user['email']
            }, {
                '$set': {
                    'createdApp':  True,
                    'azure_name': env['azure_name'],
                    'azure_password': env['azure_password'],
                    'azure_email': env['azure_email'],
                    'publishedTime': env['publishedTime'],
                    'createdToken': True,
                    'startTime': datetime.datetime.utcnow(),
                    'endTime': datetime.datetime.utcnow() + datetime.timedelta(minutes=int(user['duration']))
                }
            })

        else:
            name = user['email'].split("@")[0] + ''.join(random.SystemRandom().choice(
                string.ascii_uppercase + string.digits) for _ in range(10))
            password = ''.join(random.SystemRandom().choice(
                string.ascii_uppercase + string.digits + string.ascii_lowercase + string.punctuation) for _ in range(16))

            template = None

            if user['lab']['template'] != "":
                template = user['lab']['template']
            result = create_azure_env(
                name, password, user['lab']['region'], template)

            if result != 1:
                if user['startTime'] == "":
                    user['startTime'] = datetime.datetime.utcnow()
                    user['endTime'] = datetime.datetime.utcnow(
                    ) + datetime.timedelta(minutes=int(user['duration']))
                user['publishedTime'] = datetime.datetime.utcnow()
                user['createdApp'] = True
                user['createdToken'] = True
                user['azure_email'] = name + "@azure.panw-labs.net"
                user['azure_password'] = password
                user['azure_name'] = name

                flaskapp.config['USERS_COLLECTION'].update_one({
                    'email': user['email']
                }, {
                    '$set': user
                })
            else:
                delete_azure_by_username(name)
                return 1
    return 0
