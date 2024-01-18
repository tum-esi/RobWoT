import { Servient, Helpers } from '@node-wot/core';
import { HttpClientFactory, HttpsClientFactory } from '@node-wot/binding-http'
import { readFileSync } from "fs";
import { ThingDescription } from 'wot-typescript-definitions';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// TDs of Real Devices

const uarmTD = JSON.parse(
  readFileSync("../TDs/Real/Uarm.json", "utf-8")
);
const dobotTD = JSON.parse(
  readFileSync("../TDs/Real/Warehouse Dobot.json", "utf-8")
);
const conveyor1TD = JSON.parse(
  readFileSync("../TDs/Real/ConveyorBelt1.json", "utf-8")
);
const conveyor2TD = JSON.parse(
  readFileSync("../TDs/Real/ConveyorBelt2.json", "utf-8")
);
const sensor1TD = JSON.parse(
  readFileSync("../TDs/Real/InfraredSensor1.json", "utf-8")
);
const sensor2TD = JSON.parse(
  readFileSync("../TDs/Real/InfraredSensor2.json", "utf-8")
);
const colorsensorTD = JSON.parse(
  readFileSync("../TDs/Real/ColorSensor.json", "utf-8")
);


async function main() {
    const controller = new Servient()
    controller.addClientFactory(new HttpClientFactory());
    controller.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}))

    const credentials = JSON.parse(readFileSync("credential.json", "utf-8"));
    controller.addCredentials({
      "urn:dev:ops:32473-InfraredSensor-001": credentials,
      "urn:dev:ops:32473-InfraredSensor-002": credentials,
      "urn:dev:ops:32473-ConveyorBelt-001": credentials,
      "urn:dev:ops:32473-ConveyorBelt-002": credentials,
      "urn:dev:ops:32473-UArm-001": credentials,
      "de:tum:ei:esi:dobot": credentials,
      "de:tum:ei:esi:flora": credentials,
    });

    const WoT =  await controller.start();
    
    const dobot = await WoT.consume(dobotTD);
    const uarm = await WoT.consume(uarmTD);
    const conveyor2 = await WoT.consume(conveyor2TD);
    const conveyor1 = await WoT.consume(conveyor1TD);
    const color = await WoT.consume(colorsensorTD);
    // sensor1, sensor2 could not work now, so skip it

    const startPosition = {
      "x": 150,
      "y": 0,
      "z": 70
    };

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

    console.log("Starting Mashup");
    uarm.invokeAction("goTo", startPosition);
    await dobot.invokeAction("getCube");

    await delay(35000);

    await conveyor2.invokeAction("startBeltForward");

    await delay(5500);

    await conveyor2.invokeAction("stopBelt");

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
    const colorData = await color.readProperty("color");
    console.log(await colorData.value());

    
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