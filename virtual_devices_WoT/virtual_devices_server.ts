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
let virtualSceneadress = __dirname + "/Virtual_IoT_lab.ttt";



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

    // robot WoT server 
    // create Servient add HTTP binding with port configuration
    let serverSensor1 = new Servient();
    serverSensor1.addServer(
        new HttpServer({
            port: 9000, // set port 9000 as request
        })
    );

    // sensor1
    serverSensor1.start().then((WoT) => {
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
    });

    let serverSensor2 = new Servient();
    serverSensor2.addServer(
        new HttpServer({
            port: 9001, // set port 8080 as request
        })
    );
    // sensor2
    serverSensor2.start().then((WoT) => {
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
    });

    // conveyor WoT server 
    // create Servient add HTTP binding with port configuration
    let serverConveyor1 = new Servient();
    serverConveyor1.addServer(
        new HttpServer({
            port: 9002, // set port 9002 as request
        })
    );

    // conveyor1
    serverConveyor1.start().then((WoT) => {
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
                    await conveyor1.setConveyorSpeed(0.03);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });
            // set startBeltForward action handlers
            thing.setActionHandler("startBeltForward", async() =>{
                try {
                    await conveyor1.setConveyorSpeed(-0.03);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            thing.setActionHandler("stopBelt", async() =>{
                try {
                    await conveyor1.setConveyorSpeed(0);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
    });

    // conveyor WoT server 
    // create Servient add HTTP binding with port configuration
    let serverConveyor2 = new Servient();
    serverConveyor2.addServer(
        new HttpServer({
            port: 9003, // set port 9002 as request
        })
    );


    // conveyor2
    serverConveyor2.start().then((WoT) => {
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
                    await conveyor2.setConveyorSpeed(0.04);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });
            // set startBeltForward action handlers
            thing.setActionHandler("startBeltForward", async() =>{
                try {
                    await conveyor2.setConveyorSpeed(-0.04);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            thing.setActionHandler("stopBelt", async() =>{
                try {
                    await conveyor2.setConveyorSpeed(0);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
    });

    // uarm WoT server 
    // create Servient add HTTP binding with port configuration
    let uarm = new Servient();
    uarm.addServer(
        new HttpServer({
            port: 9004, // set port 9004 as request
        })
    );


    // uarm
    uarm.start().then((WoT) => {
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
                    
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });
            // set startBeltForward action handlers
            thing.setActionHandler("gripClose", async() =>{
                try {
                    await uarm.setGripperstate(true);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            thing.setActionHandler("gripOpen", async() =>{
                try {
                    await uarm.setGripperstate(false);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });
            thing.setActionHandler("goWithSpeed", async(data) =>{
                try {
                    let pos:any = await data.value();
                    
                    let finalPos:Number[] = [pos["x"]/1000, pos["y"]/1000, pos["z"]/1000]; // convert to meter
                    let speed = pos["speed"];
                    //console.log(finalPos);

                    await uarm.goWithspeed(finalPos,speed);
                    
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }             
            })
            thing.setActionHandler("goHome", async() =>{
                try {
                    let pos = [0.220,0,0.1];

                    await uarm.goWithspeed(pos,2222);

                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
    });

    // dobot WoT server 
    // create Servient add HTTP binding with port configuration
    let dobot = new Servient();
    dobot.addServer(
        new HttpServer({
            port: 9005, // set port 9004 as request
        })
    );


    // dobot
    dobot.start().then((WoT) => {
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

                        await dobot.dobotMove(0.5);
                        await dobot.setJointangle([0,70,95,0]);
                        while (true){
                            distance = distance + 0.007;
                            if (await cubeDetect.objectDetect()){
                                await dobot.dobotMove(0.5-distance);
                                break;
                            }
                            await dobot.dobotMove(0.5-distance);
                            await delay(70);
                        }    
                    }

                    await dobot.setJointangle([0,15,15,0]);
        
                    await dobot.dobotMove(0.286);

                    await dobot.setJointangle([0,64,95,0]);
                
                    await dobot.setGripperstate(true);
                
                    await dobot.setJointangle([0,15,15,0]);
                
                    await dobot.dobotMove(-0.398);
                
                    await dobot.setJointangle([0,80,15,0]);
                
                    await dobot.setGripperstate(false);

                    await dobot.setJointangle([0,15,15,0]);

                    await dobot.dobotMove(0.49);
                
                    await dobot.setJointangle([0,70,95,0]);
                
                    await dobot.dobotMove(0.45);

                    await dobot.setJointangle([0,15,15,0]);

                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            thing.setActionHandler("returnCube", async() =>{
                try {
                    await dobot.setJointangle([0,15,15,0]);

                    await dobot.dobotMove(0.557);
                
                    await dobot.setJointangle([0,110,10,0]);
                
                    await dobot.setGripperstate(true);
                
                    await dobot.setJointangle([0,15,15,0]);
                
                    await dobot.dobotMove(0.49);
                
                    await dobot.setJointangle([0,63,95,0]);

                    // detect cube then slowly move
                    let distance = 0;
                    while (true){
                        distance = distance + 0.007;
                        await dobot.dobotMove(0.5-distance);
                        if (await cubeDetect.objectDetect()){
                            await dobot.dobotMove(0.5-distance-0.005);
                            break;
                        }
                        await delay(70);
                    }
                    //await dobot.dobotMove(0.47);
                
                    await dobot.setGripperstate(false);
                
                    await dobot.setJointangle([0,15,15,0]);
                    return "success";
                }
                catch{
                    console.log("failed");
                    return "failed";
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
    });

    // color sensor WoT server 
    // create Servient add HTTP binding with port configuration
    let colorSensor = new Servient();
    colorSensor.addServer(
        new HttpServer({
            port: 9006, // set port 9004 as request
        })
    );


    // color sensor
    colorSensor.start().then((WoT) => {
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

