from pymongo import MongoClient
import os

DB_NAME = 'users'

DATABASE = MongoClient(os.environ.get("MONGO_URL"))[DB_NAME]
SETTINGS_COLLECTION = DATABASE.settings

if SETTINGS_COLLECTION.count_documents({}) == 0:
    SETTINGS_COLLECTION.insert_one(
        {
            "bucket": {
                "id": 0,
                "creationTime": 0,
                "name": "",
                "description": "",
                "parentId": 0,
                "deleted": False
            },
            "cloudshareProject": {
                "name": "",
                "isActive": True,
                "id": ""
            },
            "cloudsharePolicy": {
                "name": "",
                "projectId": "",
                "allowEnvironmentCreation": True,
                "id": ""
            },
            "logo": "/logo.png",
            "welcome": "Palo Alto Networks",
            "title": "Palo Alto Networks",
            "mode": "class",
            "userquestions" : True
        })
