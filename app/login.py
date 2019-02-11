from app import flaskapp
from functools import wraps
from .user import User
from flask import request, abort, jsonify
from itsdangerous import (JSONWebSignatureSerializer
                          as Serializer, BadSignature, SignatureExpired)

def login_required(role="ANY"):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            auth = request.authorization
            if not auth:
                return jsonify({'message':'Unauthorized'}), 401
            u = verify_auth_token(auth['username'])
            if not u:
                u = flaskapp.config['USERS_COLLECTION'].find_one({"email": auth['username']})
                if not u or not User.validate_login(u['password'], auth['password']):
                    return jsonify({'message':'Unauthorized'}), 401
            if (u['role'] not in role) and (role != "ANY"):
                return jsonify({'message':'Unauthorized'}), 403
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper

def generate_auth_token(user, expiration = None):
    s = Serializer("dfjkahfjkldahfajklhdlash")
    return s.dumps({ 'email': user['email'] })

def verify_auth_token(token):
    s = Serializer("dfjkahfjkldahfajklhdlash")
    try:
        data = s.loads(token)
    except SignatureExpired:
        return None # valid token, but expired
    except BadSignature:
        return None # invalid token
    user = flaskapp.config['USERS_COLLECTION'].find_one({"email": data['email']})
    return user
