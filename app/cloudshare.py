from app import flaskapp
from flask import request, Response
from .login import *
import json
import time
import random
import string
import hashlib
import requests
from bson.objectid import ObjectId


@flaskapp.route('/api/cloudshare/projects', methods=['GET', 'POST'])
@login_required(role="admin")
def projects():
    if request.method == "GET":
        res = cloudshareRequest(hostname='use.cloudshare.com',
                                method='GET',
                                path='projects',
                                apiId=flaskapp.config['CLOUDSHARE_ID'],
                                apiKey=flaskapp.config['CLOUDSHARE_KEY'])
        return res.text
    if request.method == "POST":
        settings = flaskapp.config['SETTINGS_COLLECTION'].find_one()
        flaskapp.config['SETTINGS_COLLECTION'].update_one({
            '_id': settings['_id']
        },
            {'$set': {"cloudshareProject": json.loads(request.form['project'])
                      }}, upsert=True)
        return Response("OK")


@flaskapp.route('/api/cloudshare/policies', methods=['GET', 'POST'])
@login_required(role="admin")
def policies():
    settings = flaskapp.config['SETTINGS_COLLECTION'].find_one()
    if request.method == "GET":
        res = cloudshareRequest(hostname='use.cloudshare.com',
                                method='GET',
                                path='projects/' +
                                settings['cloudshareProject']['id'] +
                                '/policies',
                                apiId=flaskapp.config['CLOUDSHARE_ID'],
                                apiKey=flaskapp.config['CLOUDSHARE_KEY'])
        return res.text
    if request.method == "POST":
        flaskapp.config['SETTINGS_COLLECTION'].update_one({
            '_id': settings['_id']
        },
            {'$set': {"cloudsharePolicy": json.loads(request.form['policy'])
                      }}, upsert=True)
        return Response("OK")


@flaskapp.route('/api/cloudshare/blueprints')
@login_required(role="admin")
def cloudshare_blueprints():
    settings = flaskapp.config['SETTINGS_COLLECTION'].find_one()
    res = cloudshareRequest(hostname='use.cloudshare.com',
                            method='GET',
                            path='projects/' +
                            settings['cloudshareProject']['id'] +
                            '/blueprints',
                            apiId=flaskapp.config['CLOUDSHARE_ID'],
                            apiKey=flaskapp.config['CLOUDSHARE_KEY'])
    return res.text


@flaskapp.route('/api/cloudshare/regions')
@login_required(role="admin")
def cloudshare_regions():
    res = cloudshareRequest(hostname='use.cloudshare.com',
                            method='GET',
                            path='regions/',
                            apiId=flaskapp.config['CLOUDSHARE_ID'],
                            apiKey=flaskapp.config['CLOUDSHARE_KEY'])
    return res.text


@flaskapp.route('/api/cloudshare/labs', methods=['POST'])
@login_required(role="admin")
def cloudshare_lab():
    flaskapp.config['LAB_COLLECTION'].insert_one(
        {"name": request.form['name'],
         "blueprint": json.loads(request.form['blueprint']),
         "region": json.loads(request.form['region']),
         "description": request.form['description'],
         "type": "cloudshare",
         "enabled": request.form['enabled'],
         "optimizationLevel":""
         })
    return Response('OK')


@flaskapp.route('/api/cloudshare/labs/<id>', methods=['POST'])
@login_required(role="admin")
def cloudshare_lab_edit(id):

    flaskapp.config['LAB_COLLECTION'].update_one({
        '_id': ObjectId(id)
    }, {
        '$set': {
            "name": request.form['name'],
            "blueprint": json.loads(request.form['blueprint']),
            "region": json.loads(request.form['region']),
            "enabled": request.form['enabled'],
            "description": request.form['description']
        }})
    return Response('OK')


def invite(firstname, lastname, email,  lab):
    flaskapp.logger.info("Sending Cloudshare Invite")
    settings = flaskapp.config['SETTINGS_COLLECTION'].find_one()
    data = {
        "policyId": settings['cloudsharePolicy']['id'],
        "blueprintId": lab['blueprint']['id'],
        "opportunity": flaskapp.config['CLOUDSHARE_OPPORTUNITY'],
        "validForDays": int(flaskapp.config['REQUEST_EXPIRATION']),
        "email": email,
        "firstName": firstname,
        "lastName": lastname,
        "regionId": lab['region']['id']
        }
    request = cloudshareRequest(hostname='use.cloudshare.com',
                            method='POST',
                            path='invitations/actions/inviteendusertoblueprint',
                            apiId=flaskapp.config['CLOUDSHARE_ID'],
                            apiKey=flaskapp.config['CLOUDSHARE_KEY'],
                            content=data)
    flaskapp.logger.info(request.text)
    return request.status_code


def cloudshareRequest(hostname, method, apiId, apiKey, path="", content=None):
    url = build_url(hostname, path)
    json_content = json.dumps(content) if content is not None else None
    headers = build_headers(apiId, apiKey, url)
    res = requests.request(
        method, url, headers=headers, data=json_content,verify= not flaskapp.config['DEBUG'])
    return res


def build_headers(apiId, apiKey, url):
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'cs_sha1 %s' % authenticationParameterProvider(apiId=apiId,
                                                                        apiKey=apiKey,
                                                                        url=url)
    }


def build_url(hostname, path):
    base = "https://%s/api/v3/%s" % (hostname,
                                     condition_path_string(path))
    return base


def condition_path_string(path):
    return '/'.join(path.strip('/ ').split('/'))


def authenticationParameterProvider(apiId, apiKey, url):
    timestamp = int(time.time())
    token = generate()
    return "userapiid:%s;timestamp:%d;token:%s;hmac:%s" % (
        apiId,
        timestamp,
        token,
        hash("%s%s%d%s" % (apiKey, url, timestamp, token)))


def generate():
    alphabet = string.ascii_lowercase + string.ascii_uppercase + string.digits
    return ''.join(random.choice(alphabet) for _ in range(10))


def hash(input):
    hmac = hashlib.sha1()
    hmac.update(input.encode('utf-8'))
    return hmac.hexdigest()
