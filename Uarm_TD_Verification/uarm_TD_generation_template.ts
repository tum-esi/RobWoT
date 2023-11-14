// for reading local TD file
import * as fs from 'fs';

// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");

import {RobotDescriptionGenerator} from "../Library/Generate_Robot_Description/RobotDescriptionGenerator";

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


    // for dobot
    /*
    let robotName = "dobot";
    let rootFolder = __dirname + "/robot_info/dobot_folder"; //the path of folder to save necessary files

    let options = {
        "unit of distance": "meter",
        "description": "things description for dobot in current coppeliasim scene",
        "stlFilepath": "http://localhost:4000/uarm_robot/dobot_shape.stl",
        "csvFilepath": "http://localhost:4000/uarm_robot/dobot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/uarm_robot/Virtual_IoT_lab_verification.ttt",
        "href":"http://localhost:8090/",
        "port": 8090
    };

    await rdg.generateTD(robotName,rootFolder,options);
    */


    // uarm
    /*
    let robotName = "uarm";
    let rootFolder = __dirname + "/robot_info/uarm_folder"; //the path of folder to save necessary files

    let options = {
        "unit of distance": "millimeter",
        "description": "things description for uarm in current coppeliasim scene",
        "stlFilepath": "http://localhost:4000/uarm_robot/uarm_shape.stl",
        "csvFilepath": "http://localhost:4000/uarm_robot/uarm_data_point.csv",
        "sceneFilepath": "http://localhost:4000/uarm_robot/Virtual_IoT_lab_verification.ttt",
        "href":"http://localhost:8090/",
        "port": 8090
    }

    await rdg.generateTD(robotName, rootFolder, options); 
    */


    /*
    let sim = await init(sceneAddress);
    let name = "/uarm";
    let curHandle = Number(await sim.getObject(name));
    let scriptHandle = Number(await sim.getScript(1, curHandle, name));
    let robotInfo = await (sim.callScriptFunction("robotInfo", scriptHandle));
    robotInfo = robotInfo[0];
    console.log(robotInfo);
    robotInfo = JSON.stringify(robotInfo);
    await sim.stopSimulation();
    await delay(200);
    let jsonPath = "D:/master_thesis/project/robwot/Uarm_TD_Verification/robot_info/uarm_folder/uarm_info.json";
    fs.writeFileSync(jsonPath, robotInfo);
    */
    
    
}

main();