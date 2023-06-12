import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory, HttpsClientFactory} from '@node-wot/binding-http'
import {Helpers} from '@node-wot/core';

import {uarmMotioncheck} from './uarmMotioncheck_class';
var path = require('path');   // for root path

import { writeFileSync, readFileSync } from 'fs';

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const uarm = JSON.parse(readFileSync("./uarm_real.json","utf-8"));

main()

async function main() {
    let Consumer = new Servient();

    Consumer.addCredentials({
        "de:tum:ei:esi:dobot": {
            username: "admin",
            password: "hunter2"
        }
    })
    Consumer.addClientFactory(new HttpClientFactory());
    Consumer.addClientFactory(new HttpsClientFactory({allowSelfSigned:true}));


    // init uarmMotioncheck instance
    let shapePath = "./robot_info/uarm_folder/uarm_shape.stl";
    let pointPath = "./robot_info/uarm_folder/uarm_data_point.csv";
    let coppeState = true;
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    console.log(rootAddress);
    let coppeScene = rootAddress + "/Uarm_TD_Verification/Virtual_IoT_lab_verification.ttt";

    let rMC = new uarmMotioncheck(shapePath,pointPath,coppeState,coppeScene);
    //[340,0,110] // behind of color sensor
    let x = 180;
    let y = 0;
    let z = 60;

    let Ptem = {
        "x":x,
        "y":y,
        "z":z       
    };

    let Ptemcheck = [x,y,z];

    let P_init = {
        "x":180,
        "y":0,
        "z":60
    };

    let state = await rMC.posSafetycheck(Ptemcheck);
    console.log(state);


    const WoT = await Consumer.start();
    let uarmThing = await WoT.consume(uarm);


    await uarmThing.invokeAction("goTo",P_init);
    await delay(3000);
    
    
    state = await rMC.posSafetycheck(Ptemcheck);
    console.log("the point access abiltiy is "+state);

    if (state["finalState"]==true){
        console.log("Safety verification, then real robot will go to position");
        //await dobotThing.invokeAction("goTo",Ptem);
    }
    
    
    


}

