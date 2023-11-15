import {makeWoTinteraction} from "./clientClass";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// virtual devices url
let light1URL = "http://localhost:9000/virtuallight1";
let light2URL = "http://localhost:9000/virtuallight2";
let pantilt1URL = "http://localhost:9000/pantilt1"; 
let pantilt2URL = "http://localhost:9000/pantilt2";


async function main() {
    // WoT client init
    let light1 = new makeWoTinteraction(light1URL);
    let light2 = new makeWoTinteraction(light2URL);

    let pantilt1 = new makeWoTinteraction(pantilt1URL);
    let pantilt2 = new makeWoTinteraction(pantilt2URL);

    // make interaction with lights
    /*
    await light2.writeProperty("lightState", false);
    await light1.writeProperty("lightState",false);
    await light2.writeProperty("lightColor",[1,0,0]);
    let val1 = await light1.readProperty("lightState");
    let val2 = await light2.readProperty("lightColor");
    console.log(val1,val2);
    */
    // make interaction with pantilt
    //await pantilt1.invokeAction("panTo", 90);
    //await pantilt2.invokeAction("tiltTo", -50);
    //await pantilt2.invokeAction("moveTo", {"panAngle":30, "tiltAngle":-20});
    await pantilt1.invokeAction("panContinuously");
    await delay(5000);

    await pantilt2.invokeAction("stopMovement"); // problem with stopmovement

    let pos1 = await pantilt1.readProperty("panPosition");
    let pos2 = await pantilt2.readProperty("tiltPosition");

    console.log(pos1,pos2);


    
}

main();