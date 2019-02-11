from pymongo import MongoClient
import os

DB_NAME = 'users'

DATABASE = MongoClient( os.environ.get("MONGO_URL"))[DB_NAME]
CLASS_ARCHIVES = DATABASE.archive


CLASS_ARCHIVES.remove({})
