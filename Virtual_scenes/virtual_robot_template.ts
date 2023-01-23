const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js")

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// prepare the robot template class
class virtualRobot{
    // variable
    name:String;
    sim:any;
    robotHandle:Number;
    scriptHandle:Number;
    jointAngle:Number[];
    gripperState:Boolean;
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.robotHandle = 0;
        this.scriptHandle = 0;
        this.jointAngle = [0,0,0,0,0,0];
        this.gripperState = false;
    }
    async setJointangle(angle:Number[]){
        this.robotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.robotHandle,this.name));
        // get motor handles
        let handles = await this.sim.callScriptFunction("fetchJointHandles", this.scriptHandle);
        let len = handles[0].length;
        let jointHandles:any = [];
        for (let index = 0; index < len; index++) {
            jointHandles[index] = handles[0][index];
        }
        //console.log(jointHandles);
        //await delay(10000);
        let vel=70;  
        let accel=40;
        let jerk=80;
        let maxVel = [vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180];
        let maxAccel = [accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180];
        let maxJerk = [jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180];
    
        this.jointAngle = angle;
        // move to config
        await this.sim.callScriptFunction("moveToConfig", this.scriptHandle, jointHandles,maxVel,maxAccel,maxJerk,this.jointAngle);
        await delay(5000);
    }
    async setGripperstate(state:boolean){
        this.gripperState = state;
        console.log(state);
    }
    async moveToposition(position:Number[]){
        this.robotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.robotHandle,this.name));

        let maxIkVel = [0.45,0.45,0.45,4.5];
        let maxIkAccel = [0.13,0.13,0.13,1.24];
        let maxIkJerk=[0.1,0.1,0.1,0.2];

        await this.sim.callScriptFunction("moveToPose_viaIKnew", this.scriptHandle,maxIkVel,maxIkAccel,maxIkJerk,position);
        //await this.sim.callScriptFunction("move", this.scriptHandle);
        await delay(5000);
    }
    async getJointangle(){
        this.robotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.robotHandle,this.name));
        // get motor handles
        let handles = await this.sim.callScriptFunction("fetchJointHandles", this.scriptHandle);
        let len = handles[0].length;
        let jointHandles:any = [];
        for (let index = 0; index < len; index++) {
            jointHandles[index] = handles[0][index];
        }

        let curAngle = new Array(len);

        for (let index = 0; index < len; index++) {
            curAngle[index] = Number(await this.sim.getJointPosition(jointHandles[index]));
        }

        return curAngle;
    }
    async generateWorkspace(){
        this.robotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.robotHandle,this.name));
        
        await this.sim.callScriptFunction("generateWorkingspace", this.scriptHandle, 1);
    }
}

async function init(address:String){
    console.log('Hello...');
    const client = new RemoteAPIClient('localhost', 23050,'json');
    console.log('Connecting...');
    await client.websocket.open();
    console.log('Getting proxy object "sim"...');
    let sim = await client.getObject('sim');

    // load the CoppeliaSim scene
    await sim.loadScene(address);

    await delay(1000);

    
    await sim.startSimulation();

    await delay(1000);

    return sim;
}


async function main() {
    let sceneAddress:String = "D:/master_thesis/project/robwot/Virtual_scenes/Virtual_robots.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim

    let frankaRobot = new virtualRobot(sim,"/Franka");

    let targetPos1 = [90*Math.PI/180,90*Math.PI/180,135*Math.PI/180,-45*Math.PI/180,90*Math.PI/180,180*Math.PI/180,0];
    //await frankaRobot.setJointangle(targetPos1);

    let curAngle = await frankaRobot.getJointangle();
    console.log(curAngle);

    let URrobot = new virtualRobot(sim,"/UR5");

    //await URrobot.generateWorkspace();

    await URrobot.moveToposition([-1.648589849472, -0.30799999833107, 0.57914972305298, 0.0, 0.0, 0.0, 1.0]);

    await frankaRobot.moveToposition([0.6764,-0.058,0.1791, 0,0,0,1]);
    //await frankaRobot.setJointangle([0,0,0,-1.5711177587509,0,1.5705842971802,0]);

    await frankaRobot.moveToposition([1.0764130353928, -0.032995343208313, 0.35414671897888, 0.0, 0.0, 0.0, 1.0]);
    //await frankaRobot.setJointangle([0,0,0,-1.5711177587509,0,1.5705842971802,0]);

    await frankaRobot.moveToposition([0.5514, -0.458, 0.0541,  0,0,0,1]);
    //await frankaRobot.setJointangle([0,0,0,-1.5711177587509,0,1.5705842971802,0]);

    await frankaRobot.moveToposition([0.3264, 0.3170, 0.2041, 0.0, 0.0, 0.0, 1.0]);
    //await frankaRobot.setJointangle([0,0,0,-1.5711177587509,0,1.5705842971802,0]);
    

    
    await delay(50000);

    // for the next simulation open, it must close simulation manually
    console.log("simulation stop");
    await sim.stopSimulation();
}


main();


export {};