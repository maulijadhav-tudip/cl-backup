from pymongo import MongoClient

from config import *


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
        "userquestions" : True,
        "seat": False
    })
