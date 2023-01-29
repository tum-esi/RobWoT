
import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core'; 

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


//----------------------Here is the test client------------------------------------
//If you want to use your own test client, you can remove this part

// create Servient and add HTTP binding
let client = new Servient();
client.addClientFactory(new HttpClientFactory());

let wotHelper = new Helpers(client);
wotHelper
    .fetch("http://localhost:8080/virtual-robot-description-ur4")
    .then(async (td: any) => {
        // using await for serial execution (note 'async' in then() of fetch())
        const WoT = await client.start();
        const thing = await WoT.consume(td);

        //let tem1 = (await (await thing.readProperty("getJointposition")).value()); // need to modify the dataschema in WoT
        //console.log(tem1); 
        //let tem2 = (await (await thing.readProperty("getCartesianposition")).value());
        //thing.writeProperty()
        await thing.invokeAction("moveTocartesianPosition", {"x":0.2,"y":0.4,"z":0.25});
        await delay(5000);
        await thing.invokeAction("moveToinitialPosition");
        await delay(5000);
         
    })
    .catch((err) => {
        console.error("Fetch error:", err);
    });