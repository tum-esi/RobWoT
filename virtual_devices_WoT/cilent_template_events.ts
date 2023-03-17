import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory, HttpsClientFactory} from '@node-wot/binding-http'
import {Helpers} from '@node-wot/core';

import { writeFileSync, readFileSync } from 'fs';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const sensor1 = JSON.parse(readFileSync("../virtual_things_description/virtual_infrared_sensor/virtual_infrared_sensor1.td.json","utf-8"));
const sensor2 = JSON.parse(readFileSync("../virtual_things_description/virtual_infrared_sensor/virtual_infrared_sensor2.td.json","utf-8"));
const conveyor1 = JSON.parse(readFileSync("../virtual_things_description/virtual_conveyorbelt/virtual_conveyor_left.td.json","utf-8"));
const conveyor2 = JSON.parse(readFileSync("../virtual_things_description/virtual_conveyorbelt/virtual_conveyor_right.td.json","utf-8"));

const colorSensor = JSON.parse(readFileSync("../virtual_things_description/virtual_color_sensor/virtual_color_sensor.td.json","utf-8"));
const dobot = JSON.parse(readFileSync("../virtual_things_description/virtual_robot/virtual_dobot.td.json","utf-8"));
const uarm = JSON.parse(readFileSync("../virtual_things_description/virtual_robot/virtual_uarm.td.json","utf-8"));
main()

async function main() {
    let Consumer = new Servient();

    Consumer.addClientFactory(new HttpClientFactory());
    Consumer.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}));

    const WoT = await Consumer.start();
    let sensor1Thing = await WoT.consume(sensor1);
    let sensor2Thing = await WoT.consume(sensor2);
    let conveyor1Thing = await WoT.consume(conveyor1);
    let conveyor2Thing = await WoT.consume(conveyor2);
    let colorSensorThing = await WoT.consume(colorSensor);
    let uarmThing = await WoT.consume(uarm);
    let dobotThing = await WoT.consume(dobot);

    let P1 = {
        "x":192,
        "y":192,
        "z":70
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
    //await conveyor1Thing.invokeAction("stopBelt");
    
    await dobotThing.invokeAction("getCube");

    await delay(1000);

    await conveyor2Thing.invokeAction("startBeltForward");

    await sensor2Thing.subscribeEvent("detectedObject", async(data) =>{
        await delay(700);
        await conveyor2Thing.invokeAction("stopBelt");
        console.log(await data.value());
        console.log("Cube detected, uarm will move cube to the colorsensor and put it in the another conveyor belt");
        await delay(1000);

        await uarmThing.invokeAction("gripOpen");
        await uarmThing.invokeAction("goTo",P1);
        await delay(6000);
        await uarmThing.invokeAction("goTo",P4);
        await delay(6000);
        await uarmThing.invokeAction("gripClose");
        await delay(4000);
        await uarmThing.invokeAction("goTo",P1);
        await delay(4000);
        await uarmThing.invokeAction("goTo",P3);
        await delay(4000);
    
        console.log("current color RGB is");
        console.log(await ((await colorSensorThing.readProperty("color")).value()));
    
        await delay(2000);
        await uarmThing.invokeAction("goTo",P2);
        await delay(4000);
        await uarmThing.invokeAction("goTo",P6);
        await delay(4000);
        await uarmThing.invokeAction("gripOpen");
        await delay(4000);
        await uarmThing.invokeAction("goTo",P5);
        await delay(4000);
        await conveyor1Thing.invokeAction("startBeltBackward");
    })

    await sensor1Thing.subscribeEvent("detectedObject", async(data) =>{
        await delay(700);
        await conveyor1Thing.invokeAction("stopBelt");
        console.log(await data.value());
        console.log("Cube detected, return the cube");
        await delay(1000);
        await dobotThing.invokeAction("returnCube");
    })
    
    



}