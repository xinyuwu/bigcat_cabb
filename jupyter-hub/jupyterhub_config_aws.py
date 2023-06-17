# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# Configuration file for JupyterHub
import os

c = get_config()  # noqa: F821

from fargatespawner import FargateSpawner, _make_ecs_request
import socket
import json

# need to fill in {0}
# task_definition.format(user_name, user_dir)
task_definition = '''
    {
      "requiresCompatibilities": [
        "FARGATE"
      ],
      "family": "bigcat-jupyter-hub",
      "containerDefinitions": [
        {
          "name": "bigcat-jupyter-lab-{0}",
          "image": "647731306132.dkr.ecr.ap-southeast-2.amazonaws.com/bigcat-jupyter-repository",
          "essential": true,
          "portMappings": [
            {
              "containerPort": 8000,
              "hostPort": 8000,
              "protocol": "tcp"
            },
            {
              "containerPort": 8080,
              "hostPort": 8080,
              "protocol": "tcp"
            }
          ],  
          "mountPoints": [
            {
              "sourceVolume": "efs",
              "containerPath": "/home/jovyan"
            }
          ],
          "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
              "awslogs-create-group": "true",
              "awslogs-group": "firelens-container",
              "awslogs-region": "us-east-1",
              "awslogs-stream-prefix": "firelens"
            }
          }
        }
      ],
      "volumes": [
        {
          "name": "efs",
          "efsVolumeConfiguration": {
            "fileSystemId": "fsap-0fb6e66d747ba728e",
            "rootDirectory": "/workarea/{1}",
            "transitEncryption": "ENABLED"
          }
        }
      ],
      "networkMode": "awsvpc",
      "memory": "3 GB",
      "cpu": "1 vCPU",
      "executionRoleArn": "arn:aws:iam::647731306132:role/ecsTaskExecutionRole"
    }
'''

# for details of the api calls:
# https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_Operations.html

async def _describe_task_definition(logger, aws_endpoint, task_definition_name):
  described_task_definition = await _make_ecs_request(logger, aws_endpoint, 'DescribeTaskDefinition', {
    "taskDefinition": task_definition_name
  })
  # response
  # {"tag":{}, "taskDefinition": {"revision": numer, "status": "string", }}
  return described_task_definition


async def _deregister_task_definition(logger, aws_endpoint, task_definition_name):
  response = await _describe_task_definition(logger, aws_endpoint, task_definition_name)

  if response:
    if response.get('taskDefinition', {}).get('revision', {}) != 'ACTIVE':
      return None

  deregistered_task_definition = await _make_ecs_request(logger, aws_endpoint, 'DeregisterTaskDefinition', {
    "taskDefinition": task_definition_name
  })
  # response
  # {"tag":{}, "taskDefinition": {"revision": numer, "status": "string", }}
  return deregistered_task_definition


async def _register_task_definition(logger, aws_endpoint, task_definition):
  task_definition = await _make_ecs_request(logger, aws_endpoint, 'DescribeTaskDefinition', task_definition)
  # response
  # {"tag":{}, "taskDefinition": {"revision": numer, "status": "string", }}
  return task_definition


class XinyuFargateSpawner(FargateSpawner):

  async def start(self):
    # delete the task definition if it exists
    _deregister_task_definition(self.log, 
                                self._aws_endpoint(), 
                                'bigcat-jupyter-lab-'+ self.user.name)
    
    # create the task definition
    user_name = self.user.name
    user_dir = 'jupyterhub-user-' + user_name
    definition = task_definition.format(user_name, user_dir)
    
    response = _register_task_definition(self.log, 
                              self._aws_endpoint(), 
                              json.loads(definition))
        
    # start the task definition
    return await super().start()

  async def stop(self, now=False):
    await super().stop()
    # delete the task definition
    _deregister_task_definition(self.log, 
                                self._aws_endpoint(), 
                                'bigcat-jupyter-lab-'+ self.user.name)

  def get_env(self):
    env = super().get_env()
    # hostname = socket.gethostbyname(socket.gethostname())
    # self.hub.connect_ip = hostname
    # env = super().get_env()
    # env['JUPYTERHUB_API_URL']=f'http://{hostname}:8080/hub/api'
    # env['JUPYTERHUB_ACTIVITY_URL']=f'http://{hostname}:8080/hub/api/users/wu049/activity'

    return env


c.JupyterHub.spawner_class = XinyuFargateSpawner
c.XinyuFargateSpawner.aws_region = 'ap-southeast-2'
c.XinyuFargateSpawner.aws_ecs_host = 'ecs.ap-southeast-2.amazonaws.com'
c.XinyuFargateSpawner.notebook_port = 8888
c.XinyuFargateSpawner.notebook_scheme = 'http'

