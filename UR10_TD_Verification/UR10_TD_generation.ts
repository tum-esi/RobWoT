const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path
import * as fs from 'fs';


import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";



async function main() {
    let rootRepo = path.resolve(__dirname, '..'); // get the root directory of the repository
    let rootAddress = __dirname;
    //console.log(rootAddress);
    let sceneAddress = rootAddress + "/UR10_TD_verification.ttt";
    console.log(sceneAddress);

    let filePath = rootAddress;
    let robotName = "UR10";

    let rdg = new robotDescriptiongenrate(sceneAddress);
    //rdg.driverAddress = rootRepo + "/Generate_robot_description/robot_driver_workspace.txt";

    let posOutput = [[-0.68, -489.75, 1426.52],[691, 1.63, 737.38]];
    let posInput = [[-0.89988, -0.093933, 2.2941],[-0.21258, 0.38856, 1.6054]];
    //let tem = rdg.posRefparse(posOutput,posInput);

    //console.log(tem);

    let robotInfo = await rdg.robotInfogeneration(robotName,filePath,posOutput,posInput);
    console.log(robotInfo);

    let robotInfofolder = rootAddress + "/UR10_folder";
    let result = await rdg.generateTD(robotName, robotInfofolder); 

    console.log(result);
    
}

main();