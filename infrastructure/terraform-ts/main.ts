import { App } from "cdktf";
import { BusketsStack } from "./Buskets";
import { EC2InstanceStack } from "./EC2Instance";
import { RoleStack } from "./Roles";

const config = {
  region: "ap-southeast-2",
  environment: "dev"
}

const app = new App();
new BusketsStack(app, `terraform-ts-bucket-${config['environment']}`, config);
new EC2InstanceStack(app, `terraform-ts-instance-${config['environment']}`, config);
new RoleStack(app, `terraform-ts-roles-${config['environment']}`, config);

app.synth();
