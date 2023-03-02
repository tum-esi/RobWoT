import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core'; 

// for reading local TD file
import * as fs from 'fs';

// load remote api for copperliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");

// load virtual sensor class
import {virtualSensor,virtualConveyor, virtualUarm, virtualDobot} from "./virtualDevices";
import { makeWoTinteraction } from './clientClass';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


// read the virtual devices TD file
let sensorTD1 = JSON.parse(fs.readFileSync("../virtual_things_description/virtual_infrared_sensor/virtual_infrared_sensor1.td.json", "utf8"));
let sensorTD2 = JSON.parse(fs.readFileSync("../virtual_things_description/virtual_infrared_sensor/virtual_infrared_sensor2.td.json", "utf8"));

// read the conveyor TD file
let conveyorTD1 = JSON.parse(fs.readFileSync("../virtual_things_description/virtual_conveyorbelt/virtual_conveyor_left.td.json", "utf8"));
let conveyorTD2 = JSON.parse(fs.readFileSync("../virtual_things_description/virtual_conveyorbelt/virtual_conveyor_right.td.json", "utf8"));

// read the uarm TD file
let uarmTD =JSON.parse(fs.readFileSync("../virtual_things_description/virtual_robot/virtual_uarm.td.json", "utf8"));

// read the dobot TD file
let dobotTD =JSON.parse(fs.readFileSync("../virtual_things_description/virtual_robot/virtual_dobot.td.json", "utf8"));

// read the color sensor TD file
let colorTD =JSON.parse(fs.readFileSync("../virtual_things_description/virtual_color_sensor/virtual_color_sensor.td.json", "utf8"));


