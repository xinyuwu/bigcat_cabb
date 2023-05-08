from chalice import Chalice
import json
import os
import copy
import pathlib


# BASE_DIRECTORY = '/Users/wu049/bigcat_cabb/notebooks/jupyterhub-user-{user}'
BASE_DIRECTORY = '/mnt/workarea/workarea/jupyterhub-user-{user}'
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


@app.route('/list_files')
def list_files():
  request = app.current_request
  project = request.args.get('project', '')
  files = []
  if not project:
    return json.dumps(files, indent=4)

  full_project_name = get_file_content(project, 'wu049')
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

@app.route('/list')
def list_directory():
  root = BASE_DIRECTORY
  obj = get_dir_content(root.format(user='wu049'))
  return json.dumps(obj, indent=4)

def retrieve_file(fullname):
  text = ''
  with open(fullname, 'a+') as fp:
    fp.close()

  with open(fullname, 'r') as fp:
    text = fp.read()
    fp.close()

  return text

@app.route('/create_project')
def create_project():
  request = app.current_request
  project_name = request.args.get('project', '')
  full_filename = get_file_content(project_name, 'wu049')

  if not full_filename:
    result = {
        'status': 'fail',
        'message': 'Could not create project'
    }
    return json.dump(result)

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
  return json.dump(result)


@app.route('/retrieve_project')
def retrieve_project():
  request = app.current_request
  project_name = request.args.get('project', '')
  full_filename = get_file_content(project_name, 'wu049')

  if not full_filename:
    result = {
        'status': 'fail',
        'message': 'Project does not exist'
    }
    return json.dump(result)

  if not os.path.exists(full_filename):
    result = {
        'status': 'fail',
        'message': 'Project does not exist!'
    }
    return json.dump(result)
  
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

  results = []
  results += [each for each in os.listdir(full_filename)
              if each.endswith('.sch')]
  
  result = {
      'status': 'success',
      'project': project_json,
      'band_configuration_file': band_config,
      'correlator_configuration_file': corr_config,
      'schedule_files': results,
      'target_file': target
  }
  return json.dump(result)


@app.route('/get_file')
def get_file():
  request = app.current_request
  filename = request.args.get('filename', '')

  full_filename = get_file_content(filename, 'wu049')

  if not full_filename:
    result = {
        'status': 'fail',
        'message': 'Could not retrieve file'
    }
    return json.dump(result)

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
    return json.dump(result)

  result = {
      'status': 'success',
      'file_content': json.loads(file_content)
  }
  return result


def get_file_content(filename, userid):
  if not filename:
    return ''
  
  root = BASE_DIRECTORY.format(user=userid)
  relative_path = os.path.join(root, filename)
  absolute_path = os.path.abspath(relative_path)

  # make sure the absolute_path is under root
  if absolute_path.startswith(root):
    return absolute_path
  
  return ''

@app.route('/save_file', methods=['POST'])
def save_file():
  request = app.current_request
  post_data = request.get_data()

  if post_data:
    try:
      data = json.loads(post_data)
      filename = data.get('filename', '')
      filecontent = data.get('content', '')
      full_filename = get_file_content(filename, 'wu049')

      if not full_filename or not filecontent:
        result = {
            'status': 'fail',
            'message': 'Could not save changes'
        }
        return json.dump(result)

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
      return json.dump(result)
    except Exception as e:
      result = {
          'status': 'fail',
          'message': 'Could not save changes'
      }
      return json.dump(result)
