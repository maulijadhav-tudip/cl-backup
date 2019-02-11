from app import flaskapp
from flask import request, Response
from bson import json_util
from bson.objectid import ObjectId
import json
import requests
import dateutil.parser
from .login import *
import datetime
from .ravello.ravello import *
from .azure.functions import delete_azure_by_username

@flaskapp.route('/api/groups', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def create_group():
    try:
        lab = json.loads(request.form['lab'])
    except:
        lab = {}
        lab['name'] = ""
    flaskapp.config['HOT_COLLECTION'].insert_one(
        {"lab": lab,
         "hotenvs": request.form['hotenvs'],
         "endTime": dateutil.parser.parse(request.form['endTime']),
         "startTime": dateutil.parser.parse(request.form['startTime']),
         "lastPublished": datetime.datetime.utcnow(),
         "blockSize": int(request.form['block']),
         "blockDelay": int(request.form['delay']),
         "buffer": int(request.form['buffer']),
         "tz": request.form['tz'],
         "createdEnvs": 0,
         "usedEnvs": 0,
         "envs": []
         })

    return Response('OK')


@flaskapp.route('/api/groups/<id>/delete', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def delete_group(id):

    group = flaskapp.config['HOT_COLLECTION'].find_one({"_id":ObjectId(id)})
    for item in group['envs']:
        if group['lab']['type'] == "ravello":
            delete_env(item['env'])
            delete_token(item['tokenID'])
        else:
            delete_azure_by_username(item['azure_name'])
    flaskapp.config['HOT_COLLECTION'].delete_one({"_id":ObjectId(id)})

    return Response('OK')


@flaskapp.route('/api/groups')
@login_required(role=['admin', 'instructor'])
def get_groups():
    cursor = flaskapp.config['HOT_COLLECTION'].find()
    results = []
    for item in cursor:
        item['time'] = {
            "start": item['startTime'],
            "end": item['endTime'],
            "tz": item['tz'],
            "deploy":item['startTime'] - datetime.timedelta(minutes=item['buffer'])
        }

        item['startTz'] = {
        "start": item['startTime'],
        "tz": item['tz']
        }
        item['endTz'] = {
        "end": item['endTime'],
        "tz": item['tz']
        }

        results.append(item)
    return json.dumps(results, default=json_util.default)
