from app import flaskapp
from flask import request, Response
from bson import json_util
from werkzeug import secure_filename
import json
import csv
import datetime
import dateutil.parser
import io
from .login import *
from .ravello.ravello import *


@flaskapp.route('/api/blueprints')
@login_required(role=['admin', 'instructor'])
def blueprints_view():
    return blueprints()


@flaskapp.route('/api/classes', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_class():
    # Class with pre-created environments
    if request.form['type'] == "pregen":
        flaskapp.config['CLASS_COLLECTION'].insert_one(
            {"name": request.form['name'],
             "id": request.form['id'],
             "secret": request.form['secret'],
             "startTime": dateutil.parser.parse(request.form['startTime']),
             "endTime": dateutil.parser.parse(request.form['endTime']),
             "envs": int(request.form['envs']),
             "baseName": request.form['baseName'],
             "studentPass": request.form['studentPass'],
             "blockSize": int(request.form['blockSize']),
             "blockDelay": int(request.form['blockDelay']),
             "buffer": int(request.form['buffer']),
             "createdEnvs": 0,
             "sfdc": request.form['sfdc'],
             "lastPublished": datetime.datetime.utcnow(),
             "lab": json.loads(request.form['lab']),
             "timezone": request.form['timezone'],
             "type": request.form['type'],
             "endBuffer": request.form['endBuffer']
             })
    elif request.form['type'] == "normal":
        flaskapp.config['CLASS_COLLECTION'].insert_one(
            {"name": request.form['name'],
             "id": request.form['id'],
             "secret": request.form['secret'],
             "startTime": dateutil.parser.parse(request.form['startTime']),
             "endTime": dateutil.parser.parse(request.form['endTime']),
             "lab": json.loads(request.form['lab']),
             "timezone": request.form['timezone'],
             "max": int(request.form['max']),
             "sfdc": request.form['sfdc'],
             "active": 0,
             "type": request.form['type'],
             "endBuffer": request.form['endBuffer']
             })
    elif request.form['type'] == "hot":
        flaskapp.config['CLASS_COLLECTION'].insert_one(
            {"name": request.form['name'],
             "id": request.form['id'],
             "secret": request.form['secret'],
             "startTime": dateutil.parser.parse(request.form['startTime']),
             "endTime": dateutil.parser.parse(request.form['endTime']),
             "lab": json.loads(request.form['lab']),
             "timezone": request.form['timezone'],
             "max": int(request.form['max']),
             "sfdc": request.form['sfdc'],
             "active": 0,
             "type": request.form['type'],
             "endBuffer": request.form['endBuffer'],
             "hotenvs": request.form['hotenvs'],
             "lastPublished": datetime.datetime.utcnow(),
             "blockSize": int(request.form['blockSize']),
             "blockDelay": int(request.form['blockDelay']),
             "buffer": int(request.form['buffer']),
             "createdEnvs": 0,
             "usedEnvs": 0,
             "envs": []
             })
    return Response('OK')


@flaskapp.route('/api/classes')
@login_required(role=['admin', 'instructor'])
def get_class_data():
    results = []
    cursor = flaskapp.config['CLASS_COLLECTION'].find()
    for item in cursor:
        # Add Time key to display status in HTML table.
        # This is neccessary because each column of the table can only get
        # One attribute but more are needed to determine status.
        if "buffer" in item.keys():
            item['time'] = {
                "start": item['startTime'],
                "end": item['endTime'],
                "tz": item['timezone'],
                "deploy":item['startTime'] - datetime.timedelta(minutes=item['buffer'])
            }
        else:
            item['time'] = {
                "start": item['startTime'],
                "end": item['endTime'],
                "tz": item['timezone'],
                "deploy":item['startTime']
            }

        item['startTz'] = {
        "start": item['startTime'],
        "tz": item['timezone']
        }
        item['endTz'] = {
        "end": item['endTime'],
        "tz": item['timezone']
        }

        results.append(item)
    return json.dumps(results, default=json_util.default)


@flaskapp.route('/api/classes/<id>')
@login_required(role=['admin', 'instructor'])
def get_class_data_by_id(id):
    cursor = flaskapp.config['CLASS_COLLECTION'].find_one({"id": id})
    del cursor['_id']

    return json.dumps(cursor, default=json_util.default)


@flaskapp.route('/api/classes/<id>/delete', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def delete_class(id):
    if request.method == 'POST':
        flaskapp.config['CLASS_COLLECTION'].delete_one({
            'id': id
        })
    return Response('OK')


@flaskapp.route('/api/classes/<id>', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def edit_class(id):
    # Detect if class with pre-created environments
    if request.form['type'] == "pregen":
        flaskapp.config['CLASS_COLLECTION'].update_one({
            'id': id
        },
            {'$set': {"name": request.form['name'],
             "id": request.form['id'],
             "secret": request.form['secret'],
             "startTime": dateutil.parser.parse(request.form['startTime']),
             "endTime": dateutil.parser.parse(request.form['endTime']),
             "envs": int(request.form['envs']),
             "baseName": request.form['baseName'],
             "studentPass": request.form['studentPass'],
             "blockSize": int(request.form['blockSize']),
             "blockDelay": int(request.form['blockDelay']),
             "buffer": int(request.form['buffer']),
             "createdEnvs": 0,
             "sfdc": request.form['sfdc'],
             "lastPublished": datetime.datetime.utcnow(),
             "lab": json.loads(request.form['lab']),
             "timezone": request.form['timezone'],
             "type": request.form['type']
             }})
    elif request.form['type'] == "hot":
        flaskapp.config['CLASS_COLLECTION'].update_one({
            'id': id
        },
            {'$set': {"name": request.form['name'],
             "id": request.form['id'],
             "secret": request.form['secret'],
             "startTime": dateutil.parser.parse(request.form['startTime']),
             "endTime": dateutil.parser.parse(request.form['endTime']),
             "hotenvs": int(request.form['hotenvs']),
             "blockSize": int(request.form['blockSize']),
             "blockDelay": int(request.form['blockDelay']),
             "buffer": int(request.form['buffer']),
             "createdEnvs": 0,
             "sfdc": request.form['sfdc'],
             "lastPublished": datetime.datetime.utcnow(),
             "lab": json.loads(request.form['lab']),
             "timezone": request.form['timezone'],
             "type": request.form['type']
             }})
    else:
        flaskapp.config['CLASS_COLLECTION'].update_one({
            'id': id
        },{'$set': {"name": request.form['name'],
             "id": request.form['id'],
             "secret": request.form['secret'],
             "startTime": dateutil.parser.parse(request.form['startTime']),
             "endTime": dateutil.parser.parse(request.form['endTime']),
             "lab": json.loads(request.form['lab']),
             "timezone": request.form['timezone'],
             "max": int(request.form['max']),
             "sfdc": request.form['sfdc'],
             "active": 0,
             "type": request.form['type']
             }})
    return Response('OK')
