import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcrRepository } from "@cdktf/provider-aws/lib/ecr-repository";

import { ResourceNames } from './ResourceNames'

export class JupyterEcrStack extends TerraformStack {
  constructor(scope: Construct, id: string, resources: ResourceNames) {

    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };

    // create ECR repositories:
    // - one for jupyterhub
    // - one for jupyternote book
    new EcrRepository(this, resources.JUPYTER_HUB_REPOSITORY_NAME, {
      name: resources.JUPYTER_HUB_REPOSITORY_NAME,
      tags: tag
    });

    new EcrRepository(this, resources.JUPYTER_REPOSITORY_NAME, {
      name: resources.JUPYTER_REPOSITORY_NAME,
      tags: tag
    });

    // create an ECS cluster
    new EcsCluster(this, resources.JUPYTER_CLUSTER_NAME, {
      name: resources.JUPYTER_CLUSTER_NAME,
      tags: tag
    });
  }
}
