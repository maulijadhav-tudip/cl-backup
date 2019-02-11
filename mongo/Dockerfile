FROM python:3.7.0-slim
RUN apt-get update -y && apt-get install -y python-pip python-dev build-essential && pip install pymongo

COPY ./db-scripts /scripts
