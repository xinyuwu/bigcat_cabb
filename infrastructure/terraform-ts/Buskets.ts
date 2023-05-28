import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketWebsiteConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-website-configuration";

export class BusketsStack extends TerraformStack {

  webContentBucket: S3Bucket;
  scheduleBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: any) {
    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: config['region']
    });

    const tag = {
      'Terraform': "true",
      "Environment": config['environment']
    };

    // create s3 bucket to host frontend static contents
    this.webContentBucket = new aws.s3Bucket.S3Bucket(
      this, 'bucket-frontend', 
      {
        bucket: 'bigcatcabb-frontend',
        forceDestroy: true,
        tags: tag
      }
    );

    new S3BucketPublicAccessBlock(this, 's3-access', {
      bucket: this.webContentBucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false
    });

    new S3BucketWebsiteConfiguration(this, `website-configuration`, {
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
    new S3BucketPolicy(this, `s3-policy`, {
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
      this, 'bucket-schedule',
      {
        bucket: 'bigcat-schedules',
        forceDestroy: true,
        tags: tag
      }
    );
  }
}
