import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

import { AcmCertificate } from "@cdktf/provider-aws/lib/acm-certificate";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { DataAwsRoute53Zone } from "@cdktf/provider-aws/lib/data-aws-route53-zone";
import { AcmCertificateValidation } from "@cdktf/provider-aws/lib/acm-certificate-validation";

import { ResourceNames } from './ResourceNames'

//
// cloudfront ssl certificate must be created in region:
// US East (N. Virginia) us-east-1
//
// ecs certificates must be created in region:
// Asia Pacific (Sydney) ap-southeast-2
// 
export class TestStack extends TerraformStack {

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

    // zone was created automatically when domain was purchased
    const zone = new DataAwsRoute53Zone(this, resources.DOMAIN_NAME + '-zone', {
      name: resources.DOMAIN_NAME,
      privateZone: false
    });

    // set up simulator sub-domain
    const simulatorCertificate = new AcmCertificate(this, resources.SIMULATOR_SUB_DOMAIN_NAME + '-ssl', {
      domainName: resources.SIMULATOR_SUB_DOMAIN_NAME,
      validationMethod: 'DNS',
      tags: tag
    });

    const record = new Route53Record(
      this,
      resources.SIMULATOR_SUB_DOMAIN_NAME + '-route53-record',
      {
        name: simulatorCertificate.domainValidationOptions.get(0).resourceRecordName,
        type: simulatorCertificate.domainValidationOptions.get(0).resourceRecordType,
        records: [simulatorCertificate.domainValidationOptions.get(0).resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      }
    );

    new AcmCertificateValidation(
      this,
      resources.SIMULATOR_SUB_DOMAIN_NAME + '-certvalidation',
      {
        certificateArn: simulatorCertificate.arn,
        validationRecordFqdns: [record.fqdn],
      }
    );

    // set up scheduler sub-domain (for static content in s3 bucket)
    const schedulerCertificate = new AcmCertificate(this, resources.SCHEDULER_SUB_DOMAIN_NAME + '-ssl', {
      domainName: resources.SCHEDULER_SUB_DOMAIN_NAME,
      validationMethod: 'DNS',
      provider: usEastProvider,
      tags: tag
    });

    const schedulerRecord = new Route53Record(
      this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '-route53-record',
      {
        name: schedulerCertificate.domainValidationOptions.get(0).resourceRecordName,
        type: schedulerCertificate.domainValidationOptions.get(0).resourceRecordType,
        records: [schedulerCertificate.domainValidationOptions.get(0).resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      }
    );

    new AcmCertificateValidation(
      this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '-certvalidation',
      {
        certificateArn: schedulerCertificate.arn,
        validationRecordFqdns: [schedulerRecord.fqdn],
        provider: usEastProvider,
      }
    );

    // set up scheduler api-domain (for lambda api gateway)
    const apiCertificate = new AcmCertificate(this, resources.API_SUB_DOMAIN_NAME + '-ssl', {
      domainName: resources.API_SUB_DOMAIN_NAME,
      validationMethod: 'DNS',
      provider: usEastProvider,
      tags: tag
    });

    const apiRecord = new Route53Record(
      this,
      resources.API_SUB_DOMAIN_NAME + '-route53-record',
      {
        name: apiCertificate.domainValidationOptions.get(0).resourceRecordName,
        type: apiCertificate.domainValidationOptions.get(0).resourceRecordType,
        records: [apiCertificate.domainValidationOptions.get(0).resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      }
    );

    new AcmCertificateValidation(
      this,
      resources.API_SUB_DOMAIN_NAME + '-certvalidation',
      {
        certificateArn: apiCertificate.arn,
        validationRecordFqdns: [apiRecord.fqdn],
        provider: usEastProvider,
      }
    );
  }
}
