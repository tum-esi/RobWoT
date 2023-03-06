import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const uarmURL = "http://localhost:9000/virtualuarm";
const conveyor1URL = "http://localhost:9000/virtualconveyor1";


async function main(params:type) {
    let Consumer = new Servient();
    Consumer.addClientFactory(new HttpClientFactory());
    const wotHelper = new Helpers(Consumer);

    const WoT = await Consumer.start();

    const uarmTD_V:any = await wotHelper.fetch(uarmURL)
    let uarm = await WoT.consume(uarmTD)
    await uarm.invokeAction("gripOpen");
    await uarm.invokeAction("gripClose");

    await uarm.invokeAction("goTo",P1);
    await delay(6000);
    await uarm.invokeAction("goTo",P4);
    await delay(6000);
}