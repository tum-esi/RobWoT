import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";


async function main() {
    let virtualSceneadress = __dirname + "/robot_digital_twins.ttt";
    let sceneAddress:string = virtualSceneadress; 

    let rdg = new robotDescriptiongenrate(sceneAddress);

    let robotName = "ur3_robot";
    let rootFolder = __dirname + "/robot_info"; //the path of folder to save necessary files

    let robotInfo = await rdg.robotInfogeneration(robotName,rootFolder); // just use coordinates in coppeliasim scene
    console.log(robotInfo);

    let options = {
        "unit of distance": "meter",
        "description": "The template TD is consumed by WoT server for robotic digital twins",
        "stlFilepath": "http://localhost:4000/ur3_robot/ur3_robot_shape.stl",
        "csvFilepath": "http://localhost:4000/ur3_robot/ur3_robot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/ur3_robot/robot_digital_twins.ttt",
        "href":"http://localhost:8081/",
        "port": 8081

    }

    await rdg.generateTD(robotName, rootFolder,options); 


}

main();