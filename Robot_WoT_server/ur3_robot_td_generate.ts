import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";


async function main() {
    let virtualSceneadress = __dirname + "/robot_digital_twins.ttt";
    let sceneAddress:string = virtualSceneadress; 

    let rdg = new robotDescriptiongenrate(sceneAddress);

    let robotName = "ur3_robot";
    let rootFolder = __dirname + "/robot_info"; //the path of folder to save necessary files

    let robotInfo = await rdg.robotInfogeneration(robotName,rootFolder); // just use coordinates in coppeliasim scene
    console.log(robotInfo);

    await rdg.generateTD(robotName, rootFolder); 


}

main();