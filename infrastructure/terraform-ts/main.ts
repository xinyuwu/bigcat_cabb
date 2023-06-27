import { App } from "cdktf";
import { BucketsStack } from "./Buckets";
import { BasicStack } from "./BasicStack";
import { RoleStack } from "./Roles";
// import { JupyterEcrStack } from "./JupyterEcrStack";
import { JupyterEcsStack } from "./JupyterEcsStack";
import { ResourceNames } from "./ResourceNames";
import { JupyterServiceStack } from "./JupyterServiceStack";


const config = {
  region: "ap-southeast-2",
  environment: "dev"
}

const resourceNames = new ResourceNames(config);

const app = new App();
new BucketsStack(app, `terraform-ts-bucket-${config['environment']}`, resourceNames);
new BasicStack(app, `terraform-ts-instance-${config['environment']}`, resourceNames);
new RoleStack(app, `terraform-ts-roles-${config['environment']}`, resourceNames);
// new JupyterEcrStack(app, `terraform-ts-ecr-${config['environment']}`, resourceNames);
new JupyterEcsStack(app, `terraform-ts-ecs-${config['environment']}`, resourceNames);
new JupyterServiceStack(app, `terraform-ts-service-${config['environment']}`, resourceNames);

app.synth();

// To run:
// export AWS_PROFILE=306604607287_IAMPowerUserAccess
// cdktf destroy *-dev
// cdktf deploy *-dev