// set virtual scene address
//console.log(__dirname); // get current file absolute path
let virtualSceneadress = __dirname + "/Virtual_IoT_lab_new.ttt";



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
    let sceneAddress:String = virtualSceneadress; 
    var sim = await init(sceneAddress);

    // the virtual iot lab total server, now we consider to move every device into one server and the same port
    let virtualIoTlabserver = new Servient();
    virtualIoTlabserver.addServer(
        new HttpServer({
            port: 9000, // set port 9000 as request
        })
    );
    virtualIoTlabserver.start().then((WoT) => {
        //sensor1
        WoT.produce(sensorTD1).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the copperliasim
            let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(500);
            
            let sensor1 = new virtualSensor(sim,"/InfraredSensor1");
    
            // set property handlers (using async-await)
            // set sensorState propety handlers
            thing.setPropertyReadHandler("sensorState", async() => await (sensor1.objectDetect()))

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
        //sensor2   
        WoT.produce(sensorTD2).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the copperliasim
            //let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(500);
            
            let sensor1 = new virtualSensor(sim,"/InfraredSensor2");
            
            // set property handlers (using async-await)
            // set sensorState propety handlers
            thing.setPropertyReadHandler("sensorState", async() => await (sensor1.objectDetect()))

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        }); 
        // conveyor1
        WoT.produce(conveyorTD1).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the copperliasim
            //let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(500);
            
            let conveyor1 = new virtualConveyor(sim,"/ConveyorBelt1");
            await conveyor1.setConveyorSpeed(0);

            // set action handlers (using async-await)
            // set startBeltBackward action handlers
            thing.setActionHandler("startBeltBackward", async() =>{
                try {
                    await conveyor1.setConveyorSpeed(0.02);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });
            // set startBeltForward action handlers
            thing.setActionHandler("startBeltForward", async() =>{
                try {
                    await conveyor1.setConveyorSpeed(-0.02);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            thing.setActionHandler("stopBelt", async() =>{
                try {
                    await conveyor1.setConveyorSpeed(0);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
        //conveyor2    
        WoT.produce(conveyorTD2).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the copperliasim
            //let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(500);
            
            let conveyor2 = new virtualConveyor(sim,"/ConveyorBelt2");
            await conveyor2.setConveyorSpeed(0);

            // set action handlers (using async-await)
            // set startBeltBackward action handlers
            thing.setActionHandler("startBeltBackward", async() =>{
                try {
                    await conveyor2.setConveyorSpeed(0.025);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });
            // set startBeltForward action handlers
            thing.setActionHandler("startBeltForward", async() =>{
                try {
                    await conveyor2.setConveyorSpeed(-0.025);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            thing.setActionHandler("stopBelt", async() =>{
                try {
                    await conveyor2.setConveyorSpeed(0);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
        //uarm
        WoT.produce(uarmTD).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the copperliasim
            //let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(200);
            
            let uarm = new virtualUarm(sim, "/uarm");

            uarm.setGripperstate(false);

            // set action handlers (using async-await)
            // set startBeltBackward action handlers
            thing.setActionHandler("goTo", async(data) =>{
                try {
                    let pos:any = await data.value();
                    
                    let finalPos:Number[] = [pos["x"]/1000, pos["y"]/1000, pos["z"]/1000]; // convert to meter
                    //console.log(finalPos);

                    await uarm.goWithspeed(finalPos,2222);

                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });
            // set startBeltForward action handlers
            thing.setActionHandler("gripClose", async() =>{
                try {
                    await uarm.setGripperstate(true);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            thing.setActionHandler("gripOpen", async() =>{
                try {
                    await uarm.setGripperstate(false);
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });
            thing.setActionHandler("goWithSpeed", async(data) =>{
                try {
                    let pos:any = await data.value();
                    
                    let finalPos:Number[] = [pos["x"]/1000, pos["y"]/1000, pos["z"]/1000]; // convert to meter
                    let speed = pos["speed"];
                    //console.log(finalPos);

                    await uarm.goWithspeed(finalPos,speed);
                    
                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }             
            })
            thing.setActionHandler("goHome", async() =>{
                try {
                    let pos = [0.220,0,0.1];

                    await uarm.goWithspeed(pos,2222);

                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
        //dobot
        WoT.produce(dobotTD).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);

            let dobot = new virtualDobot(sim, "/Dobot");

            let cubeDetect = new virtualSensor(sim,"/cubesensor");

            dobot.setGripperstate(false);

            // set action handlers (using async-await)
            // set startBeltBackward action handlers
            // set startBeltForward action handlers
            thing.setActionHandler("getCube", async() =>{
                try {
                    // detect cube then slowly move
                    let distance = 0;
                    if ((await cubeDetect.objectDetect())==false){
                        await dobot.setGripperstate(true);
                        await dobot.dobotMove(0.49);
                        await dobot.moveTopos([0.44508001208305, 0.49000000953674, 0.032000001519918, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                        while (true){
                            distance = distance + 0.0055;
                            if (await cubeDetect.objectDetect()){
                                await dobot.dobotMove(0.49-distance);
                                break;
                            }
                            await dobot.dobotMove(0.49-distance);
                            await delay(100);
                        }    
                    }

                    await dobot.setJointangle([0,20,60,40,0]);
        
                    await dobot.dobotMove(0.278);

                    await dobot.setGripperstate(false);

                    await dobot.moveTopos([0.44508001208305, 0.27799999713898, 0.056019999414682, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);

                    await dobot.moveTopos([0.44508001208305, 0.27799999713898, 0.043019999414682, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                    
                    await dobot.moveTopos([0.44508001208305, 0.27799999713898, 0.032019999593496, 2.1218841084192e-07, -1.6752113651819e-07, -0.70711296796799, 0.70710057020187]);
                    
                    await dobot.setGripperstate(true);

                    await dobot.moveTopos([0.44508001208305, 0.27799999713898, 0.045019999414682, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);

                    await dobot.setJointangle([0,20,60,40,-90]);
                
                    await dobot.dobotMove(-0.4);
                    
                    await dobot.moveTopos([0.28507000207901, -0.4, 0.12200003683567, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                    
                    await dobot.moveTopos([0.28507000207901, -0.4, 0.07500003683567, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);

                    await dobot.setGripperstate(false);

                    await dobot.setJointangle([0,20,60,40,0]);

                    await dobot.setGripperstate(true);

                    await dobot.dobotMove(0.484);
                
                    await dobot.moveTopos([0.44508001208305, 0.49000000953674, 0.032000001519918, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                
                    await dobot.dobotMove(0.46);

                    await dobot.setJointangle([0,20,60,40,0]);

                    await dobot.dobotMove(0.14);

                    await dobot.setJointangle([0,40,100,60,0]); // go to the position like real iot lab
                   

                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            thing.setActionHandler("returnCube", async() =>{
                try {
                    await dobot.setJointangle([0,20,60,40,-60]);

                    await dobot.setGripperstate(false);

                    await dobot.dobotMove(0.58);
                
                    await dobot.moveTopos([0.284, 0.555, 0.112199998915195, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                    
                    await dobot.moveTopos([0.284, 0.555, 0.09599998915195, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);

                    await dobot.moveTopos([0.284, 0.555, 0.07599998915195, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);

                    await dobot.moveTopos([0.284, 0.555, 0.056700001716614, 2.1218852452876e-07, -1.6752125020503e-07, -0.70711296796799, 0.70710062980652]);

                    await dobot.setGripperstate(true);

                    await dobot.moveTopos([0.284, 0.555, 0.075199998915195, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                
                    await dobot.setJointangle([0,20,60,40,0]);
                
                    await dobot.dobotMove(0.475);
                
                    await dobot.moveTopos([0.44508001208305, 0.47500000953674, 0.05000001519918, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);

                    await dobot.moveTopos([0.44508001208305, 0.47500000953674, 0.035000001519918, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                    // detect cube then slowly move
                    let distance = 0;
                    while (true){
                        distance = distance + 0.005;
                        await dobot.dobotMove(0.475-distance);
                        if (await cubeDetect.objectDetect()){
                            await dobot.dobotMove(0.475-distance-0.005);
                            break;
                        }
                        await delay(100);
                    }
                    //await dobot.dobotMove(0.47);

                    await dobot.moveTopos([0.44508001208305, 0.475-distance-0.0045, 0.035000001519918, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                    
                    await dobot.setGripperstate(false);

                    await dobot.moveTopos([0.44508001208305, 0.475-distance-0.0045, 0.050000001519918, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                    
                    await dobot.setJointangle([0,20,60,40,0]);

                    await dobot.dobotMove(0.14);

                    await dobot.setJointangle([0,40,100,60,0]); // go to the position like real iot lab

                    await dobot.setGripperstate(true);

                    return "";
                }
                catch{
                    console.log("failed");
                    return "";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
        //color sensor
        WoT.produce(colorTD).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);

            let colorSensor = new virtualSensor(sim,"/Color_sensor");

            thing.setPropertyReadHandler("color", async() => await (colorSensor.getObjectcolor()))

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
    });

}

main()

