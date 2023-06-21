import { App } from "cdktf";
import { BucketsStack } from "./Buckets";
import { EC2InstanceStack } from "./EC2Instance";
import { RoleStack } from "./Roles";

const config = {
  region: "ap-southeast-2",
  environment: "dev"
}

const app = new App();
new BucketsStack(app, `terraform-ts-bucket-${config['environment']}`, config);
new EC2InstanceStack(app, `terraform-ts-instance-${config['environment']}`, config);
new RoleStack(app, `terraform-ts-roles-${config['environment']}`, config);

app.synth();

// To run:
// export AWS_PROFILE =306604607287_IAMPowerUserAccess
// cdktf destroy * -dev
// cdktf deploy * -dev
