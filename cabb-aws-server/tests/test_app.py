from chalice.test import Client
import app
import os
import shutil
import json
from pytest import fixture

PROJECT_NAME = 'projects/test_project'
BASE_DIRECTORY = os.getcwd() + "/cabb-aws-server/tests/test_workarea/jupyterhub-user-wu049"

class TestClass:
  def setup_method(self, method):
    # create test directory
    app.BASE_DIRECTORY = BASE_DIRECTORY
    os.makedirs(BASE_DIRECTORY)
    os.makedirs(BASE_DIRECTORY + "/projects")
    with open(BASE_DIRECTORY + "/test.txt", "a+") as fp:
      fp.close()

  def teardown_method(self, method):
    # delete test directory
    shutil.rmtree(os.getcwd() + "/cabb-aws-server/tests/test_workarea")    

  @fixture
  def test_client(self):
    with Client(app.app) as client:
        yield client

  def test_get_name(self, test_client):
    response = test_client.http.get("/get_name")
    assert response.json_body == {"message": "Xinyu",
                                  "status": "success"}

  def test_list(self, test_client):
    response = test_client.http.get("/list")
    result = [
      {'name': 'projects', 'is_directory': True, 'children': []}, 
      {'name': 'test.txt', 'is_directory': False}
    ]

    assert response.json_body == result

  def test_create_project(self, test_client):
    # create project
    response = test_client.http.get('/create_project?project=' + PROJECT_NAME)
    assert response.json_body == {"status": "success", 
                                  "message": "Project test_project created"}
  
    # make sure new project contents are correct
    response = test_client.http.get("/retrieve_project?project=" + PROJECT_NAME)
    result = {
      'status': 'success', 
      'project': {
        'name': 'test_project', 
        'band_configuration_file': 'band_configuration.json', 
        'correlator_configuration_file': 'correlator_configuration.json', 
        'target_file': 'targets.csv', 
        'schedule_files': '*.sch'
      }, 
      'band_configuration_file': [], 
      'correlator_configuration_file': [], 
      'schedule_files': [], 
      'target_file': ''
    }
    assert response.json_body == result

    # make sure can list files for new project
    response = test_client.http.get("/list_files?project=" + PROJECT_NAME)
    result =[{'name': 'project.json', 'is_directory': False}, 
       {'name': 'band_configuration.json', 'is_directory': False}, 
       {'name': 'correlator_configuration.json', 'is_directory': False}, 
       {'name': 'targets.csv', 'is_directory': False}]
    
    assert response.json_body == result

    # test save file from project
    targets = self.save_file('targets.csv', 'test_catelogue.csv', test_client)
    
    band_config = self.save_file('band_configuration.json',
                                 'test_band_configuration.json', 
                                 test_client)

    corr_config = self.save_file('correlator_configuration.json', 
                                 'test_correlator_configuration.json', 
                                 test_client)
    
    schedule = self.save_file('schedule.sch', 
                              'test_schedule.sch', 
                              test_client)
    
    # retrieve project
    response = test_client.http.get("/retrieve_project?project=" + PROJECT_NAME)
    assert response.json_body['target_file'] == targets
    assert response.json_body['band_configuration_file'] == json.loads(band_config)
    assert response.json_body['correlator_configuration_file'] == json.loads(corr_config)
    assert response.json_body['schedule_files'] == ['schedule.sch']

    # check schedule file content
    filename = PROJECT_NAME + '/schedule.sch'
    response = test_client.http.get(
        '/get_file_content?filename=' + filename,
        headers={'Content-Type':'application/json'},
        body=json.dumps({'example':'json'})
    )
    assert response.json_body['status'] == 'success'
    assert response.json_body['file_content'] == json.loads(schedule)

  def save_file(self, filename, test_filename, test_client):
    # save targets.csv
    filename = PROJECT_NAME + '/' + filename
    test_file = os.getcwd() + '/cabb-aws-server/tests/' + test_filename
    with open(test_file) as f:
      content = f.read()

    data = {
      'filename': filename,
      'content': content
    }
    response = test_client.http.post(
        '/save_file',
        headers={'Content-Type':'application/json'},
        body=json.dumps(data)
    )
    assert response.json_body == {
          'status': 'success',
          'message': 'Saved'
    }

    return content
