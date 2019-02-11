# Contains main views for login and routing
from app import flaskapp
from flask import request, redirect, render_template, url_for,  Response
from bson import json_util
from werkzeug.security import generate_password_hash
import json
import time
import datetime
from .user import User
from .ravello.ravello import *
from .azure.functions import create_or_assign_azure_to_user
from .login import *
from .lists import verify_email
import logging

# Home page


@flaskapp.route('/api/login')
@login_required()
def login():
        auth = request.authorization
        user = flaskapp.config['USERS_COLLECTION'].find_one(
            {"email": auth['username']})

        if 'expirationTime' in user.keys() and user['expirationTime'] < datetime.datetime.utcnow():
            return jsonify({ "status": "Error"}), 403

        flaskapp.config['USERS_COLLECTION'].update_one({
            "email": auth['username']
        }, {
            '$set': {
                'loggedIn':  True
            }
        })

        token = generate_auth_token(user)
        if user['role'] == "student":
            if user['lab']['type'] == "ravello":
                create_or_assign_env_to_user(user)
            elif user['lab']['type'] == "azure":
                create_or_assign_azure_to_user(user)

        return jsonify({ "status": "OK",'token': token.decode('ascii'), 'role':user['role'] }), 200


@flaskapp.route('/api/userverify', methods=['POST'])
def verify_user():
    enteredClass = flaskapp.config['CLASS_COLLECTION'].find_one(
        {"secret": request.form['secret'], "id": request.form['id']})
    current = datetime.datetime.utcnow()

    if not enteredClass:
        return Response(""), 404 #Class does not exist

    if (enteredClass['startTime'] - datetime.timedelta(minutes=15)) < current and (enteredClass['endTime'] + datetime.timedelta(minutes=15)) > current:
        return json.dumps(enteredClass, default=json_util.default)

    else:
        return Response(""), 400 #Class currently not in session


@flaskapp.route('/api/userregister', methods=['POST'])
def register_user():
    if flaskapp.config['USERS_COLLECTION'].find_one({"email": request.form['email']}):
        return Response(""), 400

    if verify_email(request.form['email']):
        enteredClass = flaskapp.config['CLASS_COLLECTION'].find_one(
            {"secret": request.form['secret'], "id": request.form['id']})
        flaskapp.config['CLASS_COLLECTION'].update_one(
            {"secret": enteredClass['secret'],
                "id": enteredClass['id']},
            {'$inc': {"active": 1}})

        current = datetime.datetime.utcnow()
        duration = int((enteredClass['endTime'] -
                        current + datetime.timedelta(minutes=15)).total_seconds() / 60)

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
        flaskapp.config['USERS_COLLECTION'].insert_one(
            {"email": request.form['email'],
             "password": generate_password_hash(request.form['password'], method='pbkdf2:sha256'),
             "role": "student",
             "duration": duration,
             "createdApp": False,
             "createdToken": False,
             "token": "",
             "env": "",
             "tokenID": "",
             "loggedIn": True,
             "sfdc": enteredClass['sfdc'],
             "startTime": enteredClass['startTime'] - datetime.timedelta(minutes=15),
             "endTime": enteredClass['endTime'] + datetime.timedelta(minutes=int(enteredClass['endBuffer'])),
             "publishedTime": "",
             "lab": enteredClass['lab']

             })

        user = flaskapp.config['USERS_COLLECTION'].find_one(
            {"email": request.form['email']})


        # Create an entry for archival purposes
        student = {
            "classId": request.form['id'],
            "className": enteredClass['name'],
            "firstName": request.form['first'],
            "lastName": request.form['last'],
            "email": request.form['email'],
            "loginTime": current,
            "sfdc": enteredClass['sfdc'],
            "company": request.form['company'],
            "title": request.form['title'],
            "GPDR1": request.form['GPDR1'],
            "GPDR2": request.form['GPDR2'],
        }
        flaskapp.config['CLASS_ARCHIVES'].insert_one(student)

        token = generate_auth_token(user)
        if user['role'] == "student":
            if user['lab']['type'] == "ravello":
                publish_or_assign_env_to_user(user,enteredClass)
            elif user['lab']['type'] == "azure":
                create_or_assign_azure_to_user(user)

        return jsonify({ "status": "OK",'token': token.decode('ascii'), 'role':user['role'] }), 200

    return Response(""), 401


# Get current user


@flaskapp.route('/api/user')
@login_required(role=["student", "admin", "instructor"])
def get_current_user():
    auth = request.authorization
    user = verify_auth_token(auth['username'])
    return json.dumps(user, default=json_util.default)

# Get Time on server


@flaskapp.route('/api/time')
def server_time():
    return datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
