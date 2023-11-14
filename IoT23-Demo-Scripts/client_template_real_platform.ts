import { Servient, Helpers } from '@node-wot/core';
import { HttpServer, HttpClientFactory, HttpsClientFactory } from '@node-wot/binding-http'

import { ThingDescription } from 'wot-typescript-definitions';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// virtual devices url
const devicesURLs: Record<string, string> = {
    //sensor1: "https://remotelab.esi.cit.tum.de:8081/InfraredSensor1", sensor not working, can be used again when fixed
    sensor2: "https://remotelab.esi.cit.tum.de:8081/InfraredSensor2",
    conveyor1: "https://remotelab.esi.cit.tum.de:8081/ConveyorBelt1", 
    conveyor2: "https://remotelab.esi.cit.tum.de:8081/ConveyorBelt2",
    uarm: "https://remotelab.esi.cit.tum.de:8081/uarm",
    dobot: "https://remotelab.esi.cit.tum.de:8081/DobotMagician",
    color: "https://remotelab.esi.cit.tum.de:8081/ColorSensor",
}


async function main() {
    const controller = new Servient()
    controller.addClientFactory(new HttpClientFactory());
    controller.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}))
    controller.addCredentials({
        "urn:dev:ops:32473-InfraredSensor-001": {
            username: "admin",
            password: "hunter2"
        },
        "urn:dev:ops:32473-InfraredSensor-002": {
            username: "admin",
            password: "hunter2"
        },
        "urn:dev:ops:32473-ConveyorBelt-001": {
            username: "admin",
            password: "hunter2"
        },
        "urn:dev:ops:32473-ConveyorBelt-002": {
            username: "admin",
            password: "hunter2"
        },
        "de.tum:ei:esi:uArm:192.168.0.112:8080": {
            username: "admin",
            password: "hunter2"
        },
        "de:tum:ei:esi:dobot": {
            username: "admin",
            password: "hunter2"
        },
        "de:tum:ei:esi:flora": {
            username: "admin",
            password: "hunter2"
        }
    })
    
    const wotHelper = new Helpers(controller);
    let devicesTDs: Record<string, ThingDescription> = {}
    for( const device in devicesURLs) {
        devicesTDs[device] = (await wotHelper.fetch(devicesURLs[device])) as ThingDescription
    }
    const WoT =  await controller.start();
    
    const dobot = await WoT.consume(devicesTDs.dobot)
    const uarm = await WoT.consume(devicesTDs.uarm)
    const conveyor2 =  await WoT.consume(devicesTDs.conveyor2)
    const conveyor1 =  await WoT.consume(devicesTDs.conveyor1)
    const color = await WoT.consume(devicesTDs.color)
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
    
    await controller.shutdown()
}

main();