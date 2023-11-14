// simple delay function
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import * as fs from "fs";

export class virtualConveyorBelt {
  // variable
  name: String | undefined;
  sim: any;
  conveyorHandle: Number | undefined;

  // An empty constructor
  constructor() {}

  // Real construction happens here
  async startThing(sim: any, coppeliaObjectName: String, WoT: any, params: Object) {
    
    // read the conveyor TM file
    let conveyorTM = JSON.parse(
      fs.readFileSync("ConveyorBelt.tm.json", "utf8")
    );
    
    this.name = coppeliaObjectName;
    this.sim = sim;
    
    // get handle from simulation that will be used later on
    this.conveyorHandle = Number(await this.sim.getObject(this.name));

    WoT.produce(conveyorTM).then(async (thing: any) => {
      
      console.log("Produced " + thing.getThingDescription().title);
      // Stop the simulation Thing
      await this.setConveyorSpeed(0);

      // Handle Actions invoked by the Consumers
      thing.setActionHandler("startBeltBackward", async () => {
        try {
          await this.setConveyorSpeed(0.02); // influence the simulation
          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });

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

      // expose the thing and make it interactable
      thing.expose().then(() => {
        console.info(thing.getThingDescription().title + " ready");
        console.info("TD : " + JSON.stringify(thing.getThingDescription()));
      });
    });
  }

  // These two functions call the websocket api to interact with the simulation
  
  // get conveyor belt info for using in properties
  private async getConveyorState() {
    return await this.sim.readCustomTableData(this.conveyorHandle, "__state__");
  }
  
  // Sets the speed to a value between -1 to 1, which moves the conveyor belt
  private async setConveyorSpeed(speed: Number) {
    await this.sim.writeCustomTableData(this.conveyorHandle, "__ctrl__", {
      vel: speed,
    });
  }
}
