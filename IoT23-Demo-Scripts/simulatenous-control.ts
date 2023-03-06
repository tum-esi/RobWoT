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
const conveyor1URL_V = "http://192.168.48.73:9000/virtualconveyor1";
const uarmTD_R = JSON.parse(readFileSync("Real-Devices-TDs/Uarm.json","utf-8"))
const conveyor1TD_R = JSON.parse(readFileSync("Real-Devices-TDs/ConveyorBelt1.json","utf-8"))


main()

async function main() {
    let Consumer = new Servient();
    Consumer.addCredentials({
        "urn:dev:ops:32473-ConveyorBelt-001": {
            username: "admin",
            password: "hunter2"
        },
        "urn:dev:ops:32473-UArm-001": {
            username: "admin",
            password: "hunter2"
        }
    })
    Consumer.addClientFactory(new HttpClientFactory());
    Consumer.addClientFactory(new HttpsClientFactory());
    const wotHelper = new Helpers(Consumer);

    const WoT = await Consumer.start();
    console.log("test0")
    // const conveyor1TD_V:any = await wotHelper.fetch(conveyor1URL_V)
    // const uarmTD_V:any = await wotHelper.fetch(uarmURL_V)
    // console.log("test1")
    let uarm_V = await WoT.consume(uarmTD_V)
    let uarm_R = await WoT.consume(uarmTD_R)
    // let conveyor1_V = await WoT.consume(conveyor1TD_V)
    let conveyor1_R = await WoT.consume(conveyor1TD_R)

    // await delay(3000)
    uarm_V.invokeAction("gripOpen");
    uarm_R.invokeAction("gripOpen");
    // await uarm_V.invokeAction("gripClose");

    // await uarm_V.invokeAction("goTo",P1);

}
