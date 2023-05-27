import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { Instance } from "@cdktf/provider-aws/lib/instance";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";

import { TerraformOutput } from 'cdktf';

// create instance to run jupyterhub
// - create instance
// - create efs
// - install Docker
// - install efs 
// - add mount to efs

export class EC2InstanceStack extends TerraformStack {

  instance: Instance;

  constructor(scope: Construct, id: string, config: any) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": config['environment']
    };

    // 👇 create Security Group for the Instance
    // allow http, http and ssh traffic from my ip (from home and work)
    const instanceSG = new SecurityGroup(this, 'jupyter-instance-sg', {
      tags: tag,
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["140.79.64.115/32", "130.155.199.8/32"]
          // cidrBlocks: ["0.0.0.0/0"]
        },{
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ["140.79.64.115/32", "130.155.199.8/32"]
          // cidrBlocks: ["0.0.0.0/0"]
        }, {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["140.79.64.115/32", "130.155.199.8/32"]
          // cidrBlocks: ["0.0.0.0/0"]
        }
      ]
    });
    
    this.instance = new Instance(this, "bigcat-jupyter-instance", {
      ami: "ami-080392f82831e4f6e",
      instanceType: "t4g.small",
      keyName: 'bigcat',
      tags: tag,
      rootBlockDevice: {
        volumeSize: 16
      },
      vpcSecurityGroupIds: [instanceSG.id],
    });

    new TerraformOutput(this, "network", {
      value: this.instance.networkInterface,
    });
    new TerraformOutput(this, "instance_ip", {
      value: this.instance.publicIp,
    });
  }
    
}
