const { RemoteAPIClient } = require("coppelia-ws-api");
var path = require('path');   // for root path

// for class load urdf
import {robotURDFload} from "../Library/Load_URDF/LoadUrdf";

// for class robot description generation
import {RobotDescriptionGenerator} from "../Library/GenerateRobotDescription/RobotDescriptionGenerator";

// for class to generate the robot wot server
import {RobotWoTServer} from "../Library/Robot_WoT_Server/WoT_server_generation_class";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function robotModelGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository

    let sceneAddress = rootAddress + "/Coppeliasim scene/robot_urdf_load_scene.ttt";
    console.log(sceneAddress);
    let fileAddress = rootAddress + "/Load_URDF_robot/URDF example/mypal_description/urdf/mypal_260.urdf";
    let robotName = "mypal";
    let robURDF = new robotURDFload(sceneAddress,fileAddress,robotName);

    // first generate the robot model based on the URDF file
    await robURDF.loadURDF();
}

async function robotTDGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/URDF_to_Robwot/mypal_simple_scene.ttt";

    let rdg = new RobotDescriptionGenerator(dtSceneAddress);

    // load the robot model to the scene
    let modelAddress = rootAddress + "/Coppeliasim scene/default robot models/mypal.ttm";
    // set the position of model in the scene
    let robotName = await rdg.loadModel(modelAddress,[0,0,0.06]); 
    console.log(robotName);

    // generate the robot info and TD
    let rootFolderPath = rootAddress + "/URDF_to_Robwot/robot_info/mypal_robot"; //the path of folder to save necessary files

    // generate related info based on robot model in coppeliasim
    let robotInfo = await rdg.robotInfogeneration(robotName, rootFolderPath);
    console.log(robotInfo);

    let optionsMypal = {
        "unit of distance": "meter",
        "stlFilepath": "http://localhost:4000/mypal_robot/mypal_robot_shape.stl",
        "csvFilepath": "http://localhost:4000/mypal_robot/mypal_robot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/mypal_robot/mypal_robot.ttm",
        "href":"http://localhost:8081/",
        "port": 8081
    }

    // generate TD file base on robot name and necessary files in folder
    await rdg.generateTD(robotName, rootFolderPath,optionsMypal);  
}

async function robotWoTGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/URDF_to_Robwot/mypal_simple_scene.ttt";

    let driverAddress = rootAddress + "/Robot_WoT_server/robot_driver.txt";

    let shapePath = path.resolve(__dirname, '..') + "/URDF_to_Robwot/robot_info/mypal_robot/mypal_shape.stl";
    let pointPath = path.resolve(__dirname, '..') + "/URDF_to_Robwot/robot_info/mypal_robot/mypal_data_point.csv";
    let robotTD = rootAddress + "/URDF_to_Robwot/robot_info/mypal_robot/mypal_instance.json";

    let robotName = "mypal";

    let mypal_robot = new RobotWoTServer(dtSceneAddress,driverAddress,robotTD,robotName,null,null,null,shapePath,pointPath,[0,0,0,1]); // it requires coppeliaism

    //initial the virtual robot WoT server
    await mypal_robot.serverInit();

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
