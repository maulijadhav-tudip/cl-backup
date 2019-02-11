import boto3
from botocore.exceptions import ClientError
from app import flaskapp


def sendEmail(to, htmlbody, textbody):

    # This address must be verified with Amazon SES.
    sender = "admin@panw-labs.net"

    recipient = to

    awsregion = "us-west-2"

    # The subject line for the email.
    subject = "Palo Alto Networks Labs"

    # The character encoding for the email.
    charset = "UTF-8"

    # Create a new SES resource and specify a region.
    client = boto3.client('ses',
                          aws_access_key_id=flaskapp.config['AWS_KEY'],
                          aws_secret_access_key=flaskapp.config['AWS_SECRET'], region_name=awsregion)

    # Try to send the email.
    try:
            # Provide the contents of the email.
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    recipient,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': charset,
                        'Data': htmlbody,
                    },
                    'Text': {
                        'Charset': charset,
                        'Data': textbody,
                    },
                },
                'Subject': {
                    'Charset': charset,
                    'Data': subject,
                },
            },
            Source=sender,
        )
    # Display an error if something goes wrong.
    except ClientError as e:
        flaskapp.logger.error("Email Error: " + e.response['Error']['Message'])
    else:
        flaskapp.logger.info("Email sent! Message ID:" + response['ResponseMetadata']['RequestId'])
