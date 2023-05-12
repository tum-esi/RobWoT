// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path
const parseSTL = require("parse-stl");  // parse the stl file binary

// for reading local file
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


export class robotMotioncontrol{
    //variable
    sceneAddress:string;
    robotName:string;
    posReal:number[][];
    posVirtual:number[][];
    sim:any;


    constructor(sceneAddress:string,robotName:string,posReal?:number[][],posVirtual?:number[][]){
        this.sceneAddress = sceneAddress;
        this.robotName = "/" + robotName;
        this.sim = null;
        // init the posreal and posvirtual, for future parse
        if ((posReal != null) &&( posVirtual != null)){
            this.posReal = posReal;
            this.posVirtual = posVirtual;
        }
        else{
            this.posReal = [[1]];
            this.posVirtual = [[1]];
        }
    }
    posRefparse(posReal:number[][],posVirtual:number[][]){
        // check correctness of position
        if ((posReal.length >=2) &&(posVirtual.length >=2)){
            let k:number[] = [0,0,0];
            let b:number[] = [0,0,0];

            for (let i = 0; i < 3; i++) {
                if (posVirtual[0][i] == posVirtual[1][i]){
                    k[i] = 1;
                    b[i] = posReal[1][i] - posVirtual[1][i];
                }
                else{
                    k[i] = (posReal[0][i] - posReal[1][i]) / (posVirtual[0][i] - posVirtual[1][i]);
                    b[i] = posReal[1][i] - (posReal[0][i] - posReal[1][i]) / (posVirtual[0][i] - posVirtual[1][i]) * posVirtual[1][i];               
                }
            }

            return [k,b];
        }
        else{
            return [[1,1,1],[0,0,0]];
        }
    }
    // scene initialization in coppeliasim and load scene based on scene address
    async sceneInit():Promise<any>{
        const client = new RemoteAPIClient('localhost', 23050,'json');
        console.log("load scene to coppeliasim");
        await client.websocket.open();
        let sim = await client.getObject('sim');
        console.log('Getting proxy object "sim"...');

        // check the simulation state
        let simState =  Number(await sim.getSimulationState());

        // the simulation is running, stop the simulation and load the scene based on scene address
        if (simState == Number(await sim.simulation_advancing_running)){
            // if the simulation is running, stop the simulation first
            /*
            await sim.stopSimulation();
            await delay(500);
            await sim.loadScene(this.sceneAddress);
            // after load scene, begin to simulation
            await sim.startSimulation();
            await delay(500);
            */

        }
        else if(simState == Number(await sim.simulation_stopped)){
            // if the simulation is not running, the load the CoppeliaSim scene
            await sim.loadScene(this.sceneAddress);
            // after load scene, begin to simulation
            await sim.startSimulation();
            await delay(500);
        }
        this.sim = sim;

        return sim;
    }
    async getSim():Promise<any>{
        if (this.sim == null){
            const client = new RemoteAPIClient('localhost', 23050,'json');
            await client.websocket.open();
            let sim = await client.getObject('sim');
            //console.log('Getting proxy object "sim"...');
            this.sim = sim;      
            
            return sim;
        }
        else{
            return this.sim;
        }
    }
    // if necessary, you can load your own driver to the robot
    async loadDrivertoRobot(driverAddress:string):Promise<any>{
        const fileName = driverAddress;
        let fileContent = fs.readFileSync(fileName, 'utf8');

        let sim = await this.getSim();

        // because we need to load the driver script again, first we need to stop the simulation
        await sim.stopSimulation();
        await sim.loadScene(this.sceneAddress);
        
        await delay(200);

        let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1

        let objectHandle = Number(await sim.getObject(this.robotName));

        let checkScripthandle = await sim.getScript(1, objectHandle, this.robotName);

        if (checkScripthandle[0] != -1){
            //console.log("hello");
            await sim.removeScript(checkScripthandle[0]); // when the script exists, remove it and add new scripts
        }
        
        await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script

        await sim.associateScriptWithObject(scriptHandle, objectHandle); // success asociate driver script with robot  
        
        await sim.saveScene(this.sceneAddress); // after associate, autoamtically save scene

        //let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));
    }

