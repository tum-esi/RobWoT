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
    let fileAddress = rootAddress + "/Load_URDF_robot/URDF example/mycobot_description/urdf/mycobot.urdf";
    let robotName = "mycobot280";
    let robURDF = new robotURDFload(sceneAddress,fileAddress,robotName);

    // first generate the robot model based on the URDF file
    await robURDF.loadURDF();
}

async function robotTDGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/URDF_to_Robwot/mycobot_simple_scene.ttt";

    let rdg = new RobotDescriptionGenerator(dtSceneAddress);

    // load the robot model to the scene
    let modelAddress = rootAddress + "/Coppeliasim scene/default robot models/mycobot280.ttm";
    // set the position of model in the scene
    let robotName = await rdg.loadModel(modelAddress,[0,0,0.01]); 
    console.log(robotName);

    // generate the robot info and TD
    let rootFolderPath = rootAddress + "/URDF_to_Robwot/robot_info/mycobot_robot"; //the path of folder to save necessary files

    // generate related info based on robot model in coppeliasim
    let robotInfo = await rdg.robotInfogeneration(robotName, rootFolderPath);
    console.log(robotInfo);

    let optionsmycobot = {
        "unit of distance": "meter",
        "stlFilepath": "http://localhost:4000/mycobot_robot/mycobot_robot_shape.stl",
        "csvFilepath": "http://localhost:4000/mycobot_robot/mycobot_robot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/mycobot_robot/mycobot_robot.ttm",
        "href":"http://localhost:8091/",
        "port": 8091
    }

    // generate TD file base on robot name and necessary files in folder
    await rdg.generateTD(robotName, rootFolderPath,optionsmycobot);  
}

async function robotWoTGen() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let dtSceneAddress = rootAddress + "/URDF_to_Robwot/mycobot_simple_scene.ttt";

    let driverAddress = rootAddress + "/Robot_WoT_server/robot_driver.txt";

    let shapePath = path.resolve(__dirname, '..') + "/URDF_to_Robwot/robot_info/mycobot_robot/mycobot280_shape.stl";
    let pointPath = path.resolve(__dirname, '..') + "/URDF_to_Robwot/robot_info/mycobot_robot/mycobot280_data_point.csv";
    let robotTD = rootAddress + "/URDF_to_Robwot/robot_info/mycobot_robot/mycobot280_instance.json";

    let robotName = "mycobot280";

    let mycobot_robot = new RobotWoTServer(dtSceneAddress,driverAddress,robotTD,robotName,null,null,null,shapePath,pointPath,null); // it requires coppeliaism

    //initial the virtual robot WoT server
    await mycobot_robot.serverInit();

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
