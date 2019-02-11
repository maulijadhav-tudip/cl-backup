from app import flaskapp
from flask import request,     Response
from bson import json_util
from werkzeug import secure_filename
from werkzeug.security import generate_password_hash
import json
import csv
import time
import datetime
import requests
import dateutil.parser
import io
import os
from .login import *
from .ravello.ravello import *
from .azure.functions import delete_azure_by_email

@flaskapp.route('/api/users')
@login_required(role=['admin', 'instructor'])
def get_data():
    users = []
    cursor = flaskapp.config['USERS_COLLECTION'].find()
    auth = request.authorization
    user = verify_auth_token(auth['username'])
    for item in cursor:
        # Only show Admins to other admins
        if item['role'] == "admin" and user['role'] != "admin":
            continue

        users.append(item)

    return json.dumps(users, default=json_util.default)


@flaskapp.route('/api/upload', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def upload():
    if request.method == 'POST':
        f = request.files['file']
        f.save(secure_filename(f.filename))
        filename = f.filename

        with open(filename) as csv_file:
            reader = csv.DictReader(csv_file, dialect=csv.excel_tab)
            for row in reader:

                user = flaskapp.config['USERS_COLLECTION'].find_one(
                    {"email": row["email"]})
                if user:
                    if user['lab']['type'] == "ravello":
                        delete_app_by_email(row["email"])
                    elif user['lab']['type'] == "azure":
                        delete_azure_by_email(row["email"])

                flaskapp.config['USERS_COLLECTION'].delete_many({
                    'email': row["email"]
                })
                flaskapp.config['USERS_COLLECTION'].insert_one({"email": row["email"],
                                                                "password": generate_password_hash(
                                                                    row["email"], method='pbkdf2:sha256'),
                                                                "role": "student",
                                                                "duration": 0,
                                                                "createdApp": False,
                                                                "createdToken": False,
                                                                "token": "",
                                                                "env": "",
                                                                "tokenID": "",
                                                                "publishedTime": "",
                                                                "startTime": "",
                                                                "endTime": "",
                                                                "loggedIn": False,
                                                                "lab": {"name": "", "blueprint": {'name': "", 'id': ""}, "region": "", "description": ""}})

        os.remove(filename)
        return Response('OK')


@flaskapp.route('/api/users', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add():
    try:
        lab = json.loads(request.form['lab'])
    except:
        lab = {}
        lab['name'] = ""
        lab['type'] = ""

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
    # Add the user to the DB based on the POSTed form data, don't add expirationTime field if time is blank
    if request.form['expirationTime'] == "":
        flaskapp.config['USERS_COLLECTION'].insert_one(
            {"email": request.form['email'],
             "password": generate_password_hash(request.form['password'], method='pbkdf2:sha256'),
             "role": request.form['role'],
             "duration": request.form['duration'],
             "createdApp": False,
             "createdToken": False,
             "token": "", "env": "",
             "tokenID": "",
             "publishedTime": "",
             "startTime": "",
             "endTime": "",
             "lab": lab,
             "loggedIn": False
             })

    else:
        flaskapp.config['USERS_COLLECTION'].insert_one(
            {"email": request.form['email'],
             "password": generate_password_hash(request.form['password'], method='pbkdf2:sha256'),
             "role": request.form['role'],
             "duration": request.form['duration'],
             "createdApp": False,
             "createdToken": False,
             "token": "", "env": "",
             "tokenID": "",
             "publishedTime": "",
             "startTime": "",
             "endTime": "",
             "lab": lab,
             "expirationTime": dateutil.parser.parse(request.form['expirationTime']),
             "loggedIn": False

             })
    return Response('OK')


@flaskapp.route('/api/users/<email>', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def update(email):
    try:
        lab = json.loads(request.form['lab'])
    except:
        lab = None

    if request.form['expirationTime'] == "":
        flaskapp.config['USERS_COLLECTION'].update_one({
            'email': email
        }, {
            '$set': {
                'duration': request.form['duration'] if request.form['duration'] != "" else flaskapp.config['USERS_COLLECTION'].find_one({"email": email})['duration'],
                'password': generate_password_hash(request.form['password'], method='pbkdf2:sha256') if request.form['password'] != "" else flaskapp.config['USERS_COLLECTION'].find_one({"email": email})['password'],
                "lab": lab if lab != None else flaskapp.config['USERS_COLLECTION'].find_one({"email": email})['lab']
            }
        })
        flaskapp.config['USERS_COLLECTION'].update_one({
            'email': email
        }, {
            '$unset': {
                "expirationTime": ""
            }
        })
    else:
        # Only update if values are changed using Ternary Conditional Operators
        # Blueprint and Optimization Level will always update due to how the HTML select picker works
        flaskapp.config['USERS_COLLECTION'].update_one({
            'email': email
        }, {
            '$set': {
                'duration': request.form['duration'] if request.form['duration'] != "" else flaskapp.config['USERS_COLLECTION'].find_one({"email": email})['duration'],
                'password': generate_password_hash(request.form['password'], method='pbkdf2:sha256') if request.form['password'] != "" else flaskapp.config['USERS_COLLECTION'].find_one({"email": email})['password'],
                "lab":  lab if lab != None else flaskapp.config['USERS_COLLECTION'].find_one({"email": email})['lab'],
                "expirationTime": dateutil.parser.parse(request.form['expirationTime'])
            }
        })

    return Response('OK')


@flaskapp.route('/api/users/<email>/extend', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def extend(email):
    if request.method == 'POST':
        # First update the user in the DB with a new endTime and duration
        flaskapp.config['USERS_COLLECTION'].update_one({
            'email': email
        }, {
            '$set': {
                'endTime':  dateutil.parser.parse(request.form['endTime']),
                'duration': int((dateutil.parser.parse(request.form['endTime']) -
                                 datetime.datetime.now(datetime.timezone.utc)).total_seconds() / 60)
            }
        })

        user = flaskapp.config['USERS_COLLECTION'].find_one(
            {"email": email})
        if user['lab']['type'] == "ravello":
            if user['createdApp']:
                set_env_expiration(str(user['env']), int(user['duration']))

            if user['createdToken']:
                update_token(str(user['token']), str(user['tokenID']), int(
                    user['duration']), str(user['env']))

        return Response('OK')


@flaskapp.route('/api/users/<email>/reset', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def reset(email):
    user = flaskapp.config['USERS_COLLECTION'].find_one(
        {"email": email})
    if user['lab']['type'] == "ravello":
        delete_app_by_email(email)
    elif user['lab']['type'] == "azure":
        delete_azure_by_email(email)

    flaskapp.config['USERS_COLLECTION'].update_one({
        'email': email
    }, {
        '$set': {
            'createdApp':  False,
            'createdToken': False,
            'token': "",
            'env': "",
            'tokenID': "",
            'publishedTime': "",
            'startTime': "",
            'endTime': "",
            "azure_email" : "",
            "azure_password":"",
            "azure_name" : ""
        }
    })

    return Response('OK')


@flaskapp.route('/api/users/<email>/delete', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def delete(email):

    user = flaskapp.config['USERS_COLLECTION'].find_one(
        {"email": email})
    if user['role'] == "student":
        if user['lab']['type'] == "ravello":
            delete_app_by_email(email)
        elif user['lab']['type'] == "azure":
            delete_azure_by_email(email)

    flaskapp.config['USERS_COLLECTION'].delete_many({
        'email': email
    })

    return Response('OK')

@flaskapp.route('/api/users/<email>')
@login_required(role=['admin', 'instructor'])
def get_user(email):

    user = flaskapp.config['USERS_COLLECTION'].find_one({
        'email': email
    })

    return json.dumps(user, default=json_util.default)
