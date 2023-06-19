import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";

import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";


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

  constructor(scope: Construct, id: string, config: any) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": config['environment']
    };

    // create a role for lambda functions 
    const role = new IamRole(this, "lambda-exec", {
      name: 'bigcat-lambda-role',
      tags: tag,
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy)
    });

    new IamRolePolicyAttachment(this, 'bigcat-lambda-exec', {
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      role: role.name
    });

    new IamRolePolicyAttachment(this, 'bigcat-lambda-s3', {
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3FullAccess',
      role: role.name
    });

    new IamRolePolicyAttachment(this, 'bigcat-lambda-ec2', {
      policyArn: 'arn:aws:iam::aws:policy/AmazonEC2FullAccess',
      role: role.name
    });

    // create a role for ecs tasks
    const taskRole = new IamRole(this, "ecs-task-exec", {
      name: 'ecsTaskExecutionRole',
      tags: tag,
      assumeRolePolicy: JSON.stringify(ecsRolePolicy)
    });

    new IamRolePolicyAttachment(this, 'ecs-task-exec-log', {
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      role: taskRole.name
    });

    new IamRolePolicyAttachment(this, 'ecs-task-exec-ecr', {
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess',
      role: taskRole.name
    });

    // create an ECS cluster
    new EcsCluster(this, 'bigcat-jupyter-cluster', {
      name: 'bigcat-jupyter-cluster'
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
