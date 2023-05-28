from chalice import Chalice, CORSConfig, Response
import json
import os
import copy
import pathlib
import boto3
from botocore.exceptions import ClientError


cors_config = CORSConfig(
    # allow_origin='http://bigcatcabb.s3-website-us-east-1.amazonaws.com',
    allow_origin='*',
    allow_headers=['X-Special-Header'],
    max_age=600,
    expose_headers=['X-Special-Header'],
    allow_credentials=True
)

# TODO: should set value in env
# BASE_DIRECTORY = '/Users/wu049/bigcat_cabb/notebooks/jupyterhub-user-{user}'
BASE_DIRECTORY = '/mnt/efs/workarea/jupyterhub-user-{user}'

# TODO: integrate with single sign on, user_id should come in
USER_ID = 'wu049'

PROJECT_FILE = 'project.json'
PROJECT_JSON= {
  'name': '',
  'band_configuration_file': 'band_configuration.json',
  'correlator_configuration_file': 'correlator_configuration.json',
  'target_file': 'targets.csv',
  'schedule_files': '*.sch'
}

# format
#   band_configuration: [
#     {
#       name: '',
#       centre_freq1: 0,
#       centre_freq2: 0,
#     }
#   ],
#   correlator_setting: [
#     {
#       name: '',
#       band_config_name: '',
#       correlator_config_name: '',
#       sub_band_configuration: [
#         {
#           band: 0,
#           subband: 0,
#           zoom_configuration: '',
#           centre_freq: 0
#         }
#       ],
#     }
#   ],
# }
#

app = Chalice(app_name='cabb-aws-server')
s3_client = boto3.client('s3')


@app.route('/')
def hello_world():
   return 'Hello world!'


@app.route('/get_name')
def get_name():
   return json.dumps({
        "message": 'Xinyu',
        "status": "success",
    })


def get_dir_content(dir_name):
  obj = []
  for filename in os.listdir(dir_name):
    if not filename.startswith('.') and not filename.startswith('_'):
      relative_path = os.path.join(dir_name, filename)
      absolute_path = os.path.abspath(relative_path)
      if os.path.isdir(absolute_path):
        # Directories
        subdir_contents = get_dir_content(absolute_path)
        dir = {
          'name': filename,
          'is_directory': True,
          'children': subdir_contents
        }
        obj.append(dir)
      else:
        # Files
        file = {
          'name': filename,
          'is_directory': False,
        }
        obj.append(file)

  return obj


@app.route('/list_files', cors=cors_config)
def list_files():
  request = app.current_request
  project = request.query_params.get('project', '')
  files = []
  if not project:
    return json.dumps(files, indent=4)

  full_project_name = get_filename(project, USER_ID)
  if not full_project_name:
    return json.dumps(files, indent=4)

  for filename in os.listdir(full_project_name):
    if not filename.startswith('.') and not filename.startswith('_'):
      relative_path = os.path.join(full_project_name, filename)
      absolute_path = os.path.abspath(relative_path)
      if not os.path.isdir(absolute_path):
        # Files
        file = {
            'name': filename,
            'is_directory': False,
        }
        files.append(file)

  return json.dumps(files, indent=4)

@app.route('/list', cors=cors_config)
def list_directory():
  obj = get_dir_content(BASE_DIRECTORY.format(user=USER_ID))
  return json.dumps(obj, indent=4)

def retrieve_file(fullname):
  text = ''
  with open(fullname, 'a+') as fp:
    fp.close()

  with open(fullname, 'r') as fp:
    text = fp.read()
    fp.close()

  return text

@app.route('/create_project', cors=cors_config)
def create_project():
  request = app.current_request
  project_name = request.query_params.get('project', '')
  full_filename = get_filename(project_name, USER_ID)

  if not full_filename:
    result = {
        'status': 'fail',
        'message': 'Could not create project'
    }
    return json.dumps(result)

  if not os.path.exists(full_filename):
    os.makedirs(full_filename)

  path = pathlib.Path(full_filename)

  # add to the directory 
  # - project.json file
  # - band_configuration.json
  # - correlator_configuration.jspn
  project_json = copy.deepcopy(PROJECT_JSON)
  project_json['name'] = path.name

  project_file = full_filename + '/' + PROJECT_FILE
  with open(project_file, 'w') as fp:
    fp.write(json.dumps(project_json, indent=4))
  
  band_config_file = full_filename + '/' + \
      project_json.get('band_configuration_file', '')
  retrieve_file(band_config_file)

  corr_config_file = full_filename + '/' + \
      project_json.get('correlator_configuration_file', '')
  retrieve_file(corr_config_file)

  target_file = full_filename + '/' + \
      project_json.get('target_file', '')
  retrieve_file(target_file)

  result = {
      'status': 'success',
      'message': 'Project {project_name} created'.format(
                  project_name=project_json['name'])
  }
  return json.dumps(result)

