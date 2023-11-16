import {robotMotioncontrol} from "../UR10_TD_Verification/robotMotioncontrol_class"

var path = require('path');   // for root path

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let sceneAddress = rootAddress + "/Evaluation_TDgenTime_sceneComplexity/9_ur10_new_scene.ttt";

    let driverAddress = rootAddress + "/Robot_WoT_Server/robot_driver.lua";
    let posOutput = [[1123.95, 443.28, 1426.52],[-1298.13, -1298.13, 130.36]];
    let posInput = [[ 0.53818 ,0.63484, 2.2692],[ -1.8901, -1.1118, 0.96328]];
    //    let posOutput = [[-0.68, 443.28, 1426.52],[-1298.13, -1298.13, 130.36]];
    //let posInput = [[ -0.58986 ,0.63484, 2.2692],[ -1.8901, -1.1118, 0.96328]];


    let UR_robot = new robotMotioncontrol(sceneAddress,"UR10",posOutput,posInput);
    
    //await UR_robot.loadDrivertoRobot(driverAddress);
    await UR_robot.sceneInit();
    
    /*
    let result = await UR_robot.moveToCartpos([600, -100, 35, 0.50000673532486, -0.49999409914017, 0.49999397993088, -0.50000685453415]);
    await UR_robot.moveToCartpos([600, -100, -235,-0.7071065307, 0.7071070075, 0.0001451228891, 0.0001451227872]);

    await UR_robot.moveToCartpos([240, -100, -305,-0.7071065307, 0.7071070075, 0.0001451228891, 0.0001451227872]);
    */
    //await UR_robot.moveToCartpos([-300, 460, 35, 0.50000673532486, -0.49999409914017, 0.49999397993088, -0.50000685453415]);
    //let result = await UR_robot.moveToCartpos([230, 463, 27, 0.50000673532486, -0.49999409914017, 0.49999397993088, -0.50000685453415]);
    
    let result = await UR_robot.moveToCartpos([-300, 430, 35, 0.50000673532486, -0.49999409914017, 0.49999397993088, -0.50000685453415]);
    //let result = await UR_robot.moveToCartpos([280, -509, 35, 0.50000673532486, -0.49999409914017, 0.49999397993088, -0.50000685453415]);
    console.log(result);


    let jointPos = await UR_robot.getJointpos([0,-90,0,-90,0,0]);
    console.log(jointPos);
    
    let pos = await UR_robot.getCartpos();
    console.log(pos);
    
}


main();