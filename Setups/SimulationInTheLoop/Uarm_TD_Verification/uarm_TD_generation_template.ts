// load remote api for coppeliasim
const { RemoteAPIClient } = require("coppelia-ws-api");

import {RobotDescriptionGenerator} from "../../../Library/GenerateRobotDescription/RobotDescriptionGenerator";

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

    await sim.startSimulation();

    await delay(1000);

    return sim;
}



async function main() {
    let virtualSceneadress = __dirname + "/Virtual_IoT_lab_verification.ttt";
    let sceneAddress:string = virtualSceneadress; 

    let rdg = new RobotDescriptionGenerator(sceneAddress);
}

main();