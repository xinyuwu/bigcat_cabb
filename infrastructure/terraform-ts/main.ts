import { App } from "cdktf";
import { ResourceNames } from "./ResourceNames";
// import { JupyterEcrStack } from "./JupyterEcrStack";
import { BucketsStack } from "./BucketsStack";
import { BasicStack } from "./BasicStack";
import { RoleStack } from "./Roles";
import { JupyterEcsStack } from "./JupyterEcsStack";
import { JupyterServiceStack } from "./JupyterServiceStack";
import { PrintLamdaStack } from "./PrintLamdaStack";
import { SchedulerStack } from "./SchedulerStack";


const config = {
  region: "ap-southeast-2",
  environment: "dev"
}

const resourceNames = new ResourceNames(config);

const app = new App();
new BucketsStack(app, `terraform-ts-bucket-${config['environment']}`, resourceNames);
new BasicStack(app, `terraform-ts-instance-${config['environment']}`, resourceNames);
new RoleStack(app, `terraform-ts-roles-${config['environment']}`, resourceNames);

// // this stack has to be deployed separatedly first
// // new JupyterEcrStack(app, `terraform-ts-ecr-${config['environment']}`, resourceNames);
new JupyterEcsStack(app, `terraform-ts-ecs-${config['environment']}`, resourceNames);
new JupyterServiceStack(app, `terraform-ts-service-${config['environment']}`, resourceNames);

new PrintLamdaStack(app, `terraform-ts-print-lambda-${config['environment']}`, resourceNames);

new SchedulerStack(app, `terraform-ts-scheduler-${config['environment']}`, resourceNames);
// new TestStack(app, `terraform-ts-test-${config['environment']}`, resourceNames);

app.synth();

// To run:
// export AWS_PROFILE=306604607287_IAMPowerUserAccess
// cdktf destroy *-dev
// cdktf deploy *-dev
