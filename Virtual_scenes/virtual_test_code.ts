const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js")

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
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
        let handles = await this.sim.callScriptFunction("fetchJointHandles", this.scriptHandle);
        //console.log(handles);
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
        await this.sim.callScriptFunction("moveToConfig", this.scriptHandle, motorHandles,maxVel,maxAccel,maxJerk,this.jointAngle);
        await delay(2500);
    }
    async setGripperstate(state:boolean){
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        this.gripperState = state;
       
        await this.sim.callScriptFunction("setGripperstate", this.scriptHandle, this.gripperState);
        await delay(500);
    }
    async dobotMove(targetY:number):Promise<string> {
        this.dobotHandle = Number(await this.sim.getObject(this.name));

        let curPos = await this.sim.getObjectPosition(this.dobotHandle,await this.sim.handle_world);

        curPos = curPos[0];

        let distance = Math.abs(targetY - curPos[1]);

        if (targetY>=curPos[1]){
            distance = distance;
        }
        else{
            distance = -distance;
        }

        let curMove = 0;

        while(true){
            if (distance>=0){
                curPos[1] = curPos[1]+0.01;
                await this.sim.setObjectPosition(this.dobotHandle,await this.sim.handle_world, [curPos[0], curPos[1], curPos[2]])
                curMove = curMove + 0.01;
                //console.log(curMove);
                if (curMove>distance){
                    break
                }
                await delay(50);
            }
            else if (distance<0){
                curPos[1] = curPos[1] - 0.01;
                await this.sim.setObjectPosition(this.dobotHandle,await this.sim.handle_world, [curPos[0], curPos[1], curPos[2]])
                curMove = curMove + 0.01;
                //console.log(curMove);
                if (curMove>Math.abs(distance)){
                    break
                }
                await delay(50);      
            }
        }
        return "success";
        //return "success";
    }
    // moveTopos decrpeted
    async moveTopos(position:number[]):Promise<string>{
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        
        await this.sim.callScriptFunction("moveToPose_viaIKnew", this.scriptHandle, position);
        await delay(2000);   
        
        return "success";
    }
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
    async objectDetect():Promise<boolean>{
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        let sensorInfo = await(this.sim.handleProximitySensor(this.sensorHandle));
        //console.log(sensorInfo);
        if (sensorInfo[0] == 0){
            return false;
        }
        else if(sensorInfo[0] == 1){
            return true;
        }
        else{
            return false;
        }
    }
    async getObjectcolor():Promise<number[]>{
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        let sensorInfo = await(this.sim.handleProximitySensor(this.sensorHandle));   
        let detectObjecthandle = sensorInfo[3];
        console.log(detectObjecthandle);
        let colorInfo;
        if (detectObjecthandle != -1){
            colorInfo = await(this.sim.getObjectColor(detectObjecthandle,0,await this.sim.colorcomponent_ambient_diffuse))
            console.log(colorInfo);
            return colorInfo[0];
        }
        else{
            return [0,0,0];
        }
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

    return sim;
}

async function main() {
    /*
    let sceneAddress:String = "D:/master_thesis/project/robwot/Virtual_scenes/Virtual_robots.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim

    let simBase = Number(await sim.getObject("/Dobot"));
    console.log(simBase);
    let jointHandles = await (sim.getObjectsInTree(simBase,await (sim.object_joint_type),0));

    jointHandles = jointHandles[0];
    console.log(jointHandles);

    await sim.setJointTargetPosition(jointHandles[0], Math.PI*0.45);

    await sim.setJointTargetPosition(jointHandles[0], Math.PI*0.45);
    */
    let sceneAddress:String = "D:/master_thesis/project/robwot/virtual_devices_WoT/Virtual_IoT_lab.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim 
    
    let dobot = new virtualDobot(sim,"/Dobot");

    let conveyor2 = new virtualConveyor(sim, "/ConveyorBelt2");
    let conveyor1 = new virtualConveyor(sim, "/ConveyorBelt1");
    conveyor2.setConveyorSpeed(0);
    await delay(2000);
    conveyor1.setConveyorSpeed(0);

    let color = new virtualSensor(sim, "/Color_sensor");

    let tem = await color.getObjectcolor();

    console.log(tem);

    //await dobot.setJointangle([0,100,20,0]); // for return cube

    //let res = await dobot.dobotMove(0.3);  // initial pos 0.286   the right pos -0.415  
    //the left pos for fetch cube 0.56
    // the left pos for return cube 0.48


    //await dobot.dobotMove(-0.434);
    
    // from initial position to return cube
    /*
    await dobot.dobotMove(0.286);

    await dobot.setJointangle([0,64,105,0]);

    await dobot.setGripperstate(true);

    await dobot.setJointangle([0,15,15,0]);

    await dobot.dobotMove(-0.415);

    await dobot.setJointangle([0,80,15,0]);

    await dobot.setGripperstate(false);

    conveyor2.setConveyorSpeed(-0.05);

    await delay(10000);

    conveyor2.setConveyorSpeed(0);
    */

    // return cube
    /*
    await dobot.setJointangle([0,15,15,0]);

    await dobot.dobotMove(0.56);

    await dobot.setJointangle([0,110,10,0]);

    await dobot.setGripperstate(true);

    await dobot.setJointangle([0,15,15,0]);

    await dobot.dobotMove(0.5);

    await dobot.setJointangle([0,63,95,0]);

    await dobot.dobotMove(0.460);

    await dobot.setGripperstate(false);

    await dobot.setJointangle([0,15,15,0]);
    */
    // fetch cube
    /*
    await dobot.dobotMove(0.286);

    await dobot.setJointangle([0,64,95,0]);

    await dobot.setGripperstate(true);

    await dobot.setJointangle([0,15,15,0]);

    await dobot.dobotMove(-0.415);

    await dobot.setJointangle([0,80,15,0]);

    await dobot.setGripperstate(false);
    */
    /*

    await dobot.setJointangle([0,70,85,0]);

    await dobot.setGripperstate(false);

    await dobot.setJointangle([0,15,15,0]);
    */



    await delay(45000);
    
    console.log("simulation stop");
    await sim.stopSimulation();
}


main();


export {};