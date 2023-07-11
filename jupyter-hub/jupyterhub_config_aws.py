# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# Configuration file for JupyterHub
import os
import re
import sys

c = get_config()  # noqa: F821

task_role_arn = os.environ.get("TASK_ROLE_ARN", "")
subnets = os.environ.get("SUBNETS", "")
security_groups = os.environ.get("SECURITY_GROUPS", "")
cull_freq = os.environ.get("CULL_FREQUENCY", 600)
cull_timeout = os.environ.get('CULL_TIMEOUT', 600)
jupyter_lab_image = os.environ.get('JUPYTER_LAB_REPOSITORY', '')
fileSystem_id = os.environ.get('EFS_FILE_SYSTEM_ID', '')
execution_role_arn = os.environ.get('EXECUTION_ROLE_ARN', '')
cluster_name = os.environ.get("CLUSTER_NAME", "")

oauth_client_id = os.environ.get("OAUTH_CLIENT_ID", "")
oauth_client_secret = os.environ.get("OAUTH_CLIENT_SECRET", "")
oauth_callback_url = os.environ.get("OAUTH_CALLBACK_URL", "")

oauth_authorize_url = os.environ.get("OAUTH_AUTHORIZE_URL", "")
oauth_token_url = os.environ.get("OAUTH_TOKEN_URL", "")
oauth_userdata_url = os.environ.get("OAUTH_USERDATA_URL", "")

oauth_logout_redirect_url = os.environ.get("OAUTH_LOGOUT_REDIRECT_URL", "")

c.JupyterHub.load_roles = [
    {
        "name": "jupyterhub-idle-culler-role",
        "scopes": [
            "list:users",
            "read:users:activity",
            "read:servers",
            "delete:servers",
            # "admin:users", # if using --cull-users
        ],
        # assignment of role's permissions to:
        "services": ["jupyterhub-idle-culler-service"],
    }
]


c.JupyterHub.services = [
    {
        "name": "jupyterhub-idle-culler-service",
        "command": [
            sys.executable,
            "-m", "jupyterhub_idle_culler",
            f"--cull-every={cull_freq}",
            f"--timeout={cull_timeout}",
        ],
        # "admin": True,
    }
]

from distutils.dir_util import copy_tree
from fargatespawner import FargateSpawner
import socket
import json
import datetime
import hashlib
import hmac
import urllib
from tornado.httpclient import (
    AsyncHTTPClient,
    HTTPError,
    HTTPRequest,
)

# need to fill in {0}
# task_definition.format(
#       user_name, jupyter_lab_image, fileSystem_id, 
#       user_dir, execution_role_arn)
task_definition = '''
    {{
      "requiresCompatibilities": [
        "FARGATE"
      ],
      "family": "bigcat-jupyter-lab-{}",
      "containerDefinitions": [
        {{
          "name": "bigcat-jupyter-lab",
          "image": "{}",
          "essential": true,
          "healthCheck": {{
            "command": [
              "CMD-SHELL",
              "echo hello"
            ],
            "interval": 5,
            "timeout": 2,
            "retries": 3
          }},          
          "portMappings": [
            {{
              "containerPort": 8000,
              "hostPort": 8000,
              "protocol": "tcp"
            }},
            {{
              "containerPort": 8080,
              "hostPort": 8080,
              "protocol": "tcp"
            }}
          ],  
          "mountPoints": [
            {{
              "sourceVolume": "efs",
              "containerPath": "/home/jovyan"
            }}
          ],
          "logConfiguration": {{
            "logDriver": "awslogs",
            "options": {{
              "awslogs-create-group": "true",
              "awslogs-group": "firelens-container",
              "awslogs-region": "ap-southeast-2",
              "awslogs-stream-prefix": "firelens"
            }}
          }}
        }}
      ],
      "volumes": [
        {{
          "name": "efs",
          "efsVolumeConfiguration": {{
            "fileSystemId": "{}",
            "rootDirectory": "{}"
          }}
        }}
      ],
      "networkMode": "awsvpc",
      "memory": "3 GB",
      "cpu": "1 vCPU",
      "executionRoleArn": "{}"
    }}
'''

