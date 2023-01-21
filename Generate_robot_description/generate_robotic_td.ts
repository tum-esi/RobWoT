const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function getRobotinfo(sim:any, robotName:string) {

    const fileName = "../robot_driver.txt";
    let fileContent = fs.readFileSync(fileName, 'utf8');
    

    let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1

    let objectHandle = Number(await sim.getObject(robotName));

    await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script

    await sim.associateScriptWithObject(scriptHandle, objectHandle); // success 

    let robotScripthandle = Number(await sim.getScript(1, objectHandle,robotName));

    await sim.startSimulation();

    await delay(1000);

    let robotInfo = await sim.callScriptFunction("robotInfo", robotScripthandle);
    
    return robotInfo;
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

    //let robotName = "/UR4";
    let robotName = "/dobot";


    let robotInfo = (await getRobotinfo(sim,robotName))[0]; // need to convert to object

    console.log(robotInfo);

    let robotInstancename = "./generated_robot_td/robot_" + robotInfo["robotName"] + ".json";

    let robot_template = JSON.parse(fs.readFileSync("../robot_template.json", "utf8"));

    robot_template["title"] = "Virtual robot description - " + robotInfo["robotName"];

    const data = JSON.stringify(robot_template); // data convert

    fs.writeFileSync(robotInstancename, data);

    


    await delay(5000);



    // for the next simulation open, it must close simulation manually
    console.log("simulation stop");
    await sim.stopSimulation();
}


main();


export {};