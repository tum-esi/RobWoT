// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");

// load virtual dobot class
import {virtualDobot} from "../virtual_devices_WoT/virtualDevices";

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// set virtual scene address
//console.log(__dirname); // get current file absolute path
let virtualSceneadress = __dirname + "./dobot_magician_with_gripper.ttt";



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
    let sim = await init(virtualSceneadress);

    let dobot = new virtualDobot(sim,"/dobot_normal");

    let pose1=[-0.25, -0.122, 0.045,0,0,1.0,0];

    let pose2=[-0.25, -0.122, 0.015,0,0,1.0,0];

    await dobot.setGripperstate(false);

    await dobot.moveTopos(pose1);

    await dobot.moveTopos(pose2);

    await dobot.setGripperstate(true);

    await dobot.moveTopos(pose1);

    //await delay(5000);

    //await sim.stopSimulation();

    //process.exit(1);
    
}

main();