# for details of the api calls:
# https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Operations.html

async def _make_ecs_request(logger, aws_endpoint, target, dict_data):
    service = 'ecs'
    body = json.dumps(dict_data).encode('utf-8')
    credentials = await aws_endpoint['ecs_auth']()
    pre_auth_headers = {
        'X-Amz-Target': f'AmazonEC2ContainerServiceV20141113.{target}',
        'Content-Type': 'application/x-amz-json-1.1',
        **credentials.pre_auth_headers,
    }
    path = '/'
    query = {}
    headers = _aws_headers(service, credentials.access_key_id, credentials.secret_access_key,
                           aws_endpoint['region'], aws_endpoint['ecs_host'],
                           'POST', path, query, pre_auth_headers, body)
    client = AsyncHTTPClient()
    url = f'https://{aws_endpoint["ecs_host"]}{path}'
    request = HTTPRequest(url, method='POST', headers=headers, body=body)
    logger.debug('Making request (%s)', body)
    try:
        response = await client.fetch(request)
    except HTTPError as exception:
        logger.exception('HTTPError from ECS (%s)', exception.response.body)
        raise
    logger.debug('Request response (%s)', response.body)
    return json.loads(response.body)


def _aws_headers(service, access_key_id, secret_access_key,
                 region, host, method, path, query, pre_auth_headers, payload):
    algorithm = 'AWS4-HMAC-SHA256'

    now = datetime.datetime.utcnow()
    amzdate = now.strftime('%Y%m%dT%H%M%SZ')
    datestamp = now.strftime('%Y%m%d')
    credential_scope = f'{datestamp}/{region}/{service}/aws4_request'
    headers_lower = {
        header_key.lower().strip(): header_value.strip()
        for header_key, header_value in pre_auth_headers.items()
    }
    required_headers = ['host', 'x-amz-content-sha256', 'x-amz-date']
    signed_header_keys = sorted([header_key
                                 for header_key in headers_lower.keys()] + required_headers)
    signed_headers = ';'.join(signed_header_keys)
    payload_hash = hashlib.sha256(payload).hexdigest()

    def signature():
        def canonical_request():
            header_values = {
                **headers_lower,
                'host': host,
                'x-amz-content-sha256': payload_hash,
                'x-amz-date': amzdate,
            }

            canonical_uri = urllib.parse.quote(path, safe='/~')
            query_keys = sorted(query.keys())
            canonical_querystring = '&'.join([
                urllib.parse.quote(key, safe='~') + '=' + urllib.parse.quote(query[key], safe='~')
                for key in query_keys
            ])
            canonical_headers = ''.join([
                header_key + ':' + header_values[header_key] + '\n'
                for header_key in signed_header_keys
            ])

            return f'{method}\n{canonical_uri}\n{canonical_querystring}\n' + \
                   f'{canonical_headers}\n{signed_headers}\n{payload_hash}'

        def sign(key, msg):
            return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

        string_to_sign = \
            f'{algorithm}\n{amzdate}\n{credential_scope}\n' + \
            hashlib.sha256(canonical_request().encode('utf-8')).hexdigest()

        date_key = sign(('AWS4' + secret_access_key).encode('utf-8'), datestamp)
        region_key = sign(date_key, region)
        service_key = sign(region_key, service)
        request_key = sign(service_key, 'aws4_request')
        return sign(request_key, string_to_sign).hex()

    return {
        **pre_auth_headers,
        'x-amz-date': amzdate,
        'x-amz-content-sha256': payload_hash,
        'Authorization': (
            f'{algorithm} Credential={access_key_id}/{credential_scope}, ' +
            f'SignedHeaders={signed_headers}, Signature=' + signature()
        ),
    }



