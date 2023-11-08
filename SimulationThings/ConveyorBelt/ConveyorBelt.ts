/*
1. TM of the entity
2. Simulation Logic (websocket communication)
3. Exposed Thing Logic (node-wot)
*/

// add delay function
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import * as fs from "fs";

export class virtualConveyorBelt {
  // variable
  name: String | undefined;
  sim: any;
  conveyorHandle: Number | undefined;

  // constructor
  constructor() {}

  async startThing(sim: any, coppeliaObjectName: String, WoT: any, params: Object) {
    // read the conveyor TD file
    let conveyorTM = JSON.parse(
      fs.readFileSync(
        "../virtual_things_description/virtual_conveyorbelt/virtual_conveyor_left.td.json",
        "utf8"
      )
    );
    this.name = coppeliaObjectName;
    this.sim = sim;
    // get handle from simulation

    this.conveyorHandle = Number(await this.sim.getObject(this.name));

    WoT.produce(conveyorTM).then(async (thing: any) => {
      console.log("Produced " + thing.getThingDescription().title);

      // /ConveyorBelt1 is the scene specific handler
      await this.setConveyorSpeed(0);

      // set action handlers (using async-await)
      // set startBeltBackward action handlers
      thing.setActionHandler("startBeltBackward", async () => {
        try {
          await this.setConveyorSpeed(0.02);
          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });
      // set startBeltForward action handlers
      thing.setActionHandler("startBeltForward", async () => {
        try {
          await this.setConveyorSpeed(-0.02);
          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });

      thing.setActionHandler("stopBelt", async () => {
        try {
          await this.setConveyorSpeed(0);
          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });

      // expose the thing
      thing.expose().then(() => {
        console.info(thing.getThingDescription().title + " ready");
        console.info("TD : " + JSON.stringify(thing.getThingDescription()));
      });
    });
  }

  // get conveyorbelt info
  private async getConveyorState() {
    // this.conveyorHandle = Number(await this.sim.getObject(this.name));
    return await this.sim.readCustomTableData(this.conveyorHandle, "__state__");
  }
  //speed should be -1 to 1
  private async setConveyorSpeed(speed: Number) {
    // this.conveyorHandle = Number(await this.sim.getObject(this.name));
    await this.sim.writeCustomTableData(this.conveyorHandle, "__ctrl__", {
      vel: speed,
    });
  }
}
