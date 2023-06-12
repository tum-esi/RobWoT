import {makeWoTinteraction} from "../virtual_devices_WoT/clientClass";

import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory, HttpsClientFactory} from '@node-wot/binding-http'

import { writeFileSync, readFileSync } from 'fs';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// virtual devices url
let sensor1URL = "https://remotelab.esi.cit.tum.de:8081/InfraredSensor1";
let sensor2URL = "https://remotelab.esi.cit.tum.de:8081/InfraredSensor2";
let conveyor1URL = "https://remotelab.esi.cit.tum.de:8081/ConveyorBelt1"; 
let conveyor2URL = "https://remotelab.esi.cit.tum.de:8081/ConveyorBelt2";
let uarmURL = "https://remotelab.esi.cit.tum.de:8081/uarm";
let dobotURL = "https://remotelab.esi.cit.tum.de:8081/DobotMagician";
let colorURL = "https://remotelab.esi.cit.tum.de:8081/ColorSensor";

async function main() {
    // WoT client init
    let sensor1:any = new makeWoTinteraction(sensor1URL,{
        "urn:dev:ops:32473-InfraredSensor-001": {
            username: "admin",
            password: "hunter2"
        }
    }); // sensor1 URL can not work

    let sensor2 = new makeWoTinteraction(sensor2URL,{
        "urn:dev:ops:32473-InfraredSensor-002": {
            username: "admin",
            password: "hunter2"
        }
    });

    let conveyor1 = new makeWoTinteraction(conveyor1URL,{
        "urn:dev:ops:32473-ConveyorBelt-001": {
            username: "admin",
            password: "hunter2"
        }
    });
    let conveyor2 = new makeWoTinteraction(conveyor2URL,{
        "urn:dev:ops:32473-ConveyorBelt-002": {
            username: "admin",
            password: "hunter2"
        }
    });

    let uarm = new makeWoTinteraction(uarmURL,{
        "de.tum:ei:esi:uArm:192.168.0.112:8080": {
            username: "admin",
            password: "hunter2"
        }
    });

    let dobot:any = new makeWoTinteraction(dobotURL,{
        "de:tum:ei:esi:dobot": {
            username: "admin",
            password: "hunter2"
        }
    }); // dobot URL can not work

    let color = new makeWoTinteraction(colorURL,{
        "de:tum:ei:esi:flora": {
            username: "admin",
            password: "hunter2"
        }
    });

    // dobot URL can not be accessed, so use local dobot TD
    let Consumer = new Servient();

    Consumer.addCredentials({
        "urn:dev:ops:32473-InfraredSensor-001": {
            username: "admin",
            password: "hunter2"
        },
        "de:tum:ei:esi:dobot": {
            username: "admin",
            password: "hunter2"
        }
    })
    Consumer.addClientFactory(new HttpClientFactory());
    Consumer.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}));

    const WoT = await Consumer.start();

    const dobotTD= JSON.parse(readFileSync("../Real-Devices-TDs/Warehouse Dobot.json","utf-8"));

    dobot = await WoT.consume(dobotTD)

    // sensor1, sensor2 could not work now, so skip it
    
    // device check
    //await dobot.invokeAction("calibrateDevice");

    
    await dobot.invokeAction("getCube");
    
    await delay(35000);

    await conveyor2.invokeAction("startBeltForward");

    await delay(5500);
    
    await conveyor2.invokeAction("stopBelt");


    let P1 = {
        "x":192,
        "y":192,
        "z":87
    };
    let P4 = {
        "x":192,
        "y":192,
        "z":52
    };
    let P2 = {
        "x":200,
        "y":-200,
        "z":90
    };
    let P3 = {
        "x":180,
        "y":0,
        "z":60  
    };
    let P5 = {
        "x":200,
        "y":0,
        "z":80  
    };
    let P6 = {
        "x":200,
        "y":-200,
        "z":70
    };

    await uarm.invokeAction("gripOpen");
    await uarm.invokeAction("goTo",P1);
    await delay(6000);
    await uarm.invokeAction("goTo",P4);
    await delay(6000);
    await uarm.invokeAction("gripClose");
    await delay(4000);
    await uarm.invokeAction("goTo",P1);
    await delay(4000);
    await uarm.invokeAction("goTo",P3);
    await delay(6000);

    console.log("current color RGB is");
    console.log(await color.readProperty("color"));

    
    await delay(12000);
    await uarm.invokeAction("goTo",P2);
    await delay(4000);
    await uarm.invokeAction("goTo",P6);
    await delay(4000);
    await uarm.invokeAction("gripOpen");
    await delay(4000);
    await uarm.invokeAction("goTo",P5);
    await delay(4000);

    await conveyor1.invokeAction("startBeltForward");

    await delay(9000);
    await conveyor1.invokeAction("stopBelt");

    await delay(4000);
    
    await dobot.invokeAction("returnCube");
    

    
}

main();