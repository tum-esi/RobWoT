import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory, HttpsClientFactory} from '@node-wot/binding-http'
import {Helpers} from '@node-wot/core';

import { writeFileSync, readFileSync } from 'fs';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const P1 = {
    "x":192,
    "y":192,
    "z":70
};

// const uarmURL_V = "http://192.168.48.73:9000/virtualuarm";
const uarmTD_V = JSON.parse(readFileSync("virtual_things_description/virtual_robot/virtual_uarm.td.json","utf-8"))
const conveyor1TD_V = JSON.parse(readFileSync("virtual_things_description/virtual_conveyorbelt/virtual_conveyor_right.td.json","utf-8"))
const uarmTD_R = JSON.parse(readFileSync("Real-Devices-TDs/Uarm.json","utf-8"))
const conveyor1TD_R = JSON.parse(readFileSync("Real-Devices-TDs/ConveyorBelt2.json","utf-8"))

main()

async function main() {
    let Consumer = new Servient();

    Consumer.addCredentials({
        "urn:dev:ops:32473-ConveyorBelt-002": {
            username: "admin",
            password: "hunter2"
        },
        "urn:dev:ops:32473-UArm-001": {
            username: "admin",
            password: "hunter2"
        }
    })
    Consumer.addClientFactory(new HttpClientFactory());
    Consumer.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}));

    const WoT = await Consumer.start();
    let uarm_V = await WoT.consume(uarmTD_V)
    let uarm_R = await WoT.consume(uarmTD_R)
    let conveyor1_V = await WoT.consume(conveyor1TD_V)
    let conveyor1_R = await WoT.consume(conveyor1TD_R)

    await delay(3000)
    uarm_V.invokeAction("gripOpen");
    uarm_R.invokeAction("gripOpen");

    await delay(3000)
    uarm_R.invokeAction("gripClose");
    uarm_V.invokeAction("gripClose");

    await delay(3000)
    conveyor1_V.invokeAction("startBeltBackward");
    conveyor1_R.invokeAction("startBeltBackward");

    await delay(3000)
    conveyor1_V.invokeAction("stopBelt");
    conveyor1_R.invokeAction("stopBelt");
    // await uarm_V.invokeAction("goTo",P1);

}