def get_project(project_name, schedule=None):
  full_filename = get_filename(project_name, USER_ID)

  if not full_filename:
    raise Exception('Project does not exist')

  if not os.path.exists(full_filename):
    raise Exception('Project does not exist')
  
  # retrieve from directory
  # - project.json
  # - band_configuration.json
  # - correlator_configuration.json
  # - targets.csv
  project_file = full_filename + '/' + PROJECT_FILE
  with open(project_file) as fp:
    project_json = json.load(fp)

  band_config_file = full_filename + '/' + \
      project_json.get('band_configuration_file', 
                       PROJECT_JSON['band_configuration_file'])
  content = retrieve_file(band_config_file)
  if content:
    band_config = json.loads(content)
  else:
    band_config = []

  target_file = full_filename + '/' + \
      project_json.get('target_file', PROJECT_JSON['target_file'])
  content = retrieve_file(target_file)
  target = content

  corr_config_file = full_filename + '/' + \
      project_json.get('correlator_configuration_file', 
                       PROJECT_JSON['correlator_configuration_file'])
  content = retrieve_file(corr_config_file)

  if content:
    corr_config = json.loads(content)
  else:
    corr_config = []

  result = {
      'status': 'success',
      'project': project_json,
      'band_configuration_file': band_config,
      'correlator_configuration_file': corr_config,
      'target_file': target
  }

  if schedule:
    # retrieve schedule file
    schedule_file = full_filename + '/' + schedule
    content = retrieve_file(schedule_file)
    if content:
      schedule_content = json.loads(content)
      result['schedule_file'] = schedule_content
    else:
      raise Exception('Schedule does not exist')
  else:
    results = []
    results += [each for each in os.listdir(full_filename)
                if each.endswith('.sch')]
    result['schedule_files'] = results

  return result


@app.route('/retrieve_project', cors=cors_config)
def retrieve_project():
  request = app.current_request
  project_name = request.query_params.get('project', '')

  try:
    result = get_project(project_name=project_name)
  except:
    result = {
        'status': 'fail',
        'message': 'Project does not exist'
    }

  return json.dumps(result)


@app.route('/deploy_schedule', cors=cors_config)
def deploy_schedule():
  request = app.current_request
  schedule = request.query_params.get('schedule', '')
  project_name = request.query_params.get('project', '')
  try:
    result = get_project(project_name=project_name, schedule=schedule)
    # write content to s3 bucket
    s3_name = USER_ID + '-' + project_name + '-' + schedule.replace('.sch', '.json')
    s3_name = s3_name.replace('/', '-')
    s3_client.put_object(
      Body = json.dumps(result), 
      Bucket = 'atcaschedules', 
      Key = s3_name)
    result = {
        'status': 'success',
        'message': 'Schedule deployed as: ' + s3_name
    }
  except ClientError as e:
    result = {
        'status': 'fail',
        'message': 'Failed to deploy'
    }
  except Exception as  ex:
    result = {
        'status': 'fail',
        'message': 'Failed to deploy'
    }

  return json.dumps(result)
    

@app.route('/get_file_content', cors=cors_config)
def get_file():
  request = app.current_request
  filename = request.query_params.get('filename', '')

  full_filename = get_filename(filename, USER_ID)

  if not full_filename:
    result = {
        'status': 'fail',
        'message': 'Could not retrieve file'
    }
    return json.dumps(result)

  file_content = ''
  if os.path.isfile(full_filename):
    with open(full_filename) as f:
      file_content = f.read()

  # make sure file is a json file 
  try:
    json.loads(file_content)
  except Exception as e:
    result = {
        'status': 'fail',
        'message': 'Could not retrieve file'
    }
    return json.dumps(result)

  result = {
      'status': 'success',
      'file_content': json.loads(file_content)
  }
  return result


def get_filename(filename, userid):
  if not filename:
    return ''
  
  root = BASE_DIRECTORY.format(user=userid)
  relative_path = os.path.join(root, filename)
  absolute_path = os.path.abspath(relative_path)

  # make sure the absolute_path is under root
  if absolute_path.startswith(root):
    return absolute_path
  
  return ''

@app.route('/save_file', methods=['POST'], cors=cors_config)
def save_file():
  request = app.current_request
  data = request.json_body

  if data:
    try:
      filename = data.get('filename', '')
      filecontent = data.get('content', '')
      full_filename = get_filename(filename, USER_ID)

      if not full_filename or not filecontent:
        result = {
            'status': 'fail',
            'message': 'Could not save changes'
        }
        return json.dumps(result)

      with open(full_filename, 'w') as f:
        if isinstance(filecontent, str):
          f.write(filecontent)
        else:
          f.write(json.dumps(filecontent, indent=4))

        f.close()

      result = {
          'status': 'success',
          'message': 'Saved'
      }
      return json.dumps(result)

    except Exception as e:
      result = {
          'status': 'fail',
          'message': 'Could not save changes'
      }
      return json.dumps(result)
