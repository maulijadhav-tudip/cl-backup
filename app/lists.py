from app import flaskapp
from flask import request, Response
from bson import json_util
import json
import requests
from .login import *
from werkzeug import secure_filename
import os
import csv

@flaskapp.route('/api/black/upload', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def upload_black():
    flaskapp.config['BLACKLIST'].remove({})
    f = request.files['black-file']
    f.save(secure_filename(f.filename))
    filename = f.filename

    with open(filename) as csv_file:
        reader = csv.DictReader(csv_file, dialect=csv.excel_tab)
        for row in reader:
            flaskapp.config['BLACKLIST'].insert_one(
                {"email": row["email"]})

    os.remove(filename)
    return Response('OK')


@flaskapp.route('/api/white/upload', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def upload_white():
    flaskapp.config['WHITELIST'].remove({})
    f = request.files['white-file']
    f.save(secure_filename(f.filename))
    filename = f.filename

    with open(filename) as csv_file:
        reader = csv.DictReader(csv_file, dialect=csv.excel_tab)
        for row in reader:
            flaskapp.config['WHITELIST'].insert_one(
                {"email": row["email"]})

    os.remove(filename)
    return Response('OK')


@flaskapp.route('/api/black')
@login_required(role=['admin', 'instructor'])
def get_black():
    users = []
    cursor = flaskapp.config['BLACKLIST'].find()
    for item in cursor:
        users.append(item)
    return json.dumps(users, default=json_util.default)


@flaskapp.route('/api/white')
@login_required(role=['admin', 'instructor'])
def get_white():
    users = []
    cursor = flaskapp.config['WHITELIST'].find()
    for item in cursor:
        users.append(item)
    return json.dumps(users, default=json_util.default)


@flaskapp.route('/api/black', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_black():
    cursor = flaskapp.config['BLACKLIST'].insert_one({"email":request.form['email']})
    return json.dumps({}, default=json_util.default)


@flaskapp.route('/api/white', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_white():
    cursor = flaskapp.config['WHITELIST'].insert_one({"email":request.form['email']})
    return json.dumps({}, default=json_util.default)


@flaskapp.route('/api/white/<email>/delete', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def delete_white(email):

    flaskapp.config['WHITELIST'].delete_many({
        'email': email
    })

    return Response('OK')

@flaskapp.route('/api/black/<email>/delete', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def delete_black(email):

    flaskapp.config['BLACKLIST'].delete_many({
        'email': email
    })

    return Response('OK')

def verify_email(email):
    if flaskapp.config['WHITELIST'].find_one({"email": "*@"+email.split("@")[1]}):
        return True
    if flaskapp.config['BLACKLIST'].find_one({"email": "*@"+email.split("@")[1]}):
        return False
    if flaskapp.config['BLACKLIST'].find_one({"email": email}):
        return False
    if flaskapp.config['WHITELIST'].find_one({"email": email}) or flaskapp.config['WHITELIST'].find().count() == 0:
        return True
    return False
