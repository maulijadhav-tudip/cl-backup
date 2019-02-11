# import pyping as pyping
from app import flaskapp
from pandevice import firewall
import json
import urllib3
import time
from threading import Thread
from .ravello import *

import requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import os
BASE_URL = "https://cloud.ravellosystems.com/api/v1/"
VERIFY = not flaskapp.config['DEBUG']


def test1(fqdn):
    ping_command = "ping -c 1 " + fqdn
    ping_test = os.system(ping_command)
    if ping_test == 0:
        print("IP address is public and reachable")
        return True
    else:
        print("Test 1 failed the IP address is not public.")
        return False
    # return True


def test2(fqdn, user, passwd):
    try:
        fw = firewall.Firewall(fqdn["fqdn"], user, passwd)
        xml = fw.op('show system info', xml=True)
        print('Test2 is success on...', fqdn["app"])
        return True
    except:
        print('Error in test2')
        return False


def jobOneStatus(fqdn, user, passwd):
    try:
        fw = firewall.Firewall(fqdn["fqdn"], api_username=user, api_password=passwd)

        xml = fw.op("<show><jobs><id>1</id></jobs></show>", cmd_xml=False, xml=True)

        parsedDoc = xmltodict.parse(xml)
        status = parsedDoc['response']['result']['job']['status']
        if status == 'FIN':
            print("Success on...",fqdn["app"])
            return True
        else:
            return False
    except:
        print("Failed....!!")
        return False


class ThreadWithReturnValue(Thread):
    def __init__(self, group=None, target=None, name=None,
                 args=(), kwargs={}, Verbose=None):
        Thread.__init__(self, group, target, name, args, kwargs)
        self._return = None

    def run(self):
        if self._target is not None:
            self._return = self._target(*self._args,
                                                **self._kwargs)

    def join(self, *args):
        Thread.join(self, *args)
        return self._return

HEADERS = {
    'cache-control': "no-cache",
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}


def get_fqdn(app_id, fqdn):
    url = BASE_URL + "applications/" + str(app_id)
    app = json.loads(requests.request(
        "GET", url, headers=HEADERS,
        auth=(flaskapp.config['RAVELLO_EMAIL'], flaskapp.config['RAVELLO_PASSWORD']),
        verify=VERIFY).text)
    vms = app['design']["vms"]
    for vm in vms:
        if "NGFW" in vm['name']:
            for conn in vm['networkConnections']:
                if conn['ipConfig']['hasPublicIp']:
                    fqdn.append({"fqdn": conn['ipConfig']['fqdn'], "app": app['name']})
    return fqdn


def run_tests(id, test_template, fqdn):
    test1_status = test2_status = test3_status = "Not Tested"
    if "Test 1" in test_template['testNames']:
        thread1 = ThreadWithReturnValue(target=test1, args=(fqdn["fqdn"],))

        thread1.start()
        if thread1.join():
            test1_status = "Passed"
        else:
            test1_status = "Fail"

        if "Test 2" in test_template['testNames'] and test1_status in ["Passed", "Not Tested"] and test1_status != "Fail":
            thread2 = ThreadWithReturnValue(target=test2, args=(fqdn, test_template['testParams']['vmusername'],
                                                                test_template['testParams']['vmpassword']))

            thread2.start()
            if thread2.join():
                test2_status = "Passed"
            else:
                test2_status = "Fail"

            if "Test 3" in test_template['testNames'] and test2_status in ["Passed", "Not Tested"] \
                    and test2_status != "Fail":
                thread3 = ThreadWithReturnValue(target=jobOneStatus, args=(fqdn,test_template['testParams']['vmusername'],
                                                                           test_template['testParams']['vmpassword']))
                thread3.start()
                if thread3.join():
                    test3_status = "Passed"
                else:
                    test3_status = "Fail"

    if test1_status in ["Passed", "Not Tested"]:
        flaskapp.logger.info("Test1 status " + test1_status)
        if test2_status in ["Passed", "Not Tested"]:
            if test3_status in ["Passed", "Not Tested"]:

                flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].update_one({'_id': id},
                                                                          {'$set': {'status': 'Pass'}})
            else:
                flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].update_one({'_id': id},
                                                                          {'$set': {'status': 'Test3/fail'}})
        else:
            flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].update_one({'_id': id},
                                                                      {'$set': {'status': 'Test2/fail'}})
    else:
        flaskapp.config['ENV_TEST_DETAILS_COLLECTION'].update_one({'_id': id},
                                                                  {'$set': {'status': 'Test1/fail'}})

