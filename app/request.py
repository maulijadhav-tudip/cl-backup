from app import flaskapp
from flask import request, Response
from bson import json_util
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash
from .user import User
from .login import *
import datetime
from datetime import timedelta
import random
import string
from .email import sendEmail
from .cloudshare import invite
import dateutil.parser
import io
import csv
from string import Template
from .ravello.ravello import *
from .lists import verify_email
from .azure.functions import delete_azure_by_email
from .qwiklabs.tokens import create_qwiklab_tokens


@flaskapp.route('/api/request', methods=['POST'])
def request_lab():
    filein = open('email.txt')
    htmlbody = Template(filein.read())
    textbody = htmlbody

    filein = open('token.txt')
    htmlbodytoken = Template(filein.read())
    textbodytoken = htmlbodytoken

    flaskapp.config['REQUEST_ARCHIVE'].insert_one({
        "first": request.form['first'],
        "last": request.form['last'],
        "email": request.form['email'],
        "lab": json.loads(request.form['lab']),
        "requestedOn": datetime.datetime.utcnow(),
        "requestId": ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10)),
        "requestedEnvs": 1,
        "approvedOn": datetime.datetime.utcnow(),
        "GPDR1": request.form['GPDR1'],
        "GPDR2": request.form['GPDR2'],
        "seatNumber": request.form['seatNumber']
    })
    # If the user is on the whitelist or the whitelist is empty
    if verify_email(request.form['email']):
        user = flaskapp.config['USERS_COLLECTION'].find_one(
            {"email": request.form["email"]})
        if user:
            if user['lab']['type'] == "ravello":
                delete_app_by_email(request.form["email"])
            elif user['lab']['type'] == "azure":
                delete_azure_by_email(request.form["email"])

        flaskapp.config['USERS_COLLECTION'].delete_many({
            'email': request.form['email']
        })

        user = flaskapp.config['REQUEST_COLLECTION'].find_one(
            {"email": request.form['email']})

        if not user:
            flaskapp.config['REQUEST_COLLECTION'].insert_one({
                "first": request.form['first'],
                "last": request.form['last'],
                "email": request.form['email'],
                "lab": json.loads(request.form['lab']),
                "requestedOn": datetime.datetime.utcnow(),
                "requestId": ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10)),
                "requestedEnvs": 1,
                "approvedOn": datetime.datetime.utcnow(),
                "lastCleared":datetime.datetime.utcnow(),
                "seatNumber": request.form['seatNumber']
            })
        else:
            if user['requestedEnvs'] < int(flaskapp.config['REQUEST_LIMIT']):
                flaskapp.config['REQUEST_COLLECTION'].update_one({
                    'email': request.form['email']
                },
                    {'$set': {"requestedEnvs": user['requestedEnvs'] + 1,
                              "lab": json.loads(request.form['lab']),
                              "requestedOn": datetime.datetime.utcnow(),
                              "requestId": ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10)),
                              "approvedOn": datetime.datetime.utcnow(),
                              "seatNumber": request.form['seatNumber']}}, upsert=True)

            else:
                flaskapp.config['REQUEST_COLLECTION'].update_one({
                    'email': request.form['email']
                },
                    {'$set': {"requestedOn": datetime.datetime.utcnow()}})
                return Response(""), 403

        if json.loads(request.form['lab'])['type'] == 'ravello' or json.loads(request.form['lab'])['type'] == 'azure' or json.loads(request.form['lab'])['type'] == 'custom' or json.loads(request.form['lab'])['type'] == 'qwiklab' :
            user = flaskapp.config['REQUEST_COLLECTION'].find_one(
                {"email": request.form['email']})
            password = ''.join(random.SystemRandom().choice(
                string.ascii_uppercase + string.digits) for _ in range(10))
            flaskapp.config['USERS_COLLECTION'].insert_one(
                {"email": user['email'],
                 "password": generate_password_hash(password, method='pbkdf2:sha256'),
                 "role": "student",
                 "duration": flaskapp.config['REQUEST_DURATION'],
                 "createdApp": False,
                 "createdToken": False,
                 "token": "", "env": "",
                 "loggedIn": False,
                 "tokenID": "",
                 "publishedTime": "",
                 "startTime": "",
                 "endTime": "",
                 "lab": user['lab'],
                 "expirationTime": datetime.datetime.utcnow() + timedelta(days=7),
                 "seatNumber": request.form['seatNumber']})

            if json.loads(request.form['lab'])['type'] == 'qwiklab':
                labID = json.loads(request.form['lab'])['_id']
                tag = request.form['tag'] + "_" + request.form['email']
                number = request.form['number']
                expiration = request.form['expiration']
                tokenID = ''.join(random.choice('0123456789ABCDEF') for i in range(16))
                tokens = create_qwiklab_tokens("", tag, int(number), expiration)
                token_details = flaskapp.config['TOKEN_DETAILS_COLLECTION'].insert_one(
                    {'tokenID': tokenID, 'userID': user['email'], 'labID': labID, 'tag': tag, 'numberOfTokens': number,
                     'expiration': expiration, "createdAt": datetime.datetime.utcnow(), 'tokens':tokens})


            sendEmail(user['email'], htmlbody.substitute(
                id=user['requestId'], password=password, url=flaskapp.config['FQDN']), textbody.substitute(
                    id=user['requestId'], password=password, url=flaskapp.config['FQDN']))
        elif json.loads(request.form['lab'])['type'] == 'cloudshare':
            return Response(""), invite(request.form['first'], request.form['last'],
                   request.form['email'], json.loads(request.form['lab']))
        elif json.loads(request.form['lab'])['type'] == 'qwiklab_one':
            labID = json.loads(request.form['lab'])['_id']
            lab = flaskapp.config['LAB_COLLECTION'].find_one({"_id": ObjectId(labID)})
            tag = lab['tag'] + "_" + request.form['email']
            number = 1
            expiration = lab['expiration']
            tokenID = ''.join(random.choice('0123456789ABCDEF') for i in range(16))
            tokens = create_qwiklab_tokens("", tag, int(number), expiration)
            token_details = flaskapp.config['TOKEN_DETAILS_COLLECTION'].insert_one(
                {'tokenID': tokenID, 'userID': request.form['email'], 'labID': labID, 'tag': tag, 'numberOfTokens': number,
                 'expiration': expiration, "createdAt": datetime.datetime.utcnow(), 'tokens':tokens})
            sendEmail(request.form['email'], htmlbodytoken.substitute(
                token=tokens[0]), textbodytoken.substitute(token=tokens[0]))
        return Response(""), 200
    else:
        # Log the request, but then error out
        flaskapp.config['REQUEST_COLLECTION'].update_one({
            'email': request.form['email']
        },
            {'$set': {
                "first": request.form['first'],
                "last": request.form['last'],
                "email": request.form['email'],
                "lab": json.loads(request.form['lab']),
                "requestedOn": datetime.datetime.utcnow(),
                "requestId": ''.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits) for _ in range(10)),
                "approvedOn": "",
                "lastCleared":datetime.datetime.utcnow(),
                "seatNumber": request.form['seatNumber']
            }}, upsert=True)
        flaskapp.config['REQUEST_COLLECTION'].update_one({
            'email': request.form['email']
        },
            {'$inc': {
                "requestedEnvs": 1
            }}, upsert=True)
        return Response(""), 401


