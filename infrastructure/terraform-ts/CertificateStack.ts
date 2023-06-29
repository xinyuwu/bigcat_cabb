import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { TerraformIterator } from 'cdktf';
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
export class CertificateStack extends TerraformStack {

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

    const simulatorIterator = TerraformIterator.fromList(simulatorCertificate.domainValidationOptions);
    
    const records = new Route53Record(
      this,
      resources.SIMULATOR_SUB_DOMAIN_NAME + '-route53-record',
      {
        forEach: simulatorIterator,
        name: simulatorIterator.value.resourceRecordName,
        type: simulatorIterator.value.resourceRecordType,
        records: [simulatorIterator.value.resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      }
    );
    
    new TerraformOutput(this, 'records', { value: records });
    new TerraformOutput(this, 'records-fqdn', { value: records.fqdn });

    new AcmCertificateValidation(
      this,
      resources.SIMULATOR_SUB_DOMAIN_NAME + '-certvalidation',
      {
        certificateArn: simulatorCertificate.arn,
        validationRecordFqdns: [records.fqdn],
      }
    );

    // set up scheduler sub-domain (for static content in s3 bucket)
    const schedulerCertificate = new AcmCertificate(this, resources.SCHEDULER_SUB_DOMAIN_NAME + '-ssl', {
      domainName: resources.SCHEDULER_SUB_DOMAIN_NAME,
      validationMethod: 'DNS',
      provider: usEastProvider,
      tags: tag
    });

    const schedulerIterator = TerraformIterator.fromList(schedulerCertificate.domainValidationOptions);

    const schedulerRecords = new Route53Record(
      this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '-route53-record',
      {
        forEach: schedulerIterator,
        name: schedulerIterator.value.resourceRecordName,
        type: schedulerIterator.value.resourceRecordType,
        records: [schedulerIterator.value.resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      }
    );

    new TerraformOutput(this, 'schedulerRecords', { value: schedulerRecords });
    new TerraformOutput(this, 'schedulerRecords-fqdn', { value: schedulerRecords.fqdn });

    new AcmCertificateValidation(
      this,
      resources.SCHEDULER_SUB_DOMAIN_NAME + '-certvalidation',
      {
        certificateArn: schedulerCertificate.arn,
        validationRecordFqdns: [schedulerRecords.fqdn],
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

    const apiIterator = TerraformIterator.fromList(apiCertificate.domainValidationOptions);

    const apiRecords = new Route53Record(
      this,
      resources.API_SUB_DOMAIN_NAME + '-route53-record',
      {
        forEach: apiIterator,
        name: apiIterator.value.resourceRecordName,
        type: apiIterator.value.resourceRecordType,
        records: [apiIterator.value.resourceRecordValue],
        zoneId: zone.zoneId,
        ttl: 60,
        allowOverwrite: true,
      }
    );

    new TerraformOutput(this, 'apiRecords', { value: apiRecords });
    new TerraformOutput(this, 'apiRecords-fqdn', { value: apiRecords.fqdn });

    new AcmCertificateValidation(
      this,
      resources.API_SUB_DOMAIN_NAME + '-certvalidation',
      {
        certificateArn: apiCertificate.arn,
        validationRecordFqdns: [apiRecords.fqdn],
        provider: usEastProvider,
      }
    );
  }
}
