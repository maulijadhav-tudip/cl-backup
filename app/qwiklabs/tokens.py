import requests
from io import StringIO
import csv
import os
from bs4 import BeautifulSoup
from app import flaskapp

VERIFY = not flaskapp.config['DEBUG']

# At the time of writing there was no public facing API for generating single us Tokens
# The following method is a work around and may break at any time


def create_qwiklab_tokens(email, tag, number, expiration):
    session = requests.Session()

    headers = {
        'content-type': "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
        'Cache-Control': "no-cache"
    }

    # Parse the Ruby on Rails CSRF Token from the QwikLab HTML
    url = "https://paloaltonetworks.qwiklab.com/"
    querystring = {"locale": "en"}
    response = session.get(url, headers=headers, params=querystring, verify=VERIFY)
    soup = BeautifulSoup(response.text, 'html.parser')
    token = soup.find('input', {'name': 'authenticity_token'})['value']

    # Submit form data to login to QwikLab
    # Create a Session which saves the Authentication Cookie
    url = "https://paloaltonetworks.qwiklab.com/users/sign_in"
    payload = "------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"user[email]\"\r\n\r\n" + \
              flaskapp.config["QWIKLAB_EMAIL"] + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"user[password]\"\r\n\r\n" + \
              flaskapp.config["QWIKLAB_PASSWORD"] + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"user[remember_me]\"\r\n\r\n1\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"commit\"\r\n\r\nSign In\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"authenticity_token\"\r\n\r\n"+token+"\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--"

    session.post(url, data=payload, headers=headers, params=querystring, verify=VERIFY)

    # Parse the Ruby on Rails CSRF Token from the QwikLab HTML
    response = session.get("https://paloaltonetworks.qwiklab.com/admin/lab_onetime_coupons", headers=headers,
                           verify=VERIFY)
    soup = BeautifulSoup(response.text, 'html.parser')
    token = soup.find('input', {'name': 'authenticity_token'})['value']

    # Submit Form Data to generate tokens
    url = "https://paloaltonetworks.qwiklab.com/admin/lab_onetime_coupons/tag"
    payload = "------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"emails\"\r\n\r\n" + email + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"tag\"\r\n\r\n" + tag + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"number_coup\"\r\n\r\n" + str(
        number) + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"expires_on\"\r\n\r\n" + expiration + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"token_type\"\r\n\r\none_time\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"labs_list\"\r\n\r\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"commit\"\r\n\r\nCreate Tokens\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"authenticity_token\"\r\n\r\n" + token + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--"
    session.post(url, data=payload, headers=headers, verify=VERIFY)

    # Download CSV of all Tokens
    response = session.get(
        "https://paloaltonetworks.qwiklab.com/admin/lab_onetime_coupons/search_export.csv?query%5Buser_email_or_token_user_email_or_uuid_or_tag_cont%5D=",
        headers=headers, verify=VERIFY)

    # Search through CSV and get tokens matching the tag that was just created
    tokens = []
    f = StringIO(response.text)
    reader = csv.DictReader(f, delimiter=',')
    for row in reader:
        if row['Token Tag'] == tag:
            tokens.append(row["Token id"])
    return tokens
