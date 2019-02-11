from pymongo import MongoClient
import os
import datetime

DB_NAME = 'users'

DATABASE = MongoClient(os.environ.get("MONGO_URL"))[DB_NAME]
REQUEST_COLLECTION = DATABASE.requests
REQUEST_COLLECTION.update_many({}, {'$set': {"requestedEnvs": 0, "lastCleared": datetime.datetime.utcnow()}})
