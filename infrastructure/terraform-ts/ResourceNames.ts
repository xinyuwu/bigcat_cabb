
export class ResourceNames {
  private _config: any;

  private _JUPYTER_HUB_REPOSITORY_NAME = 'bigcat-jupyter-hub-repository';
  private _JUPYTER_REPOSITORY_NAME = 'bigcat-jupyter-repository';
  private _JUPYTER_CLUSTER_NAME = 'bigcat-jupyter-cluster';
  private _JUPYTER_SERVICE_NAME = 'bigcat-jh-service';
  private _JUPYTER_HUB_FAMILY_NAME = "jupyter-hub-xinyu";
  private _JUPYTER_HUB_CONTAINER_PORT = 8000;
  
  private _SCHEDULER_FRONTEND_BUCKET_NAME = "bigcatcabb-frontend";
  private _SCHEDULES_BUCKET_NAME = "bigcat-schedules";
  private _ECS_TASK_ROLE_NAME = 'ecsTaskRole';
  private _ECS_TASK_EXCUTION_ROLE_NAME = 'ecsTaskExecutionRole';
  private _LAMBDA_ROLE_NAME = 'bigcat-lambda-role';

  private _INTERNET_SG_NAME = 'internet-sg';
  private _INSTANCE_SG_NAME = 'ec2-host-sg';
  private _EFS_SG_NAME = "full-access-to-efs-sg";
  private _JUPYTER_TASK_SG_NAME = "jupyter-task-sg";
  private _EFS_NAME = "bigcat-efs";
  private _EFS_ACCESS_PONT_NAME = "bigcat-efs-access-point";
  private _EFS_MOUNT_NAME = "bigcat-efs-mount";

  private _INSTANCE_NAME = "bigcat-instance";

  private _TEST_DOMAIN_NAME = 'bigcat-test.org';
  private _PRODUCTION_DOMAIN_NAME = '';

  constructor(config: any) {
    this._config = config;
  }

  get config() {
    return this._config;
  }

  get JUPYTER_HUB_FAMILY_NAME() {
    return this._JUPYTER_HUB_FAMILY_NAME + '-' + this.config['environment'];
  }

  get INSTANCE_NAME() {
    return this._INSTANCE_NAME + '-' + this.config['environment'];
  }

  get EFS_MOUNT_NAME() {
    return this._EFS_MOUNT_NAME + '-' + this.config['environment'];
  }

  get EFS_NAME() {
    return this._EFS_NAME + '-' + this.config['environment'];
  }

  get EFS_ACCESS_PONT_NAME() {
    return this._EFS_ACCESS_PONT_NAME + '-' + this.config['environment'];
  }

  get JUPYTER_HUB_REPOSITORY_NAME() {
    return this._JUPYTER_HUB_REPOSITORY_NAME + '-' + this.config['environment'];
  }

  get JUPYTER_REPOSITORY_NAME() {
    return this._JUPYTER_REPOSITORY_NAME + '-' + this.config['environment'];
  }

  get JUPYTER_CLUSTER_NAME() {
    return this._JUPYTER_CLUSTER_NAME + '-' + this.config['environment'];
  }

  get SCHEDULER_FRONTEND_BUCKET_NAME() {
    return this._SCHEDULER_FRONTEND_BUCKET_NAME + '-' + this.config['environment'];
  }

  get SCHEDULES_BUCKET_NAME() {
    return this._SCHEDULES_BUCKET_NAME + '-' + this.config['environment'];
  }

  get ECS_TASK_ROLE_NAME() {
    return this._ECS_TASK_ROLE_NAME + '-' + this.config['environment'];
  }

  get ECS_TASK_EXCUTION_ROLE_NAME() {
    return this._ECS_TASK_EXCUTION_ROLE_NAME + '-' + this.config['environment'];
  }

  get LAMBDA_ROLE_NAME() {
    return this._LAMBDA_ROLE_NAME + '-' + this.config['environment'];
  }

  get INTERNET_SG_NAME() {
    return this._INTERNET_SG_NAME + '-' + this.config['environment'];
  }
  
  get INSTANCE_SG_NAME() {
    return this._INSTANCE_SG_NAME + '-' + this.config['environment'];
  }

  get EFS_SG_NAME() {
    return this._EFS_SG_NAME + '-' + this.config['environment'];
  }

  get JUPYTER_TASK_SG_NAME() {
    return this._JUPYTER_TASK_SG_NAME + '-' + this.config['environment'];
  }

  get DOMAIN_NAME() {
    if (this.config['environment'] !== 'prod') {
      return this._TEST_DOMAIN_NAME;
    }
    return this._PRODUCTION_DOMAIN_NAME;
  }

  get SIMULATOR_SUB_DOMAIN_NAME() {
    if (this.config['environment'] !== 'prod') {
      return 'simulator-' + this.config['environment'] + '.' + this.DOMAIN_NAME;
    }
    return '';
  }

  get SCHEDULER_SUB_DOMAIN_NAME() {
    if (this.config['environment'] !== 'prod') {
      return 'scheduler-' + this.config['environment'] + '.' + this.DOMAIN_NAME;
    }
    return '';
  }

  get API_SUB_DOMAIN_NAME() {
    if (this.config['environment'] !== 'prod') {
      return 'api-' + this.config['environment'] + '.' + this.DOMAIN_NAME;
    }
    return '';
  }

  get JUPYTER_HUB_CONTAINER_PORT() {
    return this._JUPYTER_HUB_CONTAINER_PORT;
  }

  get JUPYTER_SERVICE_NAME() {
    return this._JUPYTER_SERVICE_NAME + '-' + this.config['environment'];
  }

}