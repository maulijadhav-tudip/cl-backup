from app import flaskapp
from flask import request,  Response
from bson import json_util
import json
import requests
from .login import *
from bson.objectid import ObjectId
from .ravello.ravello import *
from .azure.functions import get_locations

@flaskapp.route('/api/azure/regions')
@login_required(role=['admin', 'instructor'])
def locations_azure():
    return json.dumps(get_locations(flaskapp.config['AZURE_SUBSCRIPTION']))

@flaskapp.route('/api/locations/<id>')
@login_required(role=['admin', 'instructor'])
def locations_view(id):
    return locations(id)

@flaskapp.route('/api/custom/labs', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_custom_lab():
    flaskapp.config['LAB_COLLECTION'].insert_one(
        {"name": request.form['name'],
         "enabled": request.form['enabled'],
         "description": request.form['description'],
         "type": "custom",
         "region": "",
         "markdown": request.form['markdown']
         })
    return Response('OK')

@flaskapp.route('/api/custom/labs/<id>', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def edit_custom_lab(id):
    flaskapp.config['LAB_COLLECTION'].update_one({
        '_id': ObjectId(id)
    }, {
        '$set': {
            "name": request.form['name'],
            "description": request.form['description'],
            "enabled": request.form['enabled'],
            "region":"",
            "markdown": request.form['markdown']
        }})

    flaskapp.config['CLASS_COLLECTION'].update_many({
        'lab._id': id
    }, {
        '$set': {
            "lab.name": request.form['name'],
            "lab.description": request.form['description'],
            "lab.region": "",
            "lab.markdown": request.form['markdown']

        }})
    flaskapp.config['USERS_COLLECTION'].update_many({
        'lab._id': id
    }, {
        '$set': {
            "lab.name": request.form['name'],
            "lab.region": "",
            "lab.description": request.form['description'],
            "lab.markdown": request.form['markdown']
        }})
    return Response('OK')


@flaskapp.route('/api/ravello/labs', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_lab():
    if request.form['region'] == "":
        region = ""
    else:
        region = json.loads(request.form['region'])
    flaskapp.config['LAB_COLLECTION'].insert_one(
        {"name": request.form['name'],
         "blueprint": json.loads(request.form['blueprint']),
         "region": region,
         "description": request.form['description'],
         "optimizationLevel": request.form['optimizationLevel'],
         "enabled": request.form['enabled'],
         "type": "ravello",
         "markdown": request.form['markdown']
         })
    return Response('OK')


@flaskapp.route('/api/azure/labs', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_azure_lab():
    flaskapp.config['LAB_COLLECTION'].insert_one(
        {"name": request.form['name'],
         "template": request.form['template'],
         "region": json.loads(request.form['region']),
         "description": request.form['description'],
         "enabled": request.form['enabled'],
         "type": "azure",
         "markdown": request.form['markdown']
         })
    return Response('OK')

@flaskapp.route('/api/qwiklab/labs', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def add_qwiklab_lab():
    if request.form['type'] == "qwiklab_one":
        flaskapp.config['LAB_COLLECTION'].insert_one(
            {"name": request.form['name'],
            "description": request.form['description'],
            "enabled": request.form['enabled'],
            "region":"",
            "type":request.form['type'],
            "markdown": "",
            "tag":request.form['tag'],
            "expiration": request.form['expiration']
             })
    elif request.form['type'] == "qwiklab":
        flaskapp.config['LAB_COLLECTION'].insert_one(
            {
                "name": request.form['name'],
                "description": request.form['description'],
                "enabled": request.form['enabled'],
                "region":"",
                "type":request.form['type'],
                "markdown": ""
            })


    return Response('OK')

@flaskapp.route('/api/qwiklab/labs/<id>', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def edit_qwiklab_lab(id):
    if request.form['type'] == "qwiklab_one":
        flaskapp.config['LAB_COLLECTION'].update_one({
            '_id': ObjectId(id)
        }, {
            '$set': {
                "name": request.form['name'],
                "description": request.form['description'],
                "enabled": request.form['enabled'],
                "region":"",
                "type":request.form['type'],
                "markdown": "",
                "tag":request.form['tag'],
                "expiration": request.form['expiration']
            }})
    elif request.form['type'] == "qwiklab":
        flaskapp.config['LAB_COLLECTION'].update_one({
            '_id': ObjectId(id)
        }, {
            '$set': {
                "name": request.form['name'],
                "description": request.form['description'],
                "enabled": request.form['enabled'],
                "region":"",
                "type":request.form['type'],
                "markdown": ""
            }})
    return Response('OK')



@flaskapp.route('/api/azure/labs/<id>', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def edit_azure_lab(id):
    flaskapp.config['LAB_COLLECTION'].update_one({
        '_id': ObjectId(id)
    }, {
        '$set': {
            "name": request.form['name'],
            "template": request.form['template'],
            "region": json.loads(request.form['region']),
            "description": request.form['description'],
            "enabled": request.form['enabled'],
            "markdown": request.form['markdown']
        }})

    flaskapp.config['CLASS_COLLECTION'].update_many({
        'lab._id': id
    }, {
        '$set': {
            "lab.name": request.form['name'],
            "lab.template": request.form['template'],
            "lab.region": json.loads(request.form['region']),
            "lab.description": request.form['description'],
            "lab.markdown": request.form['markdown']

        }})
    flaskapp.config['USERS_COLLECTION'].update_many({
        'lab._id': id
    }, {
        '$set': {
            "lab.name": request.form['name'],
            "lab.template": request.form['template'],
            "lab.region": json.loads(request.form['region']),
            "lab.description": request.form['description'],
            "lab.markdown": request.form['markdown']
        }})
    return Response('OK')

@flaskapp.route('/api/ravello/labs/<id>', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def edit_lab(id):
    if request.form['region'] == "":
        region = ""
    else:
        region = json.loads(request.form['region'])
    flaskapp.config['LAB_COLLECTION'].update_one({
        '_id': ObjectId(id)
    }, {
        '$set': {
            "name": request.form['name'],
            "blueprint": json.loads(request.form['blueprint']),
            "region": region,
            "description": request.form['description'],
            "enabled": request.form['enabled'],
            "optimizationLevel": request.form['optimizationLevel'],
            "markdown": request.form['markdown']

        }})

    flaskapp.config['CLASS_COLLECTION'].update_many({
        'lab._id': id
    }, {
        '$set': {
            "lab.name": request.form['name'],
            "lab.blueprint": json.loads(request.form['blueprint']),
            "lab.region": region,
            "lab.description": request.form['description'],
            "lab.optimizationLevel": request.form['optimizationLevel'],
            "lab.markdown": request.form['markdown']

        }})
    flaskapp.config['USERS_COLLECTION'].update_many({
        'lab._id': id
    }, {
        '$set': {
            "lab.name": request.form['name'],
            "lab.blueprint": json.loads(request.form['blueprint']),
            "lab.region": region,
            "lab.description": request.form['description'],
            "lab.optimizationLevel": request.form['optimizationLevel'],
            "lab.markdown": request.form['markdown']

        }})
    return Response('OK')


@flaskapp.route('/api/labs/<id>/delete', methods=['POST'])
@login_required(role=['admin', 'instructor'])
def delete_lab(id):
    if request.method == 'POST':
        flaskapp.config['LAB_COLLECTION'].delete_one({
            '_id': ObjectId(id)
        })

    return Response('OK')


@flaskapp.route('/api/labs/enabled')
def get_lab_data():
    results = []
    cursor = flaskapp.config['LAB_COLLECTION'].find()
    for item in cursor:
        if item['enabled'] == "true":
            results.append(item)
    return_data = {'data': results}
    return json.dumps(return_data, default=json_util.default)


@flaskapp.route('/api/labs')
@login_required(role=['admin', 'instructor'])
def get_labs():
    results = []
    cursor = flaskapp.config['LAB_COLLECTION'].find()
    for item in cursor:
        results.append(item)
    return json.dumps(results, default=json_util.default)

@flaskapp.route('/api/labs/<id>')
@login_required(role=['admin', 'instructor'])
def get_lab(id):
    lab = flaskapp.config['LAB_COLLECTION'].find_one({'_id': ObjectId(id)})
    return json.dumps(lab, default=json_util.default)
