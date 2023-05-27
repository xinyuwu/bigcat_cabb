import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";

import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";


import { TerraformOutput } from 'cdktf';

export class BusketsStack extends TerraformStack {

  webContentBucket: S3Bucket;
  scheduleBucket: S3Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: "ap-southeast-2",
    });

    // create s3 bucket to host frontend static contents
    this.webContentBucket = new aws.s3Bucket.S3Bucket(
      this, 'bucket', 
      {
        bucket: 'bigcatcabb-frontend',
        forceDestroy: true,
        tags: {
          'Terraform': "true",
          "Environment": "dev"
        },
      }
    );

    new S3BucketWebsiteConfiguration(this, `website-configuration`, {
      bucket: this.webContentBucket.bucket,

      indexDocument: {
        suffix: "index.html",
      },

      errorDocument: {
        key: "index.html", // we could put a static error page here
      },
    });

    new S3BucketPublicAccessBlock(this, 's3-access', {
      bucket: this.webContentBucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false
    });

    // allow read access to all elements within the S3Bucket
    new S3BucketPolicy(this, `s3-policy`, {
      bucket: this.webContentBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Id: `bigcat-public-website`,
        Statement: [
          {
            Sid: "PublicRead",
            Effect: "Allow",
            Principal: "*",
            Action: ["s3:GetObject"],
            Resource: [`${this.webContentBucket.arn}/*`],
          },
        ],
      }),
    });

    new TerraformOutput(this, 'bigcat_website', {
      value: `http://${this.webContentBucket.website}`
    });
    
    // create s3 bucket for deploying schedule files
    this.scheduleBucket = new aws.s3Bucket.S3Bucket(
      this, 'bucket',
      {
        bucket: 'bigcat-schedules',
        forceDestroy: true,
        tags: {
          'Terraform': "true",
          "Environment": "dev"
        },
      }
    );

    // create a role for lambda functions 

    // create a role to sync with schedule bucket
    const lambdaRolePolicy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "VisualEditor0",
          "Effect": "Allow",
          "Action": "s3:*",
          "Resource": "arn:aws:s3:::atcaschedules",
          "Condition": {
            "StringEquals": {
              "aws:SourceVpc": "vpc-02e7d36f4a2bc2a5d"
            }
          }
        },
        {
          "Sid": "VisualEditor2",
          "Effect": "Allow",
          "Action": "s3:*",
          "Resource": "arn:aws:s3:::atcaschedules",
          "Condition": {
            "ForAnyValue:IpAddress": {
              "aws:SourceIp": [
                "130.155.199.8/32",
                "140.79.64.115/32"
              ]
            }
          }
        }
      ]
    };


    const bucketSyncPolicy = new IamRolePolicy(this, '', {

    });
    const scheduleSyncRole = new IamRole(this, 'lambda-exec', {
      name: `bigcat-schedule-sync-role`,
      tags: {
        'Terraform': "true",
        "Environment": "dev"
      },
      assumeRolePolicy: JSON.stringify(lambdaRolePolicy),
    })

  }
}
