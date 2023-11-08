import { Servient } from "@node-wot/core";
import { HttpServer, HttpClientFactory } from "@node-wot/binding-http";

import { Helpers } from "@node-wot/core";

// for reading local TD file
import * as fs from "fs";

import { virtualConveyorBelt } from "../SimulationThings/ConveyorBelt/ConveyorBelt";

// load remote api for coppeliasim
const { RemoteAPIClient } = require("../remoteApi/RemoteAPIClient.js");

let virtualSceneAddress = "./IoT_remote_lab.ttt";

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

async function init(address: String) {
  const client = new RemoteAPIClient("localhost", 23050, "json");
  console.log("Connecting to CoppeliaSim Simulation...");
  await client.websocket.open();
  console.log('Getting proxy object "sim"...');
  let sim = await client.getObject("sim");

  await sim.startSimulation();

  await delay(1000);

  return sim;
}


async function main() {

    let sceneAddress:String = virtualSceneAddress; 
    console.log(sceneAddress)
    var sim = await init(sceneAddress);

    let virtualIoTlabserver = new Servient();
    virtualIoTlabserver.addServer(
        new HttpServer({
            port: 9000, // set port 9000 as request
        })
    );

    Helpers.setStaticAddress("localhost");
    

    virtualIoTlabserver.start().then((WoT) => {
        let conveyorBelt1 = new virtualConveyorBelt()
        conveyorBelt1.startThing(sim,"/ConveyorBelt1",WoT,{})
    })
}

main()