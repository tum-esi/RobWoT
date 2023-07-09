const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path

// for class wot client
import {makeWoTinteraction} from "../virtual_devices_WoT/clientClass";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {
    let ur3_URL = "http://localhost:8081/coppeliasim_virtualrobot_ur3";
    let ur3 = new makeWoTinteraction(ur3_URL);

    let res1 = await ur3.readProperty("getCartesianposition");
    console.log(res1);

    let res2 = await ur3.readProperty("getJointposition");
    console.log(res2);

    
    await ur3.invokeAction("moveTocartesianPosition", {"x":0.30,"y":-0.332,"z":0.5});

    await delay(5000);

    let res4 = await ur3.readProperty("getCartesianposition");
    console.log(res4);

    await ur3.invokeAction("moveTojointPosition",{"joint1":-100,"joint2":-50,"joint3":10,"joint4":15,"joint5":50,"joint6":80});
    await delay(8000);

    let res5 = await ur3.readProperty("getJointposition");
    console.log(res5);
    

}

main();