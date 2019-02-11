from app import flaskapp
from flask import request, redirect,  url_for,  Response
import time
import datetime
import requests
from .login import *
from .ravello.ravello import *
from .azure.functions import create_azure_env
import random
import string

@flaskapp.route('/api/app')
@login_required(role="student")
def create_app():
    auth = request.authorization
    user = verify_auth_token(auth['username'])
    if user['lab']['type'] == "ravello":
        result = create_env(user['email'] + "-" + user['lab']
                            ['blueprint']["name"], int(user['lab']['blueprint']['id']))

        if result != 1:
            flaskapp.config['USERS_COLLECTION'].update_one({
                'email': user['email']
            }, {
                '$set': {
                    'createdApp':  True,
                    'env': result
                }
            })

            return Response(""), 200
        else:
            return Response(""), 500
    else:
        name = user['email'].split("@")[0] + ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10))
        password = ''.join(random.SystemRandom().choice(
            string.ascii_uppercase + string.digits + string.ascii_lowercase + string.punctuation) for _ in range(16))

        template = None

        if user['lab']['template'] != "":
            template = user['lab']['template']
        result = create_azure_env(name,password,user['lab']['region'], template)

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
            return Response(""), 200
        else:
            return Response(""), 500


@flaskapp.route('/api/token')
@login_required(role="student")
def publish():
    auth = request.authorization
    user = verify_auth_token(auth['username'])

    result = publish_env(user['env'], user['lab'], user['duration'])
    if result != 1:

        if user['startTime'] == "":
            user['startTime'] = datetime.datetime.utcnow()
            user['endTime'] = datetime.datetime.utcnow(
            ) + datetime.timedelta(minutes=int(user['duration']))

        result1 = create_token(user['email'] + "-" + user['lab']
                               ['blueprint']["name"], user['duration'], user['env'])

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

            return Response(""), 200
        else:
            return Response(""), 500
    else:
        return Response(""), 500


@flaskapp.route('/api/remaining')
@login_required(role='student')
def time_remaining():
    auth = request.authorization
    user = verify_auth_token(auth['username'])

    if user['publishedTime'] != "":
        return str(int(((user['startTime'] + 
                        datetime.timedelta(minutes=int(user['duration']))) -
                        datetime.datetime.utcnow()).total_seconds() / 60)).split('.')[0]
    else:
        return str(0)
