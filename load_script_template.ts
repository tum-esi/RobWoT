const {RemoteAPIClient} = require("./RemoteAPIClient.js")

import * as fs from 'fs';

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

    // load the CoppeliaSim scene
    await sim.loadScene(address);

    await delay(1000);

    return sim;
}


async function main() {
    let sceneAddress:String = "D:/master_thesis/project/robwot/common_script_load_common_robot.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim

    const fileName = "robot_driver.txt";
    let fileContent = fs.readFileSync(fileName, 'utf8');
    //console.log(fileContent);



    let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1

    console.log(scriptHandle);

    let objectHandle = Number(await sim.getObject("/UR4"));

    console.log(objectHandle);

    await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script

    await sim.associateScriptWithObject(scriptHandle, objectHandle); // success 

    let scriptHandle_object = Number(await sim.getScript(1, objectHandle,"/UR4"));

    console.log(scriptHandle_object);

    await sim.startSimulation();

    await delay(1000);

    console.log("invoke functions in script");

    let robotInfo = await sim.callScriptFunction("robotInfo", scriptHandle_object);

    console.log(robotInfo);

    await sim.callScriptFunction("moveToPosition", scriptHandle_object,[0.2,-0.1,0.4]);
    await delay(5000);

    await sim.callScriptFunction("moveToinitialPosition", scriptHandle_object);
    await delay(5000);


    let jointAngle = await sim.callScriptFunction("getJointposition",scriptHandle_object);
    console.log(jointAngle);
    //await sim.callScriptFunction("moveTem", scriptHandle_object);

    //await delay(10000);

    /*
    
    await sim.callScriptFunction("moveTemplate1", scriptHandle_object);
    await delay(5000);

    await sim.callScriptFunction("moveTemplate2", scriptHandle_object);
    await delay(5000);

    await sim.callScriptFunction("moveTemplate3", scriptHandle_object);
    await delay(5000);
    */
    
    await delay(14000);

    console.log("simulation stop");
    await sim.stopSimulation();

    await delay(2000);

    console.log("remove script");
    await sim.removeScript(scriptHandle_object);
}


main();


export {};