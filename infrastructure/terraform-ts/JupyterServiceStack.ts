import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";
import { DataAwsSecurityGroup } from "@cdktf/provider-aws/lib/data-aws-security-group";
import { DataAwsInstance } from "@cdktf/provider-aws/lib/data-aws-instance";


import { ResourceNames } from './ResourceNames'
import { DataAwsEcsTaskDefinition } from "@cdktf/provider-aws/lib/data-aws-ecs-task-definition";

export class JupyterServiceStack extends TerraformStack {

  constructor(scope: Construct, id: string, resources: ResourceNames) {

    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };
    
    const jupyterHubTaskDefinition = new DataAwsEcsTaskDefinition(this,
      resources.JUPYTER_HUB_FAMILY_NAME + '_data', {
        taskDefinition: resources.JUPYTER_HUB_FAMILY_NAME
      }
    );

    const instanceSG = new DataAwsSecurityGroup(this, 
      resources.INSTANCE_SG_NAME + '_data', {
        name: resources.INSTANCE_SG_NAME
      });

    const efsSG = new DataAwsSecurityGroup(this,
      resources.EFS_SG_NAME + '_data', {
        name: resources.EFS_SG_NAME
      });

    const jupyterTaskSG = new DataAwsSecurityGroup(this,
      resources.JUPYTER_TASK_SG_NAME + '_data', {
        name: resources.JUPYTER_TASK_SG_NAME
      });

    const instance = new DataAwsInstance(this,
      resources.INSTANCE_NAME + '_data', {
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

    new EcsService(this, 'bigcat-jupyterhub', {
      name: "bigcat-jupyterhub",
      tags: tag,
      cluster: resources.JUPYTER_CLUSTER_NAME,
      launchType: 'FARGATE',
      taskDefinition: jupyterHubTaskDefinition.arn,
      desiredCount: 1,
      enableExecuteCommand: true,
      networkConfiguration: {
        assignPublicIp: true,
        subnets: [instance.subnetId],
        securityGroups: [instanceSG.id, efsSG.id, jupyterTaskSG.id]
      }
    });
  }
}
