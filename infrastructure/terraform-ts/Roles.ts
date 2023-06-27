import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";

import {ResourceNames} from './ResourceNames'

const lambdaRolePolicy = {
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

const ecsRolePolicy = {
  "Version": "2008-10-17",
    "Statement": [
      {
        "Sid": "",
        "Effect": "Allow",
        "Principal": {
          "Service": "ecs-tasks.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
}

export class RoleStack extends TerraformStack {

  taskRole: IamRole;
  executionRole: IamRole;


  constructor(scope: Construct, id: string, resources: ResourceNames) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };

    // create a role for lambda functions 
    const role = new IamRole(this, resources.LAMBDA_ROLE_NAME, {
      name: resources.LAMBDA_ROLE_NAME,
      tags: tag,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy)
    });

    new IamRolePolicyAttachment(this, 
      resources.LAMBDA_ROLE_NAME + '_execution', 
      {
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        role: role.name
    });

    new IamRolePolicyAttachment(this, 
      resources.LAMBDA_ROLE_NAME + '_s3-access', 
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
        role: role.name
    });

    new IamRolePolicyAttachment(this, 
      resources.LAMBDA_ROLE_NAME + '_ec2-access', 
      {
        policyArn: 'arn:aws:iam::aws:policy/AmazonEC2FullAccess',
        role: role.name
    });

    // create a role for ecs task execution
    this.executionRole = new IamRole(this, 
      resources.ECS_TASK_EXCUTION_ROLE_NAME, 
      {
        name: resources.ECS_TASK_EXCUTION_ROLE_NAME,
        tags: tag,
        assumeRolePolicy: JSON.stringify(ecsRolePolicy)
    });

    new IamRolePolicyAttachment(this, 
      resources.ECS_TASK_EXCUTION_ROLE_NAME + '_ecs-task-execution',
      {
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        role: this.executionRole.name
    });

    new IamRolePolicyAttachment(this, 
      resources.ECS_TASK_EXCUTION_ROLE_NAME + '_ecr-access', 
      {
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess',
        role: this.executionRole.name
    });

    new IamRolePolicyAttachment(this,
      resources.ECS_TASK_EXCUTION_ROLE_NAME + '_log-access',
      {
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSAppSyncPushToCloudWatchLogs',
        role: this.executionRole.name
      });


    // allow to carry out various ecs tasks, such as DescribeTaskDefinition, RegisterTaskDefinition
    const taskRolePolicy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "",
          "Effect": "Allow",
          "Action": [
            "ecs:*",
            "iam:PassRole"
          ],
          "Resource": "*"
        }
      ]
    }

    // create a role for ecs tasks
    this.taskRole = new IamRole(this, resources.ECS_TASK_ROLE_NAME, {
      name: resources.ECS_TASK_ROLE_NAME,
      tags: tag,
      assumeRolePolicy: JSON.stringify(ecsRolePolicy),
    });

    new IamRolePolicyAttachment(this, 
      resources.ECS_TASK_ROLE_NAME + '_ecs-task-execution', 
      {
        policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        role: this.taskRole.name
    });

    new IamRolePolicy(this, 
      resources.ECS_TASK_ROLE_NAME + '_ecs-actions', 
      {
        policy: JSON.stringify(taskRolePolicy),
        role: this.taskRole.name,
        name: 'allow-full-ecs-actions'
    });

    // create a role to sync with schedule bucket
    // const syncScheduleRolePolicy = {
    //   "Version": "2012-10-17",
    //   "Statement": [
    //     {
    //       "Sid": "VisualEditor0",
    //       "Effect": "Allow",
    //       "Action": "s3:*",
    //       "Resource": "arn:aws:s3:::atcaschedules",
    //       "Condition": {
    //         "StringEquals": {
    //           "aws:SourceVpc": "vpc-02e7d36f4a2bc2a5d"
    //         }
    //       }
    //     },
    //     {
    //       "Sid": "VisualEditor2",
    //       "Effect": "Allow",
    //       "Action": "s3:*",
    //       "Resource": "arn:aws:s3:::atcaschedules",
    //       "Condition": {
    //         "ForAnyValue:IpAddress": {
    //           "aws:SourceIp": [
    //             "130.155.199.8/32",
    //             "140.79.64.115/32"
    //           ]
    //         }
    //       }
    //     }
    //   ]
    // };
  }
}
