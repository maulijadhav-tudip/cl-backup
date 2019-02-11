# Config file
import os

REQUEST_DURATION = str(os.environ.get("REQUEST_DURATION")) # Time limit on requested lab (minutes)
REQUEST_EXPIRATION = str(os.environ.get("REQUEST_EXPIRATION")) # Time Limit in which the approved request expires (days)
REQUEST_LIMIT = str(os.environ.get("REQUEST_LIMIT")) # Requests per day allowed

CLOUDSHARE_ID = str(os.environ.get("CLOUDSHARE_ID")) # Cloudshare API ID
CLOUDSHARE_KEY = str(os.environ.get("CLOUDSHARE_KEY")) # Cloudshare API key
CLOUDSHARE_OPPORTUNITY = str(os.environ.get("CLOUDSHARE_OPPORTUNITY"))

RAVELLO_EMAIL = str(os.environ.get("RAVELLO_EMAIL")) # Email for Cloudshare API
RAVELLO_PASSWORD = str(os.environ.get("RAVELLO_PASSWORD")) # Email for Ravello password

AWS_KEY = str(os.environ.get("AWS_KEY")) # API Key for AWS IAM Profile to allow sending Email
AWS_SECRET = str(os.environ.get("AWS_SECRET")) # AWS Secret Key

AZURE_SUBSCRIPTION = str(os.environ.get("AZURE_SUBSCRIPTION")) # AWS Secret Key

QWIKLAB_EMAIL = str(os.environ.get("QWIKLAB_EMAIL")) # Qwiklab email
QWIKLAB_PASSWORD = str(os.environ.get("QWIKLAB_PASSWORD")) # Qwiklab password

FQDN = str(os.environ.get("FQDN")) # URL of server deployment

DEBUG = os.getenv('DEBUG', False)

API_FAIL = 4

from pymongo import MongoClient

WTF_CSRF_ENABLED = True
SECRET_KEY = 'supersecret'
DB_NAME = 'users'

DATABASE = MongoClient( os.environ.get("MONGO_URL"))[DB_NAME]
USERS_COLLECTION = DATABASE.users
TOKEN_DETAILS_COLLECTION = DATABASE.tokenDetails
CLASS_COLLECTION = DATABASE.classes
CLASS_ARCHIVES = DATABASE.archive
LAB_COLLECTION = DATABASE.labs
SETTINGS_COLLECTION = DATABASE.settings
REQUEST_COLLECTION = DATABASE.requests
BLACKLIST = DATABASE.blacklist
WHITELIST = DATABASE.whitelist
REQUEST_ARCHIVE = DATABASE.requestLogs
HOT_COLLECTION = DATABASE.hot
TEST_TEMPLATES_COLLECTION = DATABASE.testTemplates
ENV_TEST_DETAILS_COLLECTION = DATABASE.environmentTests
