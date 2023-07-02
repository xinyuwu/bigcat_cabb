import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { CloudfrontDistribution } from "@cdktf/provider-aws/lib/cloudfront-distribution";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { ApiGatewayDomainName } from "@cdktf/provider-aws/lib/api-gateway-domain-name";
import { ApiGatewayBasePathMapping } from "@cdktf/provider-aws/lib/api-gateway-base-path-mapping";

import { DataAwsAcmCertificate } from "@cdktf/provider-aws/lib/data-aws-acm-certificate";
import { DataAwsS3Bucket } from "@cdktf/provider-aws/lib/data-aws-s3-bucket";
import { DataAwsRoute53Zone } from "@cdktf/provider-aws/lib/data-aws-route53-zone";
import { DataAwsApiGatewayRestApi } from "@cdktf/provider-aws/lib/data-aws-api-gateway-rest-api";


import { ResourceNames } from './ResourceNames'

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

    const schedulerCertificate = new DataAwsAcmCertificate(this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '_ssl-data',
      {
        domain: resources.SCHEDULER_SUB_DOMAIN_NAME,
        statuses: ["ISSUED"],
        provider: usEastProvider
      });

    const apiCertificate = new DataAwsAcmCertificate(this,
      resources.API_SUB_DOMAIN_NAME + '_ssl-data',
      {
        domain: resources.API_SUB_DOMAIN_NAME,
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
          acmCertificateArn: schedulerCertificate.arn,
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


    // add lambda to domain name and route 53
    const apiGatewayDomain = new ApiGatewayDomainName(this, 
      resources.API_SUB_DOMAIN_NAME + '_gateway-domain', 
      {
        tags: tag,
        domainName: resources.API_SUB_DOMAIN_NAME,
        certificateArn: apiCertificate.arn
    });

    const apiLambdaApp = new DataAwsApiGatewayRestApi(this,
      resources.API_LAMBDA_APP_NAME + '_data',
      { name: resources.API_LAMBDA_APP_NAME });
    
    new ApiGatewayBasePathMapping(this, resources.API_SUB_DOMAIN_NAME + '_gateway-mapping', {
      domainName: apiGatewayDomain.domainName,
      stageName: resources.config['environment'],
      apiId: apiLambdaApp.id,
    });

    new Route53Record(
      this,
      resources.API_SUB_DOMAIN_NAME + '-route53-record',
      {
        name: resources.API_SUB_DOMAIN_NAME,
        type: 'A',
        alias: {
          name: apiGatewayDomain.cloudfrontDomainName,
          evaluateTargetHealth: true,
          zoneId: apiGatewayDomain.cloudfrontZoneId
        },
        zoneId: zone.zoneId,
        allowOverwrite: true,
      }
    );

  }
}
