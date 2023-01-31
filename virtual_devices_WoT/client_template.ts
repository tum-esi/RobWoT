import {makeWoTinteraction} from "./clientClass";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// virtual devices url
let sensor1URL = "http://localhost:9000/virtualsensor1";
let sensor2URL = "http://localhost:9001/virtualsensor2";
let conveyor1URL = "http://localhost:9002/virtualconveyor1"; 
let conveyor2URL = "http://localhost:9003/virtualconveyor2";
let uarmURL = "http://localhost:9004/virtualuarm";
let dobotURL = "http://localhost:9005/virtualdobot";
let colorURL = "http://localhost:9006/virtualcolorsensor";

async function main() {
    // WoT client init
    let sensor1 = new makeWoTinteraction(sensor1URL);
    let sensor2 = new makeWoTinteraction(sensor2URL);

    let conveyor1 = new makeWoTinteraction(conveyor1URL);
    let conveyor2 = new makeWoTinteraction(conveyor2URL);

    let uarm = new makeWoTinteraction(uarmURL);

    let dobot = new makeWoTinteraction(dobotURL);

    let color = new makeWoTinteraction(colorURL);

    await dobot.invokeAction("getCube");

    await delay(22000);

    await conveyor2.invokeAction("startBeltForward");

    while (true){
        if (await sensor2.readProperty("sensorState") == true){
            await conveyor2.invokeAction("stopBelt");
            break
        }
        await delay(1500);
    }

    let P1 = {
        "x":193,
        "y":193,
        "z":70
    };
    let P4 = {
        "x":195,
        "y":195,
        "z":52
    };
    let P2 = {
        "x":200,
        "y":-200,
        "z":90
    };
    let P3 = {
        "x":180,
        "y":0,
        "z":60  
    };
    let P5 = {
        "x":200,
        "y":0,
        "z":80  
    };
    
    await uarm.invokeAction("gripOpen");
    await uarm.invokeAction("goTo",P1);
    await delay(6000);
    await uarm.invokeAction("goTo",P4);
    await delay(6000);
    await uarm.invokeAction("gripClose");
    await delay(4000);
    await uarm.invokeAction("goTo",P1);
    await delay(4000);
    await uarm.invokeAction("goTo",P3);
    await delay(6000);

    console.log("current color RGB is");
    console.log(await color.readProperty("color"));

    await delay(2000);
    await uarm.invokeAction("goTo",P2);
    await delay(4000);
    await uarm.invokeAction("gripOpen");
    await delay(4000);
    await uarm.invokeAction("goTo",P5);
    
    await delay(4000);

    await conveyor1.invokeAction("startBeltBackward");
    while (true){
        if (await sensor1.readProperty("sensorState") == true){
            await conveyor1.invokeAction("stopBelt");
            break
        }
        await delay(1500);
    } 

    await delay(4000);

    await dobot.invokeAction("returnCube");
}

main();