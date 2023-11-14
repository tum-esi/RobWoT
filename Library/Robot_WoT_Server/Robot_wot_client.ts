
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
    .fetch("http://localhost:8081/coppeliasim_virtualrobot_ur3_robot")
    .then(async (td: any) => {
        // using await for serial execution (note 'async' in then() of fetch())
        const WoT = await client.start();
        const thing = await WoT.consume(td);

        // -90*math.pi/180,45*math.pi/180,90*math.pi/180,135*math.pi/180,90*math.pi/180,90*math.pi/180
        await thing.invokeAction("moveTojointPosition",{"joint1":-90,"joint2":45,"joint3":90,"joint4":135,"joint5":90,"joint6":90});
        await delay(8000);
        let tem1 = (await (await thing.readProperty("getJointposition")).value()); // need to modify the dataschema in WoT
        console.log(tem1); 
        let tem2 = (await (await thing.readProperty("getCartesianposition")).value());
        console.log(tem2);
        await thing.invokeAction("moveTocartesianPosition", {"x":0.3,"y":0.5,"z":0.35});
        await delay(8000);
        let tem3 = (await (await thing.readProperty("getCartesianposition")).value());
        console.log(tem3);
        let tem4 = (await (await thing.readProperty("getJointposition")).value()); // need to modify the dataschema in WoT
        console.log(tem4); 

        
         
    })
    .catch((err) => {
        console.error("Fetch error:", err);
    });