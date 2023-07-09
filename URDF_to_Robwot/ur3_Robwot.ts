const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

// for class load urdf
import {robotURDFload} from "../Load_URDF_robot/load_urdf_class";

// for class robot description generation
import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";

// for class to generate the robot wot server
import {robotWoTserver} from "../Robot_WoT_server/WoT_server_generation_class";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function robotModelGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository

    let sceneAddress = rootAddress + "/Coppeliasim scene/robot_urdf_load_scene.ttt";
    console.log(sceneAddress);
    let fileAddress = rootAddress + "/Load_URDF_robot/URDF example/ur_description/urdf/ur3_robot.urdf";
    let robotName = "UR3";
    let robURDF = new robotURDFload(sceneAddress,fileAddress,robotName);

    // first generate the robot model based on the URDF file
    await robURDF.loadURDF();
}

async function robotTDGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/URDF_to_Robwot/ur3_simple_scene.ttt";

    let rdg = new robotDescriptiongenrate(dtSceneAddress);

    // load the robot model to the scene
    let modelAddress = rootAddress + "/Coppeliasim scene/default robot models/UR3.ttm";
    // set the position of model in the scene
    let robotName = await rdg.loadModel(modelAddress,[0,0,0.03]); 
    console.log(robotName);
    //let robotName = "UR3";

    // generate the robot info and TD
    let rootFolderPath = rootAddress + "/URDF_to_Robwot/robot_info/ur3_robot"; //the path of folder to save necessary files

    // generate related info based on robot model in coppeliasim
    let robotInfo = await rdg.robotInfogeneration(robotName, rootFolderPath);
    console.log(robotInfo);

    let optionsUR3 = {
        "unit of distance": "meter",
        "stlFilepath": "http://localhost:4000/UR3_robot/UR3_robot_shape.stl",
        "csvFilepath": "http://localhost:4000/UR3_robot/UR3_robot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/UR3_robot/UR3_robot.ttm",
        "href":"http://localhost:8081/",
        "port": 8081
    }

    // generate TD file base on robot name and necessary files in folder
    await rdg.generateTD(robotName, rootFolderPath,optionsUR3);  
}

async function robotWoTGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/URDF_to_Robwot/ur3_simple_scene.ttt";

    let driverAddress = rootAddress + "/Robot_WoT_server/robot_driver.txt";

    let shapePath = path.resolve(__dirname, '..') + "/URDF_to_Robwot/robot_info/ur3_robot/UR3_shape.stl";
    let pointPath = path.resolve(__dirname, '..') + "/URDF_to_Robwot/robot_info/ur3_robot/UR3_data_point.csv";
    let robotTD = rootAddress + "/URDF_to_Robwot/robot_info/ur3_robot/UR3_instance.json";

    let robotName = "UR3";

    let ur3_robot = new robotWoTserver(dtSceneAddress,driverAddress,robotTD,robotName,null,null,null,shapePath,pointPath,[0,0,0,1]); // it requires coppeliaism

    //initial the virtual robot WoT server
    await ur3_robot.serverInit();

    await delay(3000);

    
}
async function main() {

    // load URDF file to generate robot model
    await robotModelGen();

    // based on robot model and correponding scene to generate TD
    await robotTDGen();

    // generate robot WoT server based on TD
    await robotWoTGen();

}

main();