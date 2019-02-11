from pymongo import MongoClient
import csv
import os

DB_NAME = 'users'

DATABASE = MongoClient( os.environ.get("MONGO_URL"))[DB_NAME]
REQUEST_ARCHIVE = DATABASE.requestLogs


students = REQUEST_ARCHIVE.find({})

if students.count() > 0:
    with open('requests.csv', 'w') as csvfile:
        keys = students[0].keys()
        dict_writer = csv.DictWriter(csvfile, keys)
        dict_writer.writeheader()
        dict_writer.writerows(students)
