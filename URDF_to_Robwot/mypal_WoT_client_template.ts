const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

// for class wot client
import {makeWoTinteraction} from "../virtual_devices_WoT/clientClass";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {
    let mypal_URL = "http://localhost:8081/coppeliasim_virtualrobot_mypal";
    let mypal = new makeWoTinteraction(mypal_URL);

    let res1 = await mypal.readProperty("getCartesianposition");
    console.log(res1);

    let res2 = await mypal.readProperty("getJointposition");
    console.log(res2);

    
    await mypal.invokeAction("moveTocartesianPosition", {"x":0.20,"y":-0.132,"z":0.3});

    await delay(5000);

    let res4 = await mypal.readProperty("getCartesianposition");
    console.log(res4);

    await mypal.invokeAction("moveTojointPosition",{"joint1":-100,"joint2":0,"joint3":10,"joint4":15,"joint5":50});
    await delay(8000);

    let res5 = await mypal.readProperty("getJointposition");
    console.log(res5);
    

}

main();