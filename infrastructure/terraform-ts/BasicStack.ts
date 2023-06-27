import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { DefaultVpc } from "@cdktf/provider-aws/lib/default-vpc";

import { EfsFileSystem } from "@cdktf/provider-aws/lib/efs-file-system";
import { EfsAccessPoint } from "@cdktf/provider-aws/lib/efs-access-point";

import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { EfsMountTarget } from "@cdktf/provider-aws/lib/efs-mount-target";

import {ResourceNames} from './ResourceNames'

// create instance 
// - create instance
// - create and mount efs
// - install Docker, git etc
//

export class BasicStack extends TerraformStack {

  instance: Instance;
  efs: EfsFileSystem;
  instanceSG: SecurityGroup;
  efsSG: SecurityGroup;
  jupyterTaskSG: SecurityGroup;
  defaultVpc: DefaultVpc;

  constructor(scope: Construct, id: string, resources: ResourceNames) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };

    // 👇 create Security Group for the Instance
    // allow http, http and ssh traffic from my ip (from home and work)
    // can go outwards to anywhere
    this.instanceSG = new SecurityGroup(this, 
      resources.INSTANCE_SG_NAME, 
      {
        name: resources.INSTANCE_SG_NAME,
        tags: tag,
        ingress: [
          {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["140.79.64.115/32", "130.144.0.0/12"]
            // cidrBlocks: ["0.0.0.0/0"]
          },{
            protocol: "tcp",
            fromPort: 8000,
            toPort: 8000,
            cidrBlocks: ["140.79.64.115/32", "130.144.0.0/12"]
            // cidrBlocks: ["0.0.0.0/0"]
          }, {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["140.79.64.115/32", "130.144.0.0/12"]
            // cidrBlocks: ["0.0.0.0/0"]
          }, {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["140.79.64.115/32", "130.144.0.0/12"]
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

    // 👇 create Security Group for the Instance
    // allow http, http and ssh traffic from my ip (from home and work)
    this.jupyterTaskSG = new SecurityGroup(this, 
      resources.JUPYTER_TASK_SG_NAME, 
      {
        name: resources.JUPYTER_TASK_SG_NAME,
        tags: tag
    });

    new SecurityGroupRule(this, 
      resources.JUPYTER_TASK_SG_NAME + '-rule',
        {
          type: 'ingress',
          protocol: '-1',
          fromPort: -1,
          toPort: -1,
          securityGroupId: this.jupyterTaskSG.id,
          sourceSecurityGroupId: this.jupyterTaskSG.id,
        }
    );

    this.defaultVpc = new DefaultVpc(this, 'bigcat-default-vpc', {
      tags: tag,
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    this.efsSG = new SecurityGroup(this, 
      resources.EFS_SG_NAME,
      {
        name: resources.EFS_SG_NAME,
        tags: tag,
        vpcId: this.defaultVpc.id,
        egress: [{
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"]
        }]
    });

    new SecurityGroupRule(this, resources.EFS_SG_NAME + '_rule',
      {
        type: 'ingress',
        protocol: 'tcp',
        fromPort: 2049,
        toPort: 2049,
        securityGroupId: this.efsSG.id,
        sourceSecurityGroupId: this.efsSG.id
      }
    );
    
    this.efs = new EfsFileSystem(this, resources.EFS_NAME, {
      tags: tag,
    });

    const accessPoint = new EfsAccessPoint(this, 
      resources.EFS_ACCESS_PONT_NAME, 
      {
        tags: tag,
        fileSystemId: this.efs.id,
        posixUser: {
          gid: 1000,
          uid: 1000
        },
        rootDirectory: {
          creationInfo: {
            ownerGid: 1000,
            ownerUid: 1000,
            permissions: '0755'
          },
          path: "/efs",
        },
    });

    //
    // ==============================================
    // Probably still need an instance to check on efs
    // ==============================================
    //
    const mount = `${this.efs.id} /efs efs _netdev,tls,accesspoint=${accessPoint.id} 0 0`
    const script = [
      '#!/bin/bash',
      'sudo yum install -y docker',
      'sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose',
      'sudo yum install -y amazon-efs-utils',
      'sudo yum install -y git',
      'sudo service docker start',
      'sudo usermod -a -G docker ec2-user',
      'sudo mkdir -p /efs',
      'sudo chown ec2-user /efs',
      `sudo echo ${mount} >> /etc/fstab`,
      "sudo /usr/sbin/shutdown -r 1"
    ];

    this.instance = new Instance(this, 
      resources.INSTANCE_NAME, 
      {
        ami: "ami-080392f82831e4f6e",
        instanceType: "t4g.small",
        keyName: 'bigcat',
        tags: tag,
        rootBlockDevice: {
          volumeSize: 16
        },
        vpcSecurityGroupIds: [this.instanceSG.id, this.efsSG.id, this.jupyterTaskSG.id],
        userData: script.join('\n')
    });

    new EfsMountTarget(this, resources.EFS_MOUNT_NAME, {
      fileSystemId: this.efs.id,
      securityGroups: [this.efsSG.id],
      subnetId: this.instance.subnetId,
    });
  }
}