async def _describe_task_definition(logger, aws_endpoint, task_definition_name):
  logger.error(f'aws_endpoint: {aws_endpoint} task_definition_name: {task_definition_name}')

  try:
    described_task_definition = await _make_ecs_request(logger, aws_endpoint, 'DescribeTaskDefinition', {
      "taskDefinition": task_definition_name
    })
    # response
    # {"tag":{}, "taskDefinition": {"revision": numer, "status": "string", }}
    return described_task_definition
  except:
    return None


async def _deregister_task_definition(logger, aws_endpoint, task_definition_name):
  response = await _describe_task_definition(logger, aws_endpoint, task_definition_name)

  if response:
    if response.get('taskDefinition', {}).get('status', '') != 'ACTIVE':
      return None

    deregistered_task_definition = await _make_ecs_request(logger, aws_endpoint, 'DeregisterTaskDefinition', {
      "taskDefinition": task_definition_name + ':' + str(response.get('taskDefinition', {}).get('revision', 0))
    })
    # response
    # {"tag":{}, "taskDefinition": {"revision": numer, "status": "string", }}
    return deregistered_task_definition

  return None

async def _register_task_definition(logger, aws_endpoint, task_definition):
  task_definition = await _make_ecs_request(logger, aws_endpoint, 'RegisterTaskDefinition', task_definition)
  # response
  # {"tag":{}, "taskDefinition": {"revision": numer, "status": "string", }}
  return task_definition


class XinyuFargateSpawner(FargateSpawner):

  async def start(self):
    user_name = self.user.name
    user_dir = '/efs/notebooks/jupyterhub-user-' + user_name
    # create user directory and copy some demo over if it doesn't exist
    if not os.path.isdir(user_dir):
      os.makedirs(user_dir)
      # recursively change owner to 1000
      copy_tree('/efs/notebooks/default', user_dir)
      os.chown(user_dir, 1000, 1000)
      for root, dirs, files in os.walk(user_dir):
        # set perms on sub-directories  
        for val in dirs:
          os.chown(os.path.join(root, val), 1000, 1000)

        # set perms on files
        for val in files:
          os.chown(os.path.join(root, val), 1000, 1000)

    # create the task definition if no active version exists
    response = await _describe_task_definition(
       self.log, 
       self._aws_endpoint(), 
       'bigcat-jupyter-lab-'+ self.user.name)
    
    if not response or response.get('taskDefinition', {}).get('status', '') != 'ACTIVE':
      definition = task_definition.format(
          user_name, jupyter_lab_image, fileSystem_id, 
          user_dir, execution_role_arn)
      self.log.error(f'user_dir = {user_dir}')
      response = await _register_task_definition(self.log, 
                                self._aws_endpoint(), 
                                json.loads(definition))
        
    # start the task definition
    return await super().start()

  # async def stop(self, now=False):
  #   await super().stop()
  #   # delete the task definition
  #   await _deregister_task_definition(self.log, 
  #                               self._aws_endpoint(), 
  #                               'bigcat-jupyter-lab-'+ self.user.name)

  def get_env(self):
    env = super().get_env()
    # hostname_str = '//' + os.environ["hostname"] + ':'
    # # self.hub.connect_ip = hostname
    # # env = super().get_env()

    # env['JUPYTERHUB_API_URL']=re.sub('//.*:', hostname_str, env['JUPYTERHUB_API_URL'])
    # env['JUPYTERHUB_ACTIVITY_URL']=re.sub('//.*:', hostname_str, env['JUPYTERHUB_ACTIVITY_URL'])

    localhost_str = '//0.0.0.0:' + str(self.notebook_port) + '/'
    env['JUPYTERHUB_SERVICE_URL'] = re.sub('//.*/', localhost_str, env['JUPYTERHUB_SERVICE_URL'])

    env['PATH'] = env['PATH'] + ':/opt/conda/bin'
    return env


