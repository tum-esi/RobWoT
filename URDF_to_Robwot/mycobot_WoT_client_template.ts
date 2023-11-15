const { RemoteAPIClient } = require("coppelia-ws-api");
var path = require('path');   // for root path

// for class wot client
import {makeWoTinteraction} from "../virtual_devices_WoT/clientClass";


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


async function main() {
    let mycobot_URL = "http://localhost:8081/coppeliasim_virtualrobot_mycobot280";
    let mycobot280 = new makeWoTinteraction(mycobot_URL);

    let res1 = await mycobot280.readProperty("getCartesianposition");
    console.log(res1);

    let res2 = await mycobot280.readProperty("getJointposition");
    console.log(res2);

    
    await mycobot280.invokeAction("moveTocartesianPosition", {"x":-0.125,"y":0.225,"z":0.29});

    await delay(5000);

    let res4 = await mycobot280.readProperty("getCartesianposition");
    console.log(res4);

    //await mycobot280.invokeAction("moveTojointPosition",{"joint1":0,"joint2":-30,"joint3":40,"joint4":135,"joint5":20,"joint6":0});
    //await delay(8000);

    let res5 = await mycobot280.readProperty("getJointposition");
    console.log(res5);
    

}

main();