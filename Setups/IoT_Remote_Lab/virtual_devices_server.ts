import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core'; 

// for reading local TD file
import * as fs from 'fs';

// load remote api for coppeliasim
const { RemoteAPIClient } = require("coppelia-ws-api");

// load virtual sensor class
import {virtualSensor,virtualConveyor, virtualUarm, virtualDobot,virtualLight,virtualPanTilt} from "./virtualDevices";
import { makeWoTinteraction } from './clientClass';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


// read the virtual devices TD file
let sensorTD1 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_infrared_sensor1.td.json", "utf8"));
let sensorTD2 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_infrared_sensor2.td.json", "utf8"));

// read the conveyor TD file
let conveyorTD1 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_conveyor_left.td.json", "utf8"));
let conveyorTD2 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_conveyor_right.td.json", "utf8"));

// read the uarm TD file
let uarmTD =JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_uarm.td.json", "utf8"));

// read the dobot TD file
let dobotTD =JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_dobot.td.json", "utf8"));

// read the color sensor TD file
let colorTD =JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_color_sensor.td.json", "utf8"));

// read the spotlight TD file
let spotlightTD1 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_light_left.td.json", "utf8"));
let spotlightTD2 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_light_right.td.json", "utf8"));

// read the pantilt TD file
let pantiltTD1 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_PanTilt1.json", "utf8"));
let pantiltTD2 = JSON.parse(fs.readFileSync("../../TDs/Virtual/virtual_PanTilt2.json", "utf8"));

