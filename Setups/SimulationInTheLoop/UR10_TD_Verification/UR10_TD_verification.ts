var path = require('path');   // for root path

import {RobotWoTServer} from "../../../Library/Robot_WoT_Server/WoT_server_generation_class";

import {robotPositioncheck} from "./robotPositioncheck_class";

import {Servient, Helpers} from '@node-wot/core';
import {HttpServer, HttpClientFactory, HttpsClientFactory} from '@node-wot/binding-http'
import { ThingDescription } from "wot-typescript-definitions";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {

    let rootAddress = __dirname;
    let sceneAddress = rootAddress + "/UR10_TD_verification.ttt";

    let driverAddress = path.resolve(__dirname, '..') + "/Robot_WoT_server/robot_driver.txt";
    let UR10TD = rootAddress + "/UR10_folder/UR10_instance.json";

    let posOutput = [[-0.68, -489.75, 1426.52],[687, -0.7, 741]];
    let posInput = [[-0.89988, -0.093933, 2.2941],[-0.21258, 0.38856, 1.6054]];

    let compensateVal = [0,-90,0,-90,0,0]; // the initial joint degree in real robot and virtual robot at same posture exists a fix value deviation, so add a compensate value

    let shapePath = path.resolve(__dirname, '..') + "/UR10_TD_Verification/UR10_folder/UR10_shape.stl";
    let pointPath = path.resolve(__dirname, '..') + "/UR10_TD_Verification/UR10_folder/UR10_data_point.csv";

    let rMC = new robotPositioncheck(shapePath,pointPath);  // it can only check the convex shape and don not require coppeliasim

    let UR_robot = new RobotWoTServer(sceneAddress,driverAddress,UR10TD,"UR10",posOutput,posInput,compensateVal,shapePath,pointPath); // it requires coppeliaism

    //initial the virtual robot WoT server
    await UR_robot.serverInit();

    await delay(3000);


    // WoT client (You can also write your own client)-----------------------
    let UR10_URL = "http://localhost:8081/coppeliasim_virtualrobot_ur10";

    const controllerServient = new Servient()
    controllerServient.addClientFactory(new HttpClientFactory())
    controllerServient.addClientFactory(new HttpsClientFactory())
    const wotHelpers =  new Helpers(controllerServient)
    
    async function main() {
        const ur10TD = await wotHelpers.fetch(UR10_URL) as ThingDescription;
        const WoT  = await controllerServient.start();
        const ur10Sim = await WoT.consume(ur10TD);
        ur10Sim.readProperty("getCartesianposition")
        let res1 = await (await ur10Sim.readProperty("getCartesianposition")).value();
        console.log(res1);

        let res2 = await (await ur10Sim.readProperty("getJointposition")).value();
        console.log(res2);

        let res3 = await rMC.posSafetycheck([500,-890,1000]); // check if the point in workspace, it doesn't require Coppeliasim
        console.log(res3);

        await ur10Sim.invokeAction("moveTocartesianPosition", {"x":500,"y":-890,"z":1000});
        await delay(15000);

        let res4 = await (await ur10Sim.readProperty("getCartesianposition")).value();
        console.log(res4);

        await ur10Sim.invokeAction("moveTojointPosition",{"joint1":0,"joint2":-30,"joint3":40,"joint4":135,"joint5":20,"joint6":50});
        await delay(8000);

        let res5 = await (await ur10Sim.readProperty("getJointposition")).value();
        console.log(res5);
    }
    
    //-----------------------------------------------------------------------

    
    // Add interaction code with real robot --------------------


    // ---------------------------------------------------------
}



main();