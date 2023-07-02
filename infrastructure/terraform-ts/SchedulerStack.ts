import { Construct } from "constructs";
import { TerraformStack } from "cdktf";

import { DataAwsS3Bucket } from "@cdktf/provider-aws/lib/data-aws-s3-bucket";
import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { DataAwsAcmCertificate } from "@cdktf/provider-aws/lib/data-aws-acm-certificate";

import * as aws from "@cdktf/provider-aws";

import { ResourceNames } from './ResourceNames'
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { DataAwsRoute53Zone } from "@cdktf/provider-aws/lib/data-aws-route53-zone";

export class SchedulerStack extends TerraformStack {

  constructor(scope: Construct, id: string, resources: ResourceNames) {

    super(scope, id);

    new aws.provider.AwsProvider(this, "aws", {
      region: resources.config['region']
    });

    const usEastProvider = new aws.provider.AwsProvider(this, "aws.route53", {
      region: "us-east-1",
      alias: "us-east-provider",
    });

    const tag = {
      'Terraform': "true",
      "Environment": resources.config['environment']
    };

    const bucket = new DataAwsS3Bucket(this, 
      resources.SCHEDULER_FRONTEND_BUCKET_NAME + '_data', 
      {
        bucket: resources.SCHEDULER_FRONTEND_BUCKET_NAME
    });

    const sslCertificate = new DataAwsAcmCertificate(this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '_ssl-data',
      {
        domain: resources.SCHEDULER_SUB_DOMAIN_NAME,
        statuses: ["ISSUED"],
        provider: usEastProvider
      });

    const originId = resources.SCHEDULER_FRONTEND_BUCKET_NAME;

    
    const cloudFrontDistribution = new CloudfrontDistribution(
      this,
      resources.SCHEDULER_FRONTEND_BUCKET_NAME + "_cloudfront",
      {
        tags: tag,
        aliases: [
          "scheduler-dev.bigcat-test.org"
        ],
        origin: [{
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originKeepaliveTimeout: 5,
            originProtocolPolicy: "http-only",
            originReadTimeout: 30,
            originSslProtocols: ["TLSv1.2"]
          },
          domainName: bucket.websiteEndpoint,
          originId: originId,
          originPath: ""
        }],
        defaultCacheBehavior: {
          allowedMethods: [
            "HEAD",
            "DELETE",
            "POST",
            "GET",
            "OPTIONS",
            "PUT",
            "PATCH"
          ],
          cachedMethods: ["GET", "HEAD"],
          compress: true,
          smoothStreaming: false,
          targetOriginId: originId,
          viewerProtocolPolicy: "redirect-to-https",
          forwardedValues: {
            cookies: {
              forward: "all",
            },
            queryString: true,
          },
        },
        comment: "",
        priceClass: "PriceClass_All",
        enabled: true,
        viewerCertificate: {
          acmCertificateArn: sslCertificate.arn,
          cloudfrontDefaultCertificate: false,
          minimumProtocolVersion: "TLSv1.2_2021",
          sslSupportMethod: "sni-only"
        },
        restrictions: {
          geoRestriction: {
            restrictionType: "none"
          }
        },
        httpVersion: "http2",
        isIpv6Enabled: true
      }
    );

    const zone = new DataAwsRoute53Zone(this, resources.DOMAIN_NAME + '-zone', {
      name: resources.DOMAIN_NAME,
      privateZone: false
    });

    // add entry to route 53
    new Route53Record(
      this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '-route53-record',
      {
        name: resources.SCHEDULER_SUB_DOMAIN_NAME,
        type: 'A',
        alias: {
          name: cloudFrontDistribution.domainName,
          evaluateTargetHealth: true,
          zoneId: cloudFrontDistribution.hostedZoneId
        },
        zoneId: zone.zoneId,
        allowOverwrite: true,
      }
    );
  }
}
