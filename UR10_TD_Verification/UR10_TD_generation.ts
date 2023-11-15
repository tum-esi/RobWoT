const { RemoteAPIClient } = require("coppelia-ws-api");
var path = require('path');   // for root path
import * as fs from 'fs';


import {RobotDescriptionGenerator} from "../Library/GenerateRobotDescription/RobotDescriptionGenerator";



async function main() {
    let rootRepo = path.resolve(__dirname, '..'); // get the root directory of the repository
    let rootAddress = __dirname;
    //console.log(rootAddress);
    let sceneAddress = rootAddress + "/UR10_TD_verification.ttt";
    console.log(sceneAddress);

    let filePath = rootAddress + "/UR10_folder";
    let robotName = "UR10";

    let rdg = new RobotDescriptionGenerator(sceneAddress);
    //rdg.driverAddress = rootRepo + "/Generate_robot_description/robot_driver_workspace.txt";

    let posOutput = [[-0.68, -489.75, 1426.52],[691, 1.63, 737.38]];
    let posInput = [[-0.89988, -0.093933, 2.2941],[-0.21258, 0.38856, 1.6054]];
    //let tem = rdg.posRefparse(posOutput,posInput);

    //console.log(tem);

    let robotInfo = await rdg.robotInfogeneration(robotName,filePath,posOutput,posInput);
    console.log(robotInfo);

    let options = {
        "unit of distance": "millimeter",
        "description": "The TD for the virtual ur10 robot",
        "stlFilepath": "http://localhost:4000/ur10_robot/UR10_shape.stl",
        "csvFilepath": "http://localhost:4000/ur10_robot/UR10_data_point.csv",
        "sceneFilepath": "http://localhost:4000/ur10_robot/UR10_TD_verification.ttt",
        "href":"http://localhost:8001/",
        "port": 8001
    }


    let robotInfofolder = rootAddress + "/UR10_folder";
    let result = await rdg.generateTD(robotName, robotInfofolder, options); 

    console.log(result);
    
}

main();