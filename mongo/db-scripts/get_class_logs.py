from pymongo import MongoClient
import os
import csv

DB_NAME = 'users'

DATABASE = MongoClient( os.environ.get("MONGO_URL"))[DB_NAME]
CLASS_ARCHIVES = DATABASE.archive


students = CLASS_ARCHIVES.find({})

if students.count() > 0:
    with open('requests.csv', 'w') as csvfile:
        keys = students[0].keys()
        dict_writer = csv.DictWriter(csvfile, keys)
        dict_writer.writeheader()
        dict_writer.writerows(students)