c.XinyuFargateSpawner.get_run_task_args = lambda spawner: {
    'cluster': 'bigcat-jupyter-cluster',
    'taskDefinition': 'bigcat-jupyter-lab-'+ spawner.user.name,
    'overrides': {
        'taskRoleArn': 'arn:aws:iam::647731306132:role/ecsTaskExecutionRole',
        'containerOverrides': [{
            'command': spawner.cmd,
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
            'securityGroups': ['sg-0506d1377ade5499c', 
                               'sg-06beb423e0e5b1006'],
            'subnets':  ['subnet-01567bd832f484ad9']
        },
    },
}

from fargatespawner import FargateSpawnerSecretAccessKeyAuthentication
c.XinyuFargateSpawner.authentication_class = FargateSpawnerSecretAccessKeyAuthentication
c.FargateSpawnerSecretAccessKeyAuthentication.aws_access_key_id=''
c.FargateSpawnerSecretAccessKeyAuthentication.aws_secret_access_key=''

# We rely on environment variables to configure JupyterHub so that we
# avoid having to rebuild the JupyterHub container every time we change a
# configuration parameter.

# # Spawn single-user servers as Docker containers
# c.JupyterHub.spawner_class = "dockerspawner.DockerSpawner"

# # Spawn containers from this image
# c.DockerSpawner.image = os.environ["DOCKER_NOTEBOOK_IMAGE"]

# # JupyterHub requires a single-user instance of the Notebook server, so we
# # default to using the `start-singleuser.sh` script included in the
# # jupyter/docker-stacks *-notebook images as the Docker run command when
# # spawning containers.  Optionally, you can override the Docker run command
# # using the DOCKER_SPAWN_CMD environment variable.
# spawn_cmd = os.environ.get("DOCKER_SPAWN_CMD", "start-singleuser.sh")
# c.DockerSpawner.cmd = spawn_cmd

# # Connect containers to this Docker network
# network_name = os.environ["DOCKER_NETWORK_NAME"]
# c.DockerSpawner.use_internal_ip = True
# c.DockerSpawner.network_name = network_name

# # Explicitly set notebook directory because we'll be mounting a volume to it.
# # Most jupyter/docker-stacks *-notebook images run the Notebook server as
# # user `jovyan`, and set the notebook directory to `/home/jovyan/work`.
# # We follow the same convention.
# notebook_dir = os.environ.get("DOCKER_NOTEBOOK_DIR") or "/home/jovyan/work"
# c.DockerSpawner.notebook_dir = notebook_dir
# workarea_dir = os.environ.get("NOTEBOOK_WORKAREA_DIR") or "/Users/wu049/bigcat_cabb/notebooks"

# # Mount the real user's Docker volume on the host to the notebook user's
# # notebook directory in the container
# c.DockerSpawner.volumes = {workarea_dir + "/jupyterhub-user-{username}": notebook_dir}

# c.JupyterHub.ssl_key = '/tmp/localhost.key'
# c.JupyterHub.ssl_cert = '/tmp/localhost.crt'
# c.JupyterHub.port = 443

# # Remove containers once they are stopped
# c.DockerSpawner.remove = True

# # For debugging arguments passed to spawned containers
# c.DockerSpawner.debug = True

# User containers will access hub by container name on the Docker network
# c.JupyterHub.hub_ip = "jupyterhub"
c.JupyterHub.hub_port = 8080

# Persist hub data on volume mounted inside container
c.JupyterHub.cookie_secret_file = "/data/jupyterhub_cookie_secret"
c.JupyterHub.db_url = "sqlite:////data/jupyterhub.sqlite"

# Authenticate users with Native Authenticator
# c.JupyterHub.authenticator_class = "nativeauthenticator.NativeAuthenticator"
# Allow anyone to sign-up without approval
# c.NativeAuthenticator.open_signup = True
c.JupyterHub.authenticator_class = 'jupyterhub.auth.DummyAuthenticator'
c.DummyAuthenticator.password = "password"

# c.JupyterHub.authenticator_class = "oauthenticator.generic.GenericOAuthenticator"
# c.GenericOAuthenticator.client_id = "7d7m6trdqg7g7vicmu1h95vdrd"
# c.GenericOAuthenticator.client_secret = "1da53fsoeiv5gk4p4njfij9i06cka2nk86997i4vkqiifbqb2qss"
# c.GenericOAuthenticator.oauth_callback_url = "https://localhost/hub/oauth_callback"

# c.GenericOAuthenticator.authorize_url = "https://bigcat.auth.us-east-1.amazoncognito.com/oauth2/authorize"
# c.GenericOAuthenticator.token_url = "https://bigcat.auth.us-east-1.amazoncognito.com/oauth2/token"
# c.GenericOAuthenticator.userdata_url = "https://bigcat.auth.us-east-1.amazoncognito.com/oauth2/userInfo"
# # c.GenericOAuthenticator.logout_redirect_url = "https://localhost"

# c.GenericOAuthenticator.logout_redirect_url = "https://bigcat.auth.us-east-1.amazoncognito.com/logout?client_id=7d7m6trdqg7g7vicmu1h95vdrd&response_type=code&scope=email+openid+phone&redirect_uri=https://localhost/"
# # these are always the same
# c.GenericOAuthenticator.login_service = "AWSCognito"
# c.GenericOAuthenticator.username_key = "username"
# # c.GenericOAuthenticator.userdata_method = "POST"

# Allowed admins
admin = os.environ.get("JUPYTERHUB_ADMIN")
if admin:
    c.Authenticator.admin_users = [admin]