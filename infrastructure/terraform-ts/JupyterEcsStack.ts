import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";
import { DataAwsEfsFileSystem } from "@cdktf/provider-aws/lib/data-aws-efs-file-system";
import { DataAwsIamRole } from "@cdktf/provider-aws/lib/data-aws-iam-role";

import { ResourceNames } from './ResourceNames'
import { DataAwsEcrRepository } from "@cdktf/provider-aws/lib/data-aws-ecr-repository";
import { DataAwsInstance } from "@cdktf/provider-aws/lib/data-aws-instance";
import { DataAwsSecurityGroup } from "@cdktf/provider-aws/lib/data-aws-security-group";

export class JupyterEcsStack extends TerraformStack {

  constructor(scope: Construct, id: string, resources: ResourceNames) {

    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };
    
    const efs = new DataAwsEfsFileSystem(this, resources.EFS_NAME + '_ecs-data', {});

    const taskRole = new DataAwsIamRole(this,
      resources.ECS_TASK_ROLE_NAME + '_ecs-data', {
      name: resources.ECS_TASK_ROLE_NAME
    });

    const taskExecutionRole = new DataAwsIamRole(this,
      resources.ECS_TASK_EXCUTION_ROLE_NAME + '_ecs-data', {
      name: resources.ECS_TASK_EXCUTION_ROLE_NAME
    });

    const jupyterhub = new DataAwsEcrRepository(this,
      resources.JUPYTER_HUB_REPOSITORY_NAME + '_ecs-data',
      {
        name: resources.JUPYTER_HUB_REPOSITORY_NAME,
      });

    const jupyterlab = new DataAwsEcrRepository(this,
      resources.JUPYTER_REPOSITORY_NAME + '_ecs-data',
      {
        name: resources.JUPYTER_REPOSITORY_NAME,
      });
    
    const instance = new DataAwsInstance(this,
      resources.INSTANCE_NAME + '_ecs-data', {
      filter: [{
        name: "tag:Environment",
        values: [resources.config['environment']]
      },
      {
        name: "instance-state-name",
        values: ['running']
      }
      ]
    });

    const instanceSG = new DataAwsSecurityGroup(this,
      resources.INSTANCE_SG_NAME + '_ecs-data', {
      name: resources.INSTANCE_SG_NAME
    });

    const efsSG = new DataAwsSecurityGroup(this,
      resources.EFS_SG_NAME + '_ecs-data', {
      name: resources.EFS_SG_NAME
    });

    const jupyterTaskSG = new DataAwsSecurityGroup(this,
      resources.JUPYTER_TASK_SG_NAME + '_ecs-data', {
      name: resources.JUPYTER_TASK_SG_NAME
    });

    // create task definition for jupyter hub
    const jupyterHubContainerDefinition = [
      {
        "name": "jupyter-hub-xinyu_" + resources.config['environment'],
        "image": jupyterhub.repositoryUrl,
        "essential": true,
        "healthCheck": {
          "command": [
            "CMD-SHELL",
            "echo hello"
          ],
          "interval": 5,
          "timeout": 2,
          "retries": 3
        },
        "environment": [
          {
            "name": "CULL_TIMEOUT",
            "value": "600"
          },
          {
            "name": "CULL_FREQUENCY",
            "value": "600"
          },
          {
            "name": "TASK_ROLE_ARN", 
            "value": taskRole.arn
          },
          {
            "name": "EXECUTION_ROLE_ARN", 
            "value":taskExecutionRole.arn
          },
          {
            "name": "SUBNETS",
            "value": instance.subnetId
          },
          {
            "name": "SECURITY_GROUPS",
            "value": [instanceSG.id, efsSG.id, jupyterTaskSG.id].join(',')
          },
          {
            "name": "JUPYTER_LAB_REPOSITORY",
            "value": jupyterlab.repositoryUrl
          },
          {
            "name": "CLUSTER_NAME",
            "value": resources.JUPYTER_CLUSTER_NAME
          },
          {
            "name": "EFS_FILE_SYSTEM_ID",
            "value": efs.fileSystemId
          }
        ],
        "portMappings": [
          {
            "containerPort": 8000,
            "hostPort": 8000,
            "protocol": "tcp"
            }
        ],
        "mountPoints": [
          {
            "sourceVolume": "efs",
            "containerPath": "/efs"
            },
          {
            "sourceVolume": "data",
            "containerPath": "/data"
            }
        ],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-create-group": "true",
            "awslogs-group": "firelens-container",
            "awslogs-region": resources.config['region'],
            "awslogs-stream-prefix": "firelens"
            }
        }
      }
    ];

    // create service for jupyter hub
    new EcsTaskDefinition( this, 
      'jupyter-hub-xinyu_' + resources.config['environment'],
      {
        tags: tag,
        requiresCompatibilities: ["FARGATE"],
        family: resources.JUPYTER_HUB_FAMILY_NAME,
        containerDefinitions: JSON.stringify(jupyterHubContainerDefinition),
        volume: [
          {
            name: "efs",
            efsVolumeConfiguration: {
              fileSystemId: efs.fileSystemId,
              rootDirectory: "/efs",
              transitEncryption: "ENABLED"
            }
          },
          {
            name: "data",
            efsVolumeConfiguration: {
              fileSystemId: efs.fileSystemId,
              rootDirectory: "/efs/data",
              transitEncryption: "ENABLED"
            }
          }
        ],
        taskRoleArn: taskRole.arn,
        networkMode: "awsvpc",
        memory: "3 GB",
        cpu: "1 vCPU",
        executionRoleArn: taskExecutionRole.arn
    });
  }
}
