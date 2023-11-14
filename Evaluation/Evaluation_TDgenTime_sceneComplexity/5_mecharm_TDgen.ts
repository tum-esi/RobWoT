//const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

// for class robot description generation
import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";


async function robotTDGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/Evaluation_TDgenTime_sceneComplexity/5_mecharm_scene.ttt";

    let rdg = new robotDescriptiongenrate(dtSceneAddress);

    let robotName = "mecharm";

    // generate the robot info and TD
    let rootFolderPath = rootAddress + "/Evaluation_TDgenTime_sceneComplexity/robot_info/mecharm_robot"; //the path of folder to save necessary files

    // generate related info based on robot model in coppeliasim
    let robotInfo = await rdg.robotInfogeneration(robotName, rootFolderPath);
    //console.log(robotInfo);

    let optionsmecharm = {
        "unit of distance": "meter",
        "stlFilepath": "http://localhost:4000/mecharm_robot/mecharm_robot_shape.stl",
        "csvFilepath": "http://localhost:4000/mecharm_robot/mecharm_robot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/mecharm_robot/mecharm_robot.ttm",
        "href":"http://localhost:8081/",
        "port": 8081
    }

    // generate TD file base on robot name and necessary files in folder
    await rdg.generateTD(robotName, rootFolderPath,optionsmecharm);  
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