// set virtual scene address
//console.log(__dirname); // get current file absolute path
let virtualSceneadress = __dirname + "/IoT_remote_lab.ttt";



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
            port: 9001, // set port 9000 as request
        })
    );

    Helpers.setStaticAddress("localhost");
    

    virtualIoTlabserver.start().then((WoT) => {
        //sensor1
        WoT.produce(sensorTD1).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the coppeliasim
            let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(500);
            
            let sensor1 = new virtualSensor(sim,"/InfraredSensor1");
    
            // set property handlers (using async-await)
            // set objectPresence propety handlers
            thing.setPropertyReadHandler("objectPresence", async() => await (sensor1.objectDetect()))

            // set detectedObject event handles
            let flag = false;
            thing.setEventSubscribeHandler("detectedObject", async() => {
                setInterval(async() => {
                    let state = await (sensor1.objectDetect());
                    //console.log(state,flag);
                    // when detect object, only publish event once
                    if (state == true){
                        if (flag==false){
                            thing.emitEvent("detectedObject", true);
                            flag = true;
                        }
                    }
                    else{
                        flag = false;
                    }
                }, 1000);
            })
            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        });
        //sensor2   
        WoT.produce(sensorTD2).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the coppeliasim
            //let sceneAddress:String = virtualSceneadress; // you need to modify to your own path
            //var sim = await init(sceneAddress); // initialize scene and sim

            //await sim.startSimulation();
            //await delay(500);
            
            let sensor2 = new virtualSensor(sim,"/InfraredSensor2");
            
            // set property handlers (using async-await)
            // set objectPresence propety handlers
            thing.setPropertyReadHandler("objectPresence", async() => await (sensor2.objectDetect()))

            // set detectedObject event handles
            let flag = false;
            thing.setEventSubscribeHandler("detectedObject", async() => {
                setInterval(async() => {
                    let state = await (sensor2.objectDetect());
                    //console.log(state,flag);
                    // when detect object, only publish event once
                    if (state == true){
                        if (flag==false){
                            thing.emitEvent("detectedObject", true);
                            flag = true;
                        }
                    }
                    else{
                        flag = false;
                    }
                }, 1000);
            })
            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });
        }); 
        // conveyor1
        WoT.produce(conveyorTD1).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);
            // init the coppeliasim
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
            // init the coppeliasim
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
                    await conveyor2.setConveyorSpeed(0.03);
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
                    await conveyor2.setConveyorSpeed(-0.03);
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
            // init the coppeliasim
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
                    
                    let finalPos:number[] = [pos["x"]/1000, pos["y"]/1000, pos["z"]/1000]; // convert to meter
                    //console.log(finalPos);

                    await uarm.goWithspeed(finalPos,1400);

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
                    
                    let finalPos:number[] = [pos["x"]/1000, pos["y"]/1000, pos["z"]/1000]; // convert to meter
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
                    let pos = [0.20,0,0.08];

                    await uarm.goWithspeed(pos,1400);

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

            let dobot = new virtualDobot(sim, "/dobot");

            let cubeDetect = new virtualSensor(sim,"/cubesensor");

            dobot.setGripperstate(false);

            // set action handlers (using async-await)
            // set startBeltBackward action handlers
            // set startBeltForward action handlers
            thing.setActionHandler("getCube", async() =>{
                try {
                    let distance = 0;
                    if ((await cubeDetect.objectDetect())==false){
                        await dobot.setGripperstate(true);
                        await dobot.dobotMove(-0.62);
                        await dobot.setJointangle([0,20,60,40,55]);
                        await dobot.moveTopos([0.8345, -0.8, 1.10, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                        await dobot.moveTopos([0.8345, -0.8, 1.058, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
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
                
                    await dobot.moveTopos([0.8345, -0.58, 1.085, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
                
                    await dobot.moveTopos([0.8345, -0.58, 1.068, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
                    
                    await dobot.moveTopos([0.8345, -0.58, 1.056, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
                    
                    await dobot.setGripperstate(true);
                
                    await dobot.moveTopos([0.8345, -0.58, 1.11, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
                
                    await dobot.setJointangle([0,20,60,40,-90]);
                
                    await dobot.dobotMove(0.113); //0.112 - 0.115
                
                    await dobot.moveTopos([0.98, 0.113, 1.12, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);

                    await dobot.moveTopos([0.98, 0.113, 1.11, 2.1218905033038e-07, -1.6752026965605e-07, 0.707, 0.707]);
                    
                    await dobot.setGripperstate(false);

                    await dobot.setJointangle([0,20,60,40,0]);
                
                    await dobot.dobotMove(-0.43);

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
                    await dobot.setJointangle([0,20,60,40,-55]);

                    await dobot.setGripperstate(false);
                 
                    await dobot.dobotMove(-0.833);
                 
                    await dobot.moveTopos([0.993, -0.833, 1.2, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                                     
                    //await dobot.moveTopos([0.993, -0.833, 1.15, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                 
                    await dobot.moveTopos([0.993, -0.833, 1.12, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                 
                    await dobot.moveTopos([0.993, -0.833, 1.094, 2.1218826873337e-07, -1.6752122178332e-07, -0.70711296796799, 0.70710062980652]);
                 
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

                     await dobot.moveTopos([0.83214, -0.805+distance, 1.06, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                     
                     await dobot.setGripperstate(false);

                     await dobot.moveTopos([0.83214, -0.805+distance, 1.1, 2.1218905033038e-07, -1.6752026965605e-07, -0.70711588859558, 0.70709764957428]);
                     
                     await dobot.setJointangle([0,20,60,40,0]);
                 
                     await dobot.dobotMove(-0.43);
                 
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
        //Spotlight1
        WoT.produce(spotlightTD1).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);

            let light1 = new virtualLight(sim,"/Spotlight1");

            //// property lightState
            thing.setPropertyReadHandler("lightState", async() => await light1.getLightstate());
            thing.setPropertyWriteHandler("lightState", async(intOutput) =>{
                try{
                    let state = await intOutput.value();
                    await light1.setLightstate(Boolean(state));
                    //return ;   
                }
                catch{
                    console.log("failed");
                    //return ;         
                }
            });
            // property lightColor
            thing.setPropertyReadHandler("lightColor", async() => (await (light1.getLightinfo()))[2]);
            thing.setPropertyWriteHandler("lightColor", async(intOutput) =>{
                try{
                    let color:any = await intOutput.value();

                    await light1.setLightcolor(color);
                    //return ;   
                }
                catch{
                    console.log("failed");
                    //return ;         
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });       
        });
        //Spotlight2
        WoT.produce(spotlightTD2).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);

            let light2 = new virtualLight(sim,"/Spotlight2");

            //// property lightState
            thing.setPropertyReadHandler("lightState", async() => await light2.getLightstate());
            thing.setPropertyWriteHandler("lightState", async(intOutput) =>{
                try{
                    let state = await intOutput.value();
                    await light2.setLightstate(Boolean(state));
                    //return ;   
                }
                catch{
                    console.log("failed");
                    //return ;         
                }
            });
            // property lightColor
            thing.setPropertyReadHandler("lightColor", async() => (await (light2.getLightinfo()))[2]);
            thing.setPropertyWriteHandler("lightColor", async(intOutput) =>{
                try{
                    let color:any = await intOutput.value();

                    await light2.setLightcolor(color);
                    //return ;   
                }
                catch{
                    console.log("failed");
                    //return ;         
                }
            });

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });       
        });
        // pantilt 1
        WoT.produce(pantiltTD1).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);

            let pantilt1 = new virtualPanTilt(sim,"/pantilt_base1");

            //// property panPosition
	
            thing.setPropertyReadHandler("panPosition", async() => (await pantilt1.panPosition()));

            // property tiltPosition
            thing.setPropertyReadHandler("tiltPosition", async() => (await pantilt1.tiltPosition()));

            // action goHome
            thing.setActionHandler("goHome", async() =>{
                try {
                    await pantilt1.goHome();

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });
            // action moveTo
            thing.setActionHandler("moveTo", async(data) =>{
                try {
                    let pos:any = await data.value();
                    let finalPos = [pos["panAngle"], pos["tiltAngle"]];


                    await pantilt1.moveTo(finalPos);

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });
            
            // action panContinuously
            thing.setActionHandler("panContinuously", async() =>{
                try {
                    await pantilt1.panContinuously();

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });

            // action panTo
            thing.setActionHandler("panTo", async(data) =>{
                try {
                    let pos:any = await data.value();

                    await pantilt1.panTo(pos);

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });  
            
            // action stopMovement
            thing.setActionHandler("stopMovement", async(data) =>{
                try {
                    await pantilt1.stopMovement();

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });        
            // action tiltTo
            thing.setActionHandler("tiltTo", async(data) =>{
                try {
                    let pos:any = await data.value();

                    await pantilt1.tiltTo(pos);

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });  

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });       
        });
        // pantilt 2
        WoT.produce(pantiltTD2).then(async(thing) => {
            console.log("Produced " + thing.getThingDescription().title);

            let pantilt2 = new virtualPanTilt(sim,"/pantilt_base2");

            //// property panPosition
	
            thing.setPropertyReadHandler("panPosition", async() => (await pantilt2.panPosition()));

            // property tiltPosition
            thing.setPropertyReadHandler("tiltPosition", async() => (await pantilt2.tiltPosition()));

            // action goHome
            thing.setActionHandler("goHome", async() =>{
                try {
                    await pantilt2.goHome();

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });
            // action moveTo
            thing.setActionHandler("moveTo", async(data) =>{
                try {
                    let pos:any = await data.value();
                    let finalPos = [pos["panAngle"], pos["tiltAngle"]];


                    await pantilt2.moveTo(finalPos);

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });
            
            // action panContinuously
            thing.setActionHandler("panContinuously", async() =>{
                try {
                    await pantilt2.panContinuously();

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });

            // action panTo
            thing.setActionHandler("panTo", async(data) =>{
                try {
                    let pos:any = await data.value();

                    await pantilt2.panTo(pos);

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });  
            
            // action stopMovement
            thing.setActionHandler("stopMovement", async(data) =>{
                try {
                    await pantilt2.stopMovement();

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });        
            // action tiltTo
            thing.setActionHandler("tiltTo", async(data) =>{
                try {
                    let pos:any = await data.value();

                    await pantilt2.tiltTo(pos);

                    return undefined;
                }
                catch{
                    console.log("failed");
                    return undefined;
                }
            });  

            // expose the thing
            thing.expose().then(() => {
                console.info(thing.getThingDescription().title + " ready");
                console.info("TD : " + JSON.stringify(thing.getThingDescription()));
            });       
        });



    });

}

main()

