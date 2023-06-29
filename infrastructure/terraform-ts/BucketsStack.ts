import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";

import { ResourceNames } from './ResourceNames'

export class BucketsStack extends TerraformStack {

  webContentBucket: S3Bucket;
  scheduleBucket: S3Bucket;

  constructor(scope: Construct, id: string, resources: ResourceNames) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };

    // create s3 bucket to host frontend static contents
    this.webContentBucket = new aws.s3Bucket.S3Bucket(
      this, resources.SCHEDULER_FRONTEND_BUCKET_NAME, 
      {
        bucket: resources.SCHEDULER_FRONTEND_BUCKET_NAME,
        forceDestroy: true,
        tags: tag
      }
    );

    new S3BucketPublicAccessBlock(this, 
      resources.SCHEDULER_FRONTEND_BUCKET_NAME + '_s3-access', 
      {
        bucket: this.webContentBucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
    });

    new S3BucketWebsiteConfiguration(this, 
      resources.SCHEDULER_FRONTEND_BUCKET_NAME + '_website-configuration', 
      {
        bucket: this.webContentBucket.bucket,

        indexDocument: {
          suffix: "index.html",
        },

        errorDocument: {
          key: "index.html", // we could put a static error page here
        },
    });

    // allow read access to all elements within the S3Bucket
    // - i seem to have to run deploy twice for policy to be applied
    new S3BucketPolicy(this, 
      resources.SCHEDULER_FRONTEND_BUCKET_NAME + '_s3-policy', 
      {
        bucket: this.webContentBucket.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          // Id: `bigcat-public-website`,
          Statement: [
            {
              Sid: "PublicRead",
              Effect: "Allow",
              Principal: "*",
              Action: "s3:GetObject",
              Resource: "arn:aws:s3:::bigcatcabb-frontend/*"
            },
          ],
        }),
    });

    // create s3 bucket for deploying schedule files
    this.scheduleBucket = new aws.s3Bucket.S3Bucket(
      this, resources.SCHEDULES_BUCKET_NAME,
      {
        bucket: resources.SCHEDULES_BUCKET_NAME,
        forceDestroy: true,
        tags: tag
      }
    );
  }
}