@flaskapp.route('/api/requests')
@login_required(role=['admin', 'instructor'])
def request_data():
    results = []
    cursor = flaskapp.config['REQUEST_COLLECTION'].find()
    for item in cursor:
        results.append(item)
    return json.dumps(results, default=json_util.default)


@flaskapp.route('/api/tokendetails')
@login_required(role=['student'])
def request_token_details():
    results = []
    auth = request.authorization
    user = verify_auth_token(auth['username'])

    cursor = flaskapp.config['TOKEN_DETAILS_COLLECTION'].find({'userID': user['email']})

    for item in cursor:
        results.append(item)
    return json.dumps(results, default=json_util.default)


@flaskapp.route('/api/exporttokens', methods=['POST'])
@login_required(role=['student'])
def export_tokens():
    auth = request.authorization
    user = verify_auth_token(auth['username'])

    cursor = flaskapp.config['TOKEN_DETAILS_COLLECTION'].find_one({'userID': user['email'], 'tag':request.form['tag']})
    formattedList = []
    for token in cursor['tokens']:
        token_dict = {}
        token_dict['tag'] = request.form['tag']
        token_dict['tokenID'] = token
        token_dict['expiration'] = request.form['expiration']
        formattedList.append(token_dict.copy())


    if len(formattedList) > 0:
        keys = formattedList[0].keys()
        result = io.StringIO()
        dict_writer = csv.DictWriter(result, keys)
        dict_writer.writeheader()
        dict_writer.writerows(formattedList)
        return result.getvalue()
    else:
        return ""


@flaskapp.route('/api/approve', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def approve():
    filein = open('email.txt')
    htmlbody = Template(filein.read())
    textbody = htmlbody

    filein = open('token.txt')
    htmlbodytoken = Template(filein.read())
    textbodytoken = htmlbodytoken

    flaskapp.config['REQUEST_COLLECTION'].update_one({
        'requestId': request.form['requestId']
    }, {'$set': {"approvedOn": datetime.datetime.utcnow()}}, upsert=True)

    requestUser = flaskapp.config['REQUEST_COLLECTION'].find_one(
        {"requestId": request.form['requestId']})

    if requestUser['lab']['type'] == 'ravello' or requestUser['lab']['type'] == 'azure' or requestUser['lab']['type'] == 'custom':

        user = flaskapp.config['USERS_COLLECTION'].find_one(
            {"email": requestUser["email"]})
        if user:
            if user['lab']['type'] == "ravello":
                delete_app_by_email(requestUser["email"])
            elif user['lab']['type'] == "azure":
                delete_azure_by_email(requestUser["email"])

        flaskapp.config['USERS_COLLECTION'].delete_many({
            'email': requestUser['email']
        })
        password = ''.join(random.SystemRandom().choice(
            string.ascii_uppercase + string.digits) for _ in range(10))

        flaskapp.config['USERS_COLLECTION'].insert_one(
            {"email": requestUser['email'],
             "password": generate_password_hash(password, method='pbkdf2:sha256'),
             "role": "student",
             "duration": flaskapp.config['REQUEST_DURATION'],
             "createdApp": False,
             "createdToken": False,
             "token": "", "env": "",
             "tokenID": "",
             "publishedTime": "",
             "loggedIn": False,
             "startTime": "",
             "endTime": "",
             "lab": requestUser['lab'],
             "expirationTime": datetime.datetime.utcnow() + timedelta(days=7),
             "seatNumber": requestUser['seatNumber']})

        sendEmail(requestUser['email'], htmlbody.substitute(
            id=requestUser['requestId'], password=password, url=flaskapp.config['FQDN']), textbody.substitute(
                id=requestUser['requestId'], password=password, url=flaskapp.config['FQDN']))
    elif json.loads(request.form['lab'])['type'] == 'cloudshare':
        return Response(""), invite(requestUser['first'], requestUser['last'],
               requestUser['email'], requestUser['lab'])
    return Response("OK")
