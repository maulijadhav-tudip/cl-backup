from pymongo import MongoClient
import os

DB_NAME = 'users'

DATABASE = MongoClient( os.environ.get("MONGO_URL"))[DB_NAME]
REQUEST_ARCHIVE = DATABASE.requestLogs


REQUEST_ARCHIVE.remove({})
