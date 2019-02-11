from app import flaskapp
from flask import make_response
import dateutil.parser
import csv
from .login import *
import io

@flaskapp.route('/api/logs/request', methods=['POST'])
@login_required(role=['admin'])
def get_request_logs():
     startTime = dateutil.parser.parse(request.form['startTime'])
     endTime = dateutil.parser.parse(request.form['endTime'])
     students = flaskapp.config['REQUEST_ARCHIVE'].find( {'requestedOn': {'$gte': startTime, '$lt': endTime}})
     formattedList = []
     for student in students:
         del student['_id']
         student['lab'] = student['lab']['name']
         formattedList.append(student)

     if len(formattedList) > 0:
        keys = formattedList[0].keys()
        result = io.StringIO()
        dict_writer = csv.DictWriter(result, keys)
        dict_writer.writeheader()
        dict_writer.writerows(formattedList)
        return result.getvalue()
     else:
         return ""

@flaskapp.route('/api/logs/class', methods=['POST'])
@login_required(role=['admin'])
def get_class_logs():
     startTime = dateutil.parser.parse(request.form['startTime'])
     endTime = dateutil.parser.parse(request.form['endTime'])
     students = flaskapp.config['CLASS_ARCHIVES'].find( {'loginTime': {'$gte': startTime, '$lt': endTime}})
     formattedList = []
     for student in students:
         del student['_id']
         formattedList.append(student)

     if len(formattedList) > 0:
        keys = formattedList[0].keys()
        result = io.StringIO()
        dict_writer = csv.DictWriter(result, keys)
        dict_writer.writeheader()
        dict_writer.writerows(formattedList)
        return result.getvalue()
     else:
         return ""