c.JupyterHub.spawner_class = XinyuFargateSpawner
c.XinyuFargateSpawner.aws_region = 'ap-southeast-2'
c.XinyuFargateSpawner.aws_ecs_host = 'ecs.ap-southeast-2.amazonaws.com'
c.XinyuFargateSpawner.notebook_port = 8888
c.XinyuFargateSpawner.notebook_scheme = 'http'
c.XinyuFargateSpawner.start_timeout = 300
c.XinyuFargateSpawner.http_timeout = 300


c.XinyuFargateSpawner.get_run_task_args = lambda spawner: {
    'cluster': cluster_name,
    'taskDefinition': 'bigcat-jupyter-lab-'+ spawner.user.name,
    'overrides': {
        'taskRoleArn': task_role_arn,
        'containerOverrides': [{
            'name': 'bigcat-jupyter-lab',
            'command': ['start-singleuser.sh', '--notebook-dir=/home/jovyan',
                              '--MappingKernelManager.cull_connected=True',
                              '--ServerApp.shutdown_no_activity_timeout=180'],
            'environment': [
                {
                    'name': name,
                    'value': value,
                } for name, value in spawner.get_env().items()
            ],
        }]
    },
    'count': 1,
    'launchType': 'FARGATE',
    'networkConfiguration': {
        'awsvpcConfiguration': {
            'assignPublicIp': 'ENABLED',
            'securityGroups': security_groups.split(','),
            'subnets':  subnets.split(',')
        },
    },
}

#
# for running on EC2 instance
#
# from fargatespawner import FargateSpawnerSecretAccessKeyAuthentication
# c.XinyuFargateSpawner.authentication_class = FargateSpawnerSecretAccessKeyAuthentication
# c.FargateSpawnerSecretAccessKeyAuthentication.aws_access_key_id=os.environ.get("aws_access_key_id")
# c.FargateSpawnerSecretAccessKeyAuthentication.aws_secret_access_key=os.environ.get("aws_secret_access_key")

#
# For running into ECS
#
from fargatespawner import FargateSpawnerECSRoleAuthentication
c.XinyuFargateSpawner.authentication_class = FargateSpawnerECSRoleAuthentication

# We rely on environment variables to configure JupyterHub so that we
# avoid having to rebuild the JupyterHub container every time we change a
# configuration parameter.


# c.JupyterHub.ssl_key = '/tmp/localhost.key'
# c.JupyterHub.ssl_cert = '/tmp/localhost.crt'
# c.JupyterHub.port = 443

# User containers will access hub by container name on the Docker network
c.JupyterHub.hub_ip = "0.0.0.0"
c.JupyterHub.hub_port = 8080

# Persist hub data on volume mounted inside container
c.JupyterHub.cookie_secret_file = "/data/jupyterhub_cookie_secret"
c.JupyterHub.db_url = "sqlite:////data/jupyterhub.sqlite"

# Authenticate users with Native Authenticator
# c.JupyterHub.authenticator_class = "nativeauthenticator.NativeAuthenticator"
# Allow anyone to sign-up without approval
# c.NativeAuthenticator.open_signup = True
# c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'
# c.DummyAuthenticator.password = "password"

c.JupyterHub.authenticator_class = "oauthenticator.generic.GenericOAuthenticator"


c.GenericOAuthenticator.client_id = oauth_client_id
c.GenericOAuthenticator.client_secret = oauth_client_secret
c.GenericOAuthenticator.oauth_callback_url = oauth_callback_url

c.GenericOAuthenticator.authorize_url = oauth_authorize_url
c.GenericOAuthenticator.token_url = oauth_token_url
c.GenericOAuthenticator.userdata_url = oauth_userdata_url
# c.GenericOAuthenticator.logout_redirect_url = "https://localhost"

c.GenericOAuthenticator.logout_redirect_url = oauth_logout_redirect_url
# # these are always the same
c.GenericOAuthenticator.login_service = "ATNF SSO"
# c.GenericOAuthenticator.username_key = "username"
# # c.GenericOAuthenticator.userdata_method = "POST"

# Allowed admins
admin = os.environ.get("JUPYTERHUB_ADMIN")
if admin:
    c.Authenticator.admin_users = [admin]
