import boto3
from botocore.exceptions import ClientError
import logging


s3_resource = boto3.resource('s3')
print("Hello, Amazon S3! Let's list your buckets:")
for bucket in s3_resource.buckets.all():
  print(f"\t{bucket.name}")

dir = '/Users/wu049/bigcat_cabb/cabb-aws-server/tests/'

try:
  s3_client = boto3.client('s3')
  with open(dir + '/test_schedule.sch', "rb") as f:
    response = s3_client.upload_fileobj(
      f, 'atcaschedules', 
      'wu049-test_project-schedule.sch')
  print('update done')
except ClientError as e:
  logging.error(e)

bucket = s3_resource.Bucket('atcaschedules')
objects = list(bucket.objects.all())
print(objects)

