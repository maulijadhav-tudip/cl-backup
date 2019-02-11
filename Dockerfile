FROM python:3.7.0-slim
ARG USERNAME
ARG PASSWORD
RUN apt-get update -y && apt-get install -y python-pip python-dev build-essential
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
RUN az login -u $USERNAME -p $PASSWORD
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/gunicorn", "-b", ":8000", "app:flaskapp", "--workers=5", "--threads=5"]
