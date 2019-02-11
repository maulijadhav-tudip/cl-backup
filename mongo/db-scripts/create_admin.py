from pymongo import MongoClient
import os
DB_NAME = 'users'

DATABASE = MongoClient(os.environ.get("MONGO_URL"))[DB_NAME]
USERS_COLLECTION = DATABASE.users
if USERS_COLLECTION.count_documents({}) == 0:
    USERS_COLLECTION.insert_one(
        {
            "email": "admin",
            "password":
            "pbkdf2:sha256:50000$oIlTHMhB$0277e36728933ac02d76d51c9efbe75f3b6ee341044d0a5c0434edf6c54b2fc2",
            "role": "admin",
            "createdApp": False,
            "createdToken": False,
            "token": "",
            "env": "",
            "tokenID": "",
            "startTime": "",
            "endTime": "",
            "publishedTime": "",
            "duration": "",
            "loggedIn": "",
            "lab": {
                "name": "",
                "blueprint": {"name": "", "id": ""},
                "region": "",
                "description": ""
            }
        })
