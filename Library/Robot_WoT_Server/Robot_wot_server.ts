import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core'; 

// for reading local TD file
import * as fs from 'fs';

// load remote api for coppeliasim
const { RemoteAPIClient } = require("coppelia-ws-api");


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function init(address:String){
    console.log('Hello...');
    const client = new RemoteAPIClient('localhost', 23050,'json');
    console.log('Connecting...');
    await client.websocket.open();
    console.log('Getting proxy object "sim"...');
    let sim = await client.getObject('sim');

    // check the simulation state
    let simState =  Number(await sim.getSimulationState());

    // the simulation is running, stop the simulation and load the scene based on scene address
    if (simState == Number(await sim.simulation_advancing_running)){
        // if the simulation is running, stop the simulation first
        await sim.stopSimulation();
        await delay(500);
        await sim.loadScene(address);

    }
    else if(simState == Number(await sim.simulation_stopped)){
        // if the simulation is not running, the load the CoppeliaSim scene
        await sim.loadScene(address);
        await delay(500);
    }

    await delay(500);

    return sim;
}

async function loadRobotdriver(sim:any, robotName:string) {
    const fileName = "./robot_driver.lua";
    let fileContent = fs.readFileSync(fileName, 'utf8');
    
    let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1

    let objectHandle = Number(await sim.getObject(robotName));

    let checkScripthandle = await sim.getScript(1, objectHandle, robotName);
    if (checkScripthandle[0] != -1){
        console.log(checkScripthandle);
        await sim.removeScript(checkScripthandle[0]); // when the script exists
    }

    await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script

    await sim.associateScriptWithObject(scriptHandle, objectHandle); // success 

    let robotScripthandle = Number(await sim.getScript(1, objectHandle,robotName));
    
    return robotScripthandle
}

// robot WoT server 
// create Servient add HTTP binding with port configuration
let server = new Servient();
server.addServer(
    new HttpServer({
        port: 8081, // set port 8081 as request
    })
);

// read the robot TD file
let robotInstance = JSON.parse(fs.readFileSync("./robot_info/ur3_robot_instance.json", "utf8"));

// get joint length
var joints = Object.keys(robotInstance["properties"]["getJointposition"]["properties"]);
var jointAmout = joints.length;
//console.log(jointAmout);


server.start().then((WoT) => {
    WoT.produce(robotInstance).then(async(thing) => {
        console.log("Produced " + thing.getThingDescription().title);
        // init the coppeliasim
        let sceneAddress:String = __dirname + "/robot_digital_twins.ttt";
        var sim = await init(sceneAddress); // initialize scene and sim
        let scriptHandle = await loadRobotdriver(sim,"/ur3_robot"); // robot could be fetched from the td 

        console.log("loadScript" + scriptHandle);
        await sim.startSimulation();
        await delay(1000);

        // set property handlers (using async-await)
        // set getJointposition propety handlers
        thing.setPropertyReadHandler("getJointposition", async() => 
        (await sim.callScriptFunction("getJointposition", scriptHandle))[0]);

        // set getCartesianposition property handlers
        thing.setPropertyReadHandler("getCartesianposition", async() => 
        (await sim.callScriptFunction("getCartesianposition", scriptHandle))[0]);

        // set getRobotinfo	property handlers
        //thing.setPropertyReadHandler("getRobotinfo", async() => 
        //(await sim.callScriptFunction("robotInfo", scriptHandle))[0]);


        // set action handlers (using async-await)
        // remove this action
        /*
        // set moveToinitialPosition action handlers
        thing.setActionHandler("moveToinitialPosition", async() =>{
            try {
                await sim.callScriptFunction("moveToinitialPosition", scriptHandle);
                return "success";
            }
            catch{
                console.log("failed");
                return "failed";
            }
        });
        */

        // set moveTojointPosition action handlers
        thing.setActionHandler("moveTojointPosition", async(data) =>{
            try {
                let jointPos:any = await data.value();
                let jointPosval = new Array();
                for (let index = 1; index <= joints.length; index++) {
                    let curJointname = "joint" + String(index);
                    jointPosval[index-1] = jointPos[curJointname] * Math.PI / 180;
                }
                await sim.callScriptFunction("moveTojoint", scriptHandle, jointPosval);
                return "success";
            }
            catch{
                return "failed";
            }
        });

        // set moveTocartesianPosition action handlers
        thing.setActionHandler("moveTocartesianPosition", async(data) =>{
            try {
                let cartPos:any = await data.value();
                let cartPosval = [cartPos["x"], cartPos["y"], cartPos["z"],0,0.707,0,0.707];
                await sim.callScriptFunction("moveToPosition", scriptHandle, cartPosval);
                return "success";
            }
            catch{
                return "failed";
            }
        });


        // expose the thing
        thing.expose().then(() => {
            console.info(thing.getThingDescription().title + " ready");
            console.info("TD : " + JSON.stringify(thing.getThingDescription()));
        });
    });
});



