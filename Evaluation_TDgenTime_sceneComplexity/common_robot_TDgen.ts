//const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

// for class robot description generation
import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";


async function robotTDGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository

    // modify scene name here
    let dtSceneAddress = rootAddress + "/Evaluation_TDgenTime_sceneComplexity/103_common_scene.ttt";
    // modify robot name here
    let robotName = "UR3";



    let rdg = new robotDescriptiongenrate(dtSceneAddress);

    // generate the robot info and TD
    let rootFolderPath = rootAddress + "/Evaluation_TDgenTime_sceneComplexity/robot_info/temporary_robot"; //the path of folder to save necessary files

    // generate related info based on robot model in coppeliasim
    let robotInfo = await rdg.robotInfogeneration(robotName, rootFolderPath);
    //console.log(robotInfo);

    // generate TD file base on robot name and necessary files in folder
    await rdg.generateTD(robotName, rootFolderPath);  
}

async function main() {
    
    // calculate the required time 
    // change unit to seconds
    var start = performance.now()/1000;


    // based on robot model and correponding scene to generate TD
    await robotTDGen();

    var end = performance.now()/1000;
    console.log('The required time is', `${end - start}s`)


    process.exit(1);
}

main();