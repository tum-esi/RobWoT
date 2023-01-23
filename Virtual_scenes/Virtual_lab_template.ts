const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js")

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


class virtualConveyor{
    // variable
    name:String;
    sim:any;
    conveyorHandle:Number;
    // constructor
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.conveyorHandle = 0;
    }
    // get conveyorbelt info
    async getConveyorState(){
        this.conveyorHandle = Number(await this.sim.getObject(this.name));
        return await(this.sim.readCustomTableData(this.conveyorHandle,'__state__'));
    }
    //speed should be -1 to 1
    async setConveyorSpeed(speed:Number){
        this.conveyorHandle = Number(await this.sim.getObject(this.name));
        await this.sim.writeCustomTableData(this.conveyorHandle,'__ctrl__',{'vel': speed});
    }
}

class virtualSensor{
    // variable
    name:String;
    sim:any;
    sensorHandle:Number;
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.sensorHandle = 0;
    }
    async getSensorState(){
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        return await(this.sim.handleProximitySensor(this.sensorHandle));
    }
    // detect if it exists object
    async objectDetect(){
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        let sensorInfo = await(this.sim.handleProximitySensor(this.sensorHandle));
        //console.log(sensorInfo[0]);
        if (sensorInfo[0] == 0){
            return false;
        }
        else if(sensorInfo[0] == 1){
            return true;
        }
    }
}

class virtualUarm{
    // variable
    name:String;
    sim:any;
    uarmHandle:Number;
    scriptHandle:Number;
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.uarmHandle = 0;
        this.scriptHandle = 0
    }
    async computeAnglefromPosition(pos:Number[]){
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        //console.log(pos);

        let angles = await (this.sim.callScriptFunction("computeAnglesFromGripperPosition", this.scriptHandle,pos,0,0));

        //console.log(angles);
        return [angles[0][0], angles[0][1], angles[0][2],angles[0][3]];
    }
    async goTopositon(pos:Number[]){
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        let angles = await this.computeAnglefromPosition(pos);

        await this.sim.callScriptFunction("moveToPosition", this.scriptHandle,angles, true);

        await delay(6000);
    }
    // open or close gripper
    async setGripperstate(state:boolean){
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        await this.sim.callScriptFunction("enableGripper", this.scriptHandle,state);
        await delay(1500);
    }
}

class virtualDobot{
    // variable
    name:String;
    sim:any;
    dobotHandle:Number;
    scriptHandle:Number;
    jointAngle:Number[];
    gripperState:Boolean;
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.dobotHandle = 0;
        this.scriptHandle = 0;
        this.jointAngle = [0,0,0,0];
        this.gripperState = false;
    }
    async setJointangle(angle:Number[]){
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        // get motor handles
        let handles = await this.sim.callScriptFunction("fetchmotorHandles", this.scriptHandle);
        let len = handles[0].length;
        let motorHandles:any = [];
        for (let index = 0; index < len; index++) {
            motorHandles[index] = handles[0][index];
        }
        let vel=22;  
        let accel=40;
        let jerk=80;
        let maxVel=[vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180];
        let maxAccel=[accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180];
        let maxJerk=[jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180];


        this.jointAngle = angle;
        // move to config
        await this.sim.callScriptFunction("moveToConfig", this.scriptHandle, motorHandles,maxVel,maxAccel,maxJerk,this.jointAngle,this.gripperState);
        await delay(5000);
    }
    async setGripperstate(state:boolean){
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        // get motor handles
        let handles = await this.sim.callScriptFunction("fetchmotorHandles", this.scriptHandle);
        let len = handles[0].length;
        let motorHandles:any = [];
        for (let index = 0; index < len; index++) {
            motorHandles[index] = handles[0][index];
        }
        let vel=22;  
        let accel=40;
        let jerk=80;
        let maxVel=[vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180];
        let maxAccel=[accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180];
        let maxJerk=[jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180];
        
        this.gripperState = state;
        // move to config
        await this.sim.callScriptFunction("moveToConfig", this.scriptHandle, motorHandles,maxVel,maxAccel,maxJerk,this.jointAngle,this.gripperState);
        await delay(2000);
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

    console.log("start simulation");
    await sim.startSimulation();

    return sim;
}


async function main() {
    let sceneAddress:String = "D:/master_thesis/project/robwot/Virtual_scenes/Virtual_lab.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim

    // generate conveyorbelt instance based on scene
    let conveyorbelt1 = new virtualConveyor(sim,"/ConveyorBelt1");
    let conveyorbelt2 = new virtualConveyor(sim,"/ConveyorBelt2");

    // set conveyorbelt speed
    await conveyorbelt1.setConveyorSpeed(0.05);
    await conveyorbelt2.setConveyorSpeed(-0.01);

    //get conveyorbelt info
    let tem1 = await conveyorbelt1.getConveyorState();
    console.log(tem1);

    //generate sensor instance based on scene
    let sensor1 = new virtualSensor(sim,"/InfraredSensor1");
    let sensor2 = new virtualSensor(sim,"/InfraredSensor2");
    let sensor3 = new virtualSensor(sim,"/Color_sensor");

    // get sensor info
    let sensorInfo1 = await sensor1.getSensorState();
    let sensorInfo3 = await sensor3.getSensorState();

    console.log(sensorInfo1);
    console.log(sensorInfo3);

    console.log(await (sensor2.objectDetect()));

    await conveyorbelt2.setConveyorSpeed(-0.00);
    await conveyorbelt1.setConveyorSpeed(0.00);

    // generate uarm instance based on scene
    let uarm = new virtualUarm(sim,"/uarm");

    // generate dobot instance based on scene
    let dobot1 = new virtualDobot(sim,"/Dobot1");

    await dobot1.setJointangle([-90,0,0,0]);
    await dobot1.setJointangle([-90,85,20,0]);

    await dobot1.setGripperstate(true);

    await dobot1.setJointangle([-90,30,0,0]);

    await dobot1.setJointangle([0,30,0,0]);

    await dobot1.setGripperstate(false);

    await conveyorbelt2.setConveyorSpeed(-0.08);

    while(true){
        await delay(1000);
        await conveyorbelt2.setConveyorSpeed(-0.08);
        if ((await sensor2.objectDetect()) == true){
            break;
        } 
    }

    await conveyorbelt2.setConveyorSpeed(-0.00);


    // get cube information
    // transform cube from conveyor2 to conveyor1 
    let cube = Number(await sim.getObject('/Cube3'));
    let pos = await sim.getObjectPosition(cube, Number(await sim.handle_world));
    let p = [pos[0][0],pos[0][1],pos[0][2]];
    console.log(p);

    //let jointAngles = await uarm.computeAnglefromPosition(p);
    //console.log(jointAngles);

    await uarm.setGripperstate(false);

    await delay(2000);

    await uarm.goTopositon([pos[0][0],pos[0][1],pos[0][2]+0.04]);

    await uarm.goTopositon(p);

    await uarm.setGripperstate(true);

    await delay(2000);

    await uarm.goTopositon([pos[0][0],pos[0][1],pos[0][2]+0.04]);

    await uarm.goTopositon([-0.5,-0.05,0.152]);

    console.log(await sensor3.objectDetect());
    await conveyorbelt1.setConveyorSpeed(0.00);

    await uarm.goTopositon([-0.4,0.25,0.15]);

    await uarm.setGripperstate(false);

    await uarm.goTopositon([-0.352,-0.05,0.1743]);

    await conveyorbelt1.setConveyorSpeed(0.08);


    while(true){
        await delay(1000);
        await conveyorbelt1.setConveyorSpeed(0.08);
        if ((await sensor1.objectDetect()) == true){
            break;
        } 
    }

    await conveyorbelt1.setConveyorSpeed(0);
    
    await delay(5000);

    // for the next simulation open, it must close simulation manually
    console.log("simulation stop");
    await sim.stopSimulation();
}

main();




export {};

