import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { DataAwsEcrRepository } from "@cdktf/provider-aws/lib/data-aws-ecr-repository";


import { ResourceNames } from './ResourceNames'

export class JupyterEcrNameStack extends TerraformStack {

  jupyterhub: DataAwsEcrRepository;

  constructor(scope: Construct, id: string, resources: ResourceNames) {

    super(scope, id);

    // can only query ecr data on virginia region
    new aws.provider.AwsProvider(this, "aws-virginia", {
      region: "us-east-1",
      alias: "virginia"
    })
    
    this.jupyterhub = new DataAwsEcrRepository(this,
      resources.JUPYTER_HUB_REPOSITORY_NAME + '_data',
      {
        name: resources.JUPYTER_HUB_REPOSITORY_NAME,
    });
  }
}
