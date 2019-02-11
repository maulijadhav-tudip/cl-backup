# The entry point for our flask module

# Imports
from flask import Flask
import logging
import sys
from raven.contrib.flask import Sentry

# Configuration from file
flaskapp = Flask(__name__)
flaskapp.config.from_object('config')

# Configure Logger
logger = logging.getLogger()
handler = logging.StreamHandler()
formatter = logging.Formatter('{ "loggerName":"%(name)s", "timestamp":"%(asctime)s", "pathName":"%(pathname)s", "logRecordCreationTime":"%(created)f", "functionName":"%(funcName)s", "levelNo":"%(levelno)s", "lineNo":"%(lineno)d", "time":"%(msecs)d", "levelName":"%(levelname)s", "message":"%(message)s"}')
flaskapp.logger.handlers = []
handler.setFormatter(formatter)
flaskapp.logger.addHandler(handler)
flaskapp.logger.setLevel(logging.INFO)
logging.getLogger('azure').setLevel(logging.CRITICAL)

sentry = Sentry(flaskapp, dsn='https://3f12e5eb1788438f911a04e5f49054c4:d1fbb0cacc56449c87d59d638cf7bec8@sentry.io/1242228')


# import views
from . import views
from . import student
from . import users
from . import classes
from . import labs
from . import settings
from . import request
from . import cloudshare
from . import hot
from . import lists
from . import logs
