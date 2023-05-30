// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

import {robotMotioncontrol} from "./Robot_motion_control_class";

import {robotMotioncheck} from "./Robot_workingspace_check_class";

import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory, HttpsClientFactory} from '@node-wot/binding-http'
import {Helpers} from '@node-wot/core';

import { writeFileSync, readFileSync } from 'fs';

import {makeWoTinteraction} from "../virtual_devices_WoT/clientClass";


const UR10 = JSON.parse(readFileSync("./real_UR10_TD.json","utf-8"));

const URL = "";


// for reading local file
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {
    // wot initialization
    let Consumer = new Servient();

    Consumer.addClientFactory(new HttpClientFactory());
    Consumer.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}));

    const WoT = await Consumer.start();
    let ur10Thing = await WoT.consume(UR10);
    //console.log(ur10Thing);


    let rootAddress = __dirname;
    let sceneAddress = rootAddress + "/UR10_TD_verification.ttt";

    let driverAddress = path.resolve(__dirname, '..') + "/Robot_WoT_server/robot_driver.txt";
    let posOutput = [[-0.68, -489.75, 1426.52],[687, -0.7, 741]];
    let posInput = [[-0.89988, -0.093933, 2.2941],[-0.21258, 0.38856, 1.6054]];

    let shapePath = "../UR10_TD_Verification/UR10_folder/UR10_shape.stl";
    let pointPath = "../UR10_TD_Verification/UR10_folder/UR10_data_point.csv";

    let rMC = new robotMotioncheck(shapePath,pointPath);  // it can only check the convex shape and don not require coppeliasim

    let UR_robot = new robotMotioncontrol(sceneAddress,"UR10",posOutput,posInput); // it requires coppeliaism

    //await UR_robot.loadDrivertoRobot(driverAddress); // this part only needs to be executed once
    //await UR_robot.sceneInit();


    // set initial pos you want
    let x = 500;
    let y = -890
    let z = 1000;
    let pos = [x,y,z];
    let cartPos = [x,y,z,0,0.707,0,0.707];

    // first check if the point in work space shape
    let state = await rMC.posSafetycheck(pos);  // only accept the position from the real robot
    console.log(state);

    
    // joint verifaction
    let result0 = await UR_robot.moveTojointpos([0,-30*Math.PI/180,0,0,0,0]);
    console.log(result0);
    let jointPos = await UR_robot.getJointpos([0,-90,0,-90,0,0]); //need a compensate for this
    console.log(jointPos);
    

    let jointDegree = {"base":jointPos["joint1"], "elbow":jointPos["joint2"], "shoulder":jointPos["joint3"],"wrist1":jointPos["joint4"],"wrist2":jointPos["joint5"],"wrist3":jointPos["joint6"]};
    console.log(jointDegree);

    //await ur10Thing.invokeAction("setJointDegrees",jointDegree);
    //await delay(3000);


    // ik or cartiesian verification
    let result = await UR_robot.moveToCartpos(cartPos);
    console.log(result);

    let curPos = await UR_robot.getCartpos();
    console.log(curPos);
    let curjointPos = await UR_robot.getJointpos([0,-90,0,-90,0,0]);
    console.log(curjointPos);

    let realPos = {"a":0.1, "s":0.1, "x":curPos[0],"y":curPos[1],"z":curPos[2]};
    console.log(realPos);

    await ur10Thing.invokeAction("goTo",realPos);

    let curRealpos = await (await ur10Thing.readProperty("currentCoordinates")).value();
    console.log(curRealpos); 

}



main();