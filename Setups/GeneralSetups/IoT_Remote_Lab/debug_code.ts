const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js")
import {virtualUarm, virtualDobot, virtualSensor,virtualLight} from "./virtualDevices";

import {robotDescriptiongenrate} from "../Generate_robot_description/robot_description_generation_class";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function init(address:String){
    console.log('Hello...');
    const client = new RemoteAPIClient('localhost', 23050,'json');
    console.log('Connecting...');
    await client.websocket.open();
    console.log('Getting proxy object "sim"...');
    let sim = await client.getObject('sim');

    // load the CoppeliaSim scene
    await sim.loadScene(address);

    await sim.startSimulation();

    await delay(1000);

    return sim;
}


async function main() {

    let sceneAddress:String = "D:/master_thesis/project/robwot/IoT_remote_lab/IoT_remote_lab.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim 
    
    let dobot = new virtualDobot(sim,"/dobot");

    let uarm = new virtualUarm(sim,"/uarm");
    
    let cubeDetect = new virtualSensor(sim,"/cubesensor");

    let light1 = new virtualLight(sim,"/Spotlight1");

    let light2 = new virtualLight(sim,"/Spotlight2");


    // light test
    //console.log(Boolean(1));
    //console.log(Boolean(0));

    let tem = await light1.getLightinfo();
    console.log(tem);
    /*
    await light1.setLightstate(true);
    await delay(5000);
    await light1.setLightcolor([0,200,100]);
    await delay(3000);
    await light1.setLightstate(false);
    */
    
    // get cube
    /*
    let distance = 0;
    if ((await cubeDetect.objectDetect())==true){
        await dobot.setGripperstate(true);
        await dobot.dobotMove(-0.62);
        await dobot.setJointangle([0,20,60,40,55]);
        await dobot.moveTopos([0.83214, -0.8, 1.10, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
        await dobot.moveTopos([0.83214, -0.8, 1.058, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
        while (true){
            distance = distance + 0.0055;
            if (await cubeDetect.objectDetect()){
                await dobot.dobotMove(-0.62+distance);
                break;
            }
            await dobot.dobotMove(-0.62+distance);
            await delay(100);
        }    
    }

    await dobot.setJointangle([0,20,60,40,0]);

    await dobot.dobotMove(-0.38);

    await dobot.setJointangle([0,20,60,40,59]);

    await dobot.setGripperstate(false);

    await dobot.moveTopos([0.83214, -0.58, 1.085, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);

    await dobot.moveTopos([0.83214, -0.58, 1.068, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
    
    await dobot.moveTopos([0.83214, -0.58, 1.058, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
    
    await dobot.setGripperstate(true);

    await dobot.moveTopos([0.83214, -0.58, 1.11, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);

    await dobot.setJointangle([0,20,60,40,-90]);

    await dobot.dobotMove(0.095);

    await dobot.moveTopos([0.98, 0.095, 1.1, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);

    await dobot.setJointangle([0,20,60,40,0]);

    await dobot.dobotMove(-0.43);

    */
   // return cube
   
   /*
   await dobot.setJointangle([0,20,60,40,-55]);

   await dobot.setGripperstate(false);

   await dobot.dobotMove(-0.833);

   await dobot.moveTopos([0.993, -0.833, 1.2, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                    
   //await dobot.moveTopos([0.993, -0.833, 1.15, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);

   await dobot.moveTopos([0.993, -0.833, 1.12, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);

   await dobot.moveTopos([0.993, -0.833, 1.1, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);

   await dobot.setGripperstate(true);

   await dobot.moveTopos([0.993, -0.833, 1.25, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);

   await dobot.setJointangle([0,20,60,40,0]);

   await dobot.dobotMove(-0.62);

   await dobot.setJointangle([0,20,60,40,55]);
   await dobot.moveTopos([0.83214, -0.8, 1.10, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
   await dobot.moveTopos([0.83214, -0.8, 1.06, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
    
    // detect cube then slowly move
    let distance = 0;
    while (true){
        distance = distance + 0.005;
        await dobot.dobotMove(-0.62+distance);
        if (await cubeDetect.objectDetect()){
            await dobot.dobotMove(-0.62+distance+0.005);
            break;
        }
        await delay(100);
    }
    //await dobot.dobotMove(0.47);

    await dobot.setGripperstate(false);

    await dobot.moveTopos([0.83214, -0.795+distance, 1.08, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
    
    await dobot.moveTopos([0.83214, -0.795+distance, 1.12, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
    
    await dobot.setJointangle([0,20,60,40,0]);

    await dobot.dobotMove(-0.43);

    await dobot.setJointangle([0,40,100,60,0]); // go to the position like real iot lab

    await dobot.setGripperstate(true);
    */
    // uarm parse
    /*
    let P3 = [0.192,0.192,0.07];
    let P4 = [0.192,0.192,0.052];
    let P5 = [0.2,-0.2,0.07];
    let P1 = [0.18,0,0.06];
    let P2 = [0.2,0,0.08]
    await uarm.goWithspeed(P2,1500);
    await delay(3000);
    await uarm.goWithspeed(P3,1500);
    await delay(3000);
    await uarm.goWithspeed(P4,1500);
    await delay(3000);
    await uarm.goWithspeed(P3,1500);
    await delay(3000);
    await uarm.goWithspeed(P1,1500);    
    await delay(3000);
    await uarm.goWithspeed(P5,1500);
    */





    await delay(40000);
    
    console.log("simulation stop");
    await sim.stopSimulation();
}


//main();

async function genMain() {
    let virtualSceneadress = __dirname + "/IoT_remote_lab.ttt";
    let sceneAddress:string = virtualSceneadress; 

    let rdg = new robotDescriptiongenrate(sceneAddress);

    /*
    let robotName = "uarm";
    let rootFolder = __dirname + "/robot_info/uarm_folder"; //the path of folder to save necessary files
    let options = {
        "unit of distance": "millimeter",
        "stlFilepath": "http://localhost:4000/uarm_robot/uarm_shape.stl",
        "csvFilepath": "http://localhost:4000/uarm_robot/uarm_data_point.csv",
        "sceneFilepath": "http://localhost:4000/uarm_robot/IoT_remote_lab.ttt",
        "href":"http://localhost:8070/",
        "port": 8070
    }
    await rdg.generateTD(robotName, rootFolder, options); 
    */
    
    let robotName = "UR10";
    let rootFolder = __dirname + "/robot_info/ur10_folder"; //the path of folder to save necessary files
    let posOutput = [[-0.68, -489.75, 1426.52],[691, 1.63, 737.38]];
    let posInput = [[-0.89988, -0.093933, 2.2941],[-0.21258, 0.38856, 1.6054]];

    //let robotInfo = await rdg.robotInfogeneration(robotName,rootFolder,posOutput,posInput); // just use coordinates in coppeliasim scene
    //console.log(robotInfo);

    let options = {
        "unit of distance": "millimeter",
        "description": "The TD for the virtual ur10 robot",
        "stlFilepath": "http://localhost:4000/ur10_robot/UR10_shape.stl",
        "csvFilepath": "http://localhost:4000/ur10_robot/UR10_data_point.csv",
        "sceneFilepath": "http://localhost:4000/ur10_robot/IoT_remote_lab.ttt",
        "href":"http://localhost:8070/",
        "port": 8070
    }

    await rdg.generateTD(robotName, rootFolder,options); 
    

    await delay(4000);
    process.exit(1);

    
}

//genMain();