    async getJointpos(compensateVal?:number[]):Promise<any>{
        // get sim, robothandle and script handle
        let sim = await this.getSim();
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        let curJointpos = await sim.callScriptFunction("getJointposition", robotScripthandle);
        curJointpos = curJointpos[0];

        if (compensateVal != null){
            let jointLen = Object.keys(curJointpos).length;
            for (let i = 1; i <= jointLen; i++) {
                let curJointname = "joint" + i.toString();
                curJointpos[curJointname] = curJointpos[curJointname] + compensateVal[i-1]; 
            }
        }

        return curJointpos;
    }
    async getCartpos():Promise<any>{
        // get sim, robothandle and script handle
        let sim = await this.getSim();
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));
        
        let curCartpos = await sim.callScriptFunction("getCartesianposition", robotScripthandle);
        curCartpos = curCartpos[0];

        let para = this.posRefparse(this.posReal,this.posVirtual);
        curCartpos = [curCartpos["x"]*para[0][0] + para[1][0], curCartpos["y"]*para[0][1] + para[1][1], curCartpos["z"]*para[0][2] + para[1][2]];

        return curCartpos;
    }
    async getRobotInfo():Promise<any>{
        // get sim, robothandle and script handle
        let sim = await this.getSim();
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));
        
        let robotInfo = await sim.callScriptFunction("robotInfo", robotScripthandle);
        robotInfo = robotInfo[0];       

        return robotInfo;
    }
    async moveTojointpos(jointPos:number[]):Promise<any>{
        // get sim, robothandle and script handle
        let sim = await this.getSim();
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        let previousJointpos = await sim.callScriptFunction("getJointposition", robotScripthandle);
        previousJointpos = previousJointpos[0];
        let jointLen = Object.keys(previousJointpos).length;
        let fianlpreviousJointpos = new Array();
        for (let i = 1; i <= jointLen; i++) {
            let curJointname = "joint" + i.toString();
            fianlpreviousJointpos.push(previousJointpos[curJointname]/180*Math.PI);
        }

        //console.log(fianlpreviousJointpos);


        await sim.callScriptFunction("moveTojoint", robotScripthandle,jointPos);

        let successState = false;
        while (true){
            let systemState = await sim.callScriptFunction("check", robotScripthandle);

            let collState = await sim.callScriptFunction("collisionCheck", robotScripthandle);
            if (collState[0]==true){
                // collision happened
                await sim.callScriptFunction("moveTojoint", robotScripthandle,fianlpreviousJointpos);
                while (true){
                    let systemState = await sim.callScriptFunction("check", robotScripthandle);
                    await delay(200);
                    // means return motion is successfully finished
                    if (systemState[0]==3){
                        break;
                    }
                }
                break;
            }
            if (systemState[0]==3){
                //console.log("motion finished");
                successState = true;
                break;
            }
            await delay(200);
        }  

        if (successState == true){
            return {"Point accessible":successState,"state": "This robot motion is success"};
            
        }else if(successState == false){
            return {"Point accessible":successState,"state": "Collision happens, the robot will go to previous position"};
        }     
        
    }
    async moveToCartpos(cartPos:number[]):Promise<any>{
        // get sim, robothandle and script handle
        let sim = await this.getSim();
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        let previousJointpos = await sim.callScriptFunction("getJointposition", robotScripthandle);
        previousJointpos = previousJointpos[0];
        //console.log(previousJointpos);

        let jointLen = Object.keys(previousJointpos).length;
        let fianlpreviousJointpos = new Array();
        for (let i = 1; i <= jointLen; i++) {
            let curJointname = "joint" + i.toString();
            fianlpreviousJointpos.push(previousJointpos[curJointname]/180*Math.PI);
        }

        //console.log(fianlpreviousJointpos);

        // need to convert the real pos to virtual pos
        let para = this.posRefparse(this.posVirtual, this.posReal);
        let finalCartpos:number[];
        if (cartPos.length == 7){
            finalCartpos = [cartPos[0]*para[0][0] + para[1][0], cartPos[1]*para[0][1] + para[1][1], cartPos[2]*para[0][2] + para[1][2], cartPos[3], cartPos[4], cartPos[5],cartPos[6]];
        }
        else{
            finalCartpos = [cartPos[0]*para[0][0] + para[1][0], cartPos[1]*para[0][1] + para[1][1], cartPos[2]*para[0][2] + para[1][2],0,0.707,0,0.707]
        }
        

        //console.log(finalCartpos);

        let motionState = await sim.callScriptFunction("moveToPosition", robotScripthandle,finalCartpos);
        
        let successState = false;

        while (true){
            let systemState = await sim.callScriptFunction("check", robotScripthandle);

            let collState = await sim.callScriptFunction("collisionCheck", robotScripthandle);
            if (collState[0]==true){
                // collision happened
                await sim.callScriptFunction("moveTojoint", robotScripthandle,fianlpreviousJointpos);
                while (true){
                    let systemState = await sim.callScriptFunction("check", robotScripthandle);
                    await delay(200);
                    // means return motion is successfully finished
                    if (systemState[0]==3){
                        break;
                    }
                }
                break;
            }
            if (systemState[0]==3){
                //console.log("motion finished");
                successState = true;
                break;
            }
            await delay(200);
        }

        if (successState == true){
            let curCartpos = await sim.callScriptFunction("getCartesianposition", robotScripthandle);
            curCartpos = curCartpos[0];
            curCartpos = [curCartpos["x"],curCartpos["y"],curCartpos["z"]];
            let count = 0;
            for (let i = 0; i < 3; i++) {
                let curVal = Math.abs(curCartpos[i] - finalCartpos[i])/Math.abs(finalCartpos[i]);
                if (curVal >= 0.25){
                    count = count + 1;
                }
            }
            // if x,y,z of two has great difference, means it is impossible to reach the target point
            if (count > 0){
                // collision happened
                await sim.callScriptFunction("moveTojoint", robotScripthandle,fianlpreviousJointpos);
                while (true){
                    let systemState = await sim.callScriptFunction("check", robotScripthandle);
                    await delay(200);
                    // means return motion is successfully finished
                    if (systemState[0]==3){
                        break;
                    }
                }
                return {"Point accessible":successState,"state": "There is a large deviation from the target point, and the robot automatically returns to the previous position"};              
            }else{
                return {"Point accessible":successState,"state": "This robot motion is success"};
            }
            
        }else if(successState == false){
            return {"Point accessible":successState,"state": "Collision happens, the robot will go to previous position"};
        }
    }



}



async function main() {
    let rootAddress = __dirname;
    let sceneAddress = rootAddress + "/UR10_TD_verification.ttt";

    let driverAddress = path.resolve(__dirname, '..') + "/Robot_WoT_server/robot_driver.txt";
    let posOutput = [[-0.68, -489.75, 1426.52],[687, -0.7, 741]];
    let posInput = [[-0.89988, -0.093933, 2.2941],[-0.21258, 0.38856, 1.6054]];


    let UR_robot = new robotMotioncontrol(sceneAddress,"UR10",posOutput,posInput);
    
    await UR_robot.loadDrivertoRobot(driverAddress);
    await UR_robot.sceneInit();

    let result0 = await UR_robot.moveTojointpos([0,-30*Math.PI/180,0,0,0,0]);
    console.log(result0);

    let result = await UR_robot.moveToCartpos([500,-890,1000,0,0.707,0,0.707]);
    console.log(result);

    let pos = await UR_robot.getCartpos();
    console.log(pos);

    // for some casee, it needs compensate to convert virtual joint pos to real robotic joint pos
    let jointPos = await UR_robot.getJointpos([0,-90,0,-90,0,0]);
    console.log(jointPos);



    
}


//main();