import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { DataAwsSecurityGroup } from "@cdktf/provider-aws/lib/data-aws-security-group";
import { DataAwsVpc } from "@cdktf/provider-aws/lib/data-aws-vpc";


import { ResourceNames } from './ResourceNames'
import { DataAwsSubnets } from "@cdktf/provider-aws/lib/data-aws-subnets";
import { DataAwsIamRole } from "@cdktf/provider-aws/lib/data-aws-iam-role";

export class PrintLamdaStack extends TerraformStack {

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

    const efsSG = new DataAwsSecurityGroup(this,
      resources.EFS_SG_NAME + '_data', {
        name: resources.EFS_SG_NAME
      });

    const vpc = new DataAwsVpc(this, 
      'vpc-data_' + resources.config['environment'], 
      {
        default: true,
        tags: tag
      });

    const subnets = new DataAwsSubnets(this,
      'subnets-lambda-data_' + resources.config['environment'],
      {
        filter: [{
          name: "vpc-id",
          values: [vpc.id]
        }]
      });

    const lambdaRole = new DataAwsIamRole(this,
      resources.LAMBDA_ROLE_NAME + '_role-for-lambda-data', {
        name: resources.LAMBDA_ROLE_NAME
    });

    new TerraformOutput(this, 'vpc-for-lambda-' + resources.config['environment'], {
      value: vpc.id
    });

    new TerraformOutput(this, 'sg-for-lambda-' + resources.config['environment'], {
      value: [internetSG.id, efsSG.id]
    });

    new TerraformOutput(this, 'subnets-for-lambda-' + resources.config['environment'], {
      value: subnets.ids
    });

    new TerraformOutput(this, 'role-for-lambda-' + resources.config['environment'], {
      value: lambdaRole.arn
    });
  }
}
