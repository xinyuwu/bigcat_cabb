import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";

import { DataAwsSecurityGroup } from "@cdktf/provider-aws/lib/data-aws-security-group";
import { DataAwsVpc } from "@cdktf/provider-aws/lib/data-aws-vpc";
import { DataAwsAcmCertificate } from "@cdktf/provider-aws/lib/data-aws-acm-certificate";


import { ResourceNames } from './ResourceNames'
import { DataAwsEcsTaskDefinition } from "@cdktf/provider-aws/lib/data-aws-ecs-task-definition";
import { DataAwsSubnets } from "@cdktf/provider-aws/lib/data-aws-subnets";

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
    
    const internetSG = new DataAwsSecurityGroup(this,
      resources.INTERNET_SG_NAME + '_data', {
      name: resources.INTERNET_SG_NAME
    });

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

    const vpc = new DataAwsVpc(this, 
      'vpc-data_' + resources.config['environment'], 
      {
        default: true,
        tags: tag
      });

    const subnets = new DataAwsSubnets(this,
      'subnets-data_' + resources.config['environment'],
      {
        filter: [{
          name: "vpc-id",
          values: [vpc.id]
        }]
      });

    const sslCertificate = new DataAwsAcmCertificate(this, 
      resources.SIMULATOR_SUB_DOMAIN_NAME + '_ssl-data', 
      {
      domain: resources.SIMULATOR_SUB_DOMAIN_NAME,
      statuses: ["ISSUED"]    
    });

    // create application load balancer
    const lb = new Lb(this, 
      resources.JUPYTER_SERVICE_NAME + '-lb', 
      {
        name: resources.JUPYTER_SERVICE_NAME + '-lb',
        tags: tag,
        internal: false,
        loadBalancerType: "application",
        subnets: subnets.ids,
        securityGroups: [internetSG.id, efsSG.id, jupyterTaskSG.id],
        enableDeletionProtection: false,
    });

    // create target group
    const lbTargetGroup = new LbTargetGroup(this, 
      resources.JUPYTER_SERVICE_NAME + '-tg', 
      {
        name: resources.JUPYTER_SERVICE_NAME + '-tg',
        tags: tag,
        port: 80,
        protocol: "HTTP",
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          matcher: '200,302'
        }
    });

    // create load balancer listener
    new LbListener(this, resources.JUPYTER_SERVICE_NAME + '_lb-listener', {
      tags: tag,
      loadBalancerArn: lb.arn,
      port: 443,
      protocol: "HTTPS",
      sslPolicy: 'ELBSecurityPolicy-2016-08',
      certificateArn: sslCertificate.arn,

      defaultAction:  [{
        type: "forward",
        targetGroupArn: lbTargetGroup.arn
      }]
    });

    new EcsService(this, resources.JUPYTER_SERVICE_NAME, {
      name: resources.JUPYTER_SERVICE_NAME,
      tags: tag,
      cluster: resources.JUPYTER_CLUSTER_NAME,
      launchType: 'FARGATE',
      taskDefinition: jupyterHubTaskDefinition.arn,
      desiredCount: 1,
      enableExecuteCommand: true,
      networkConfiguration: {
        assignPublicIp: true,
        subnets: subnets.ids,
        securityGroups: [instanceSG.id, efsSG.id, jupyterTaskSG.id]
      },
      loadBalancer: [{
        targetGroupArn: lbTargetGroup.arn,
        containerName: resources.JUPYTER_HUB_FAMILY_NAME,
        containerPort: resources.JUPYTER_HUB_CONTAINER_PORT
      }]
    });
  }
}
