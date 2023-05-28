import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { Instance } from "@cdktf/provider-aws/lib/instance";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { DefaultVpc } from "@cdktf/provider-aws/lib/default-vpc";

import { EfsFileSystem } from "@cdktf/provider-aws/lib/efs-file-system";
import { EfsMountTarget } from "@cdktf/provider-aws/lib/efs-mount-target";
import { EfsAccessPoint } from "@cdktf/provider-aws/lib/efs-access-point";

import { TerraformOutput } from 'cdktf';

// create instance to run jupyterhub
// - create instance
// - create and mount efs
// - install Docker, git etc

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
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"]
        }
      ]
    });

    const defaultVpc = new DefaultVpc(this, 'bigcat-default-vpc', {
      tags: tag,
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    const efsSG = new SecurityGroup(this, 'bigcat-efs-sg', {
      vpcId: defaultVpc.id,
      ingress: [{
        fromPort: 2049,
        toPort: 2049,
        protocol: "tcp",
        securityGroups: [`${instanceSG.id}`]
      }],

      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"]
      }]    
    });

    const efs = new EfsFileSystem(this, 'bigcat-user-data', {
      tags: tag,
    });

    const accessPoint = new EfsAccessPoint(this, 'bigcat-efs-access', {
      fileSystemId: efs.id,
      posixUser: {
        gid: 1000,
        uid: 1000
      },
      rootDirectory: {
        path: "/",
      }
    });

    const mount = `${efs.id} /mnt/efs efs _netdev,tls,accesspoint=${accessPoint.id} 0 0`
    const script = [
      '#!/bin/bash',
      'sudo yum install -y docker',
      'sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose',
      'sudo yum install -y amazon-efs-utils',
      'sudo yum install -y git',
      'sudo service docker start',
      'sudo usermod -a -G docker ec2-user',
      'sudo mkdir -p /mnt/efs',
      `sudo echo ${mount} >> /etc/fstab`,
      "sudo /usr/sbin/shutdown -r 1"
    ];

    this.instance = new Instance(this, "bigcat-jupyter-instance", {
      ami: "ami-080392f82831e4f6e",
      instanceType: "t4g.small",
      keyName: 'bigcat',
      tags: tag,
      rootBlockDevice: {
        volumeSize: 16
      },
      vpcSecurityGroupIds: [instanceSG.id, efsSG.id],
      userData: script.join('\n')
    });

    new EfsMountTarget(this, 'bigcat-efs-mount', {
      fileSystemId: efs.id,
      securityGroups: [efsSG.id],
      subnetId: this.instance.subnetId,
    });

    new TerraformOutput(this, "vpcSecurityGroupIds", {
      value: this.instance.vpcSecurityGroupIds,
    });
    new TerraformOutput(this, "instance_ip", {
      value: this.instance.publicIp,
    });

    new TerraformOutput(this, "mount", {
      value: mount,
    });
  }
}
