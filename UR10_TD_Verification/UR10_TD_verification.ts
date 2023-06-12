var path = require('path');   // for root path

import {robotWoTserver} from "../Robot_WoT_server/WoT_server_generation_class";

import {robotMotioncheck} from "./robotMotioncheck_class";

import {makeWoTinteraction} from "../virtual_devices_WoT/clientClass";


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

    let compensateVal = [0,-90,0,-90,0,0];

    let shapePath = "../UR10_TD_Verification/UR10_folder/UR10_shape.stl";
    let pointPath = "../UR10_TD_Verification/UR10_folder/UR10_data_point.csv";

    let rMC = new robotMotioncheck(shapePath,pointPath);  // it can only check the convex shape and don not require coppeliasim

    let UR_robot = new robotWoTserver(sceneAddress,driverAddress,UR10TD,"UR10",posOutput,posInput,compensateVal); // it requires coppeliaism

    //initial the virtual robot WoT server
    await UR_robot.serverInit();

    await delay(3000);


    // WoT client (You can also write your own client)-----------------------
    
    let UR10_URL = "http://localhost:8081/coppeliasim_virtualrobot_ur10";
    let ur10 = new makeWoTinteraction(UR10_URL);

    let res1 = await ur10.readProperty("getCartesianposition");
    console.log(res1);

    let res2 = await ur10.readProperty("getJointposition");
    console.log(res2);

    let res3 = await rMC.posSafetycheck([500,-890,1000]); // check if the point in workspace, it doesn't require Coppeliasim
    console.log(res3);

    await ur10.invokeAction("moveTocartesianPosition", {"x":500,"y":-890,"z":-500});

    await delay(8000);

    let res4 = await ur10.readProperty("getCartesianposition");
    console.log(res4);

    await ur10.invokeAction("moveTojointPosition",{"joint1":0,"joint2":-30,"joint3":40,"joint4":135,"joint5":20,"joint6":50});
    await delay(8000);

    let res5 = await ur10.readProperty("getJointposition");
    console.log(res5);
    //-----------------------------------------------------------------------

    
    // Add interaction code with real robot --------------------


    // ---------------------------------------------------------
}



main();