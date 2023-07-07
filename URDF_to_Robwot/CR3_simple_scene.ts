const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

// for class load urdf
import {robotURDFload} from "../Load_URDF_robot/load_urdf_class";

// for class robot description generation
import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function main() {
    
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository

    let sceneAddress = rootAddress + "/Coppeliasim scene/robot_urdf_load_scene.ttt";
    console.log(sceneAddress);
    let fileAddress = rootAddress + "/Load_URDF_robot/URDF example/ur_description/urdf/ur3_robot.urdf";
    let robotName = "UR3";
    let robURDF = new robotURDFload(sceneAddress,fileAddress,robotName);



    await robURDF.loadURDF();


    

    await delay(500);
    process.exit(1); 
}

main();
