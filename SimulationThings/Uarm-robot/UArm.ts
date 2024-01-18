// simple delay function
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
import uarmTM from "./UArm.tm.json";

export class virtualConveyorBelt {
  // variable
  name: String | undefined;
  sim: any;
  uarmHandle: Number | undefined;
  scriptHandle: Number | undefined;
  previousPos: Number[] | undefined;

  // An empty constructor
  constructor() {}

  // Real construction happens here
  async startThing(
    sim: any,
    coppeliaObjectName: String,
    WoT: any,
    params: Object
  ) {
    this.name = coppeliaObjectName;
    this.sim = sim;
    this.uarmHandle = 0;
    this.scriptHandle = 0;
    this.previousPos = [0.22, 0, 0];

    // get handle from simulation that will be used later on
    this.uarmHandle = Number(await this.sim.getObject(this.name));

    // Change TM-specific fields for a TD input
    uarmTM["@type"] = "Thing";
    uarmTM.title = "UArm Robot Arm";

    WoT.produce(uarmTM).then(async (thing: any) => {
      console.log("Produced " + thing.getThingDescription().title);

      this.setGripperstate(false);

      // set action handlers (using async-await)
      // set startBeltBackward action handlers
      thing.setActionHandler("goTo", async (data: any) => {
        try {
          let pos: any = await data.value();

          let finalPos: number[] = [
            pos["x"] / 1000,
            pos["y"] / 1000,
            pos["z"] / 1000,
          ]; // convert to meter
          //console.log(finalPos);

          await this.goWithspeed(finalPos, 1400);

          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });
      // set startBeltForward action handlers
      thing.setActionHandler("gripClose", async () => {
        try {
          await this.setGripperstate(true);
          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });

      thing.setActionHandler("gripOpen", async () => {
        try {
          await this.setGripperstate(false);
          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });
      thing.setActionHandler("goWithSpeed", async (data: any) => {
        try {
          let pos: any = await data.value();

          let finalPos: number[] = [
            pos["x"] / 1000,
            pos["y"] / 1000,
            pos["z"] / 1000,
          ]; // convert to meter
          let speed = pos["speed"];
          //console.log(finalPos);

          await this.goWithspeed(finalPos, speed);

          return "";
        } catch {
          console.log("failed");
          return "";
        }
      });
      thing.setActionHandler("goHome", async () => {
        try {
          let pos = [0.2, 0, 0.08];

          await this.goWithspeed(pos, 1400);

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
  posParse(realPos: number[]) {
    let z = realPos[2] + 1.054;
    let x = realPos[0] + 1.157;
    let y = 1.26 * realPos[1] - 0.3;

    let finalPos = [x, y, z];
    return finalPos;
  }

  async computeAnglefromPosition(pos: Number[]) {
    this.uarmHandle = Number(await this.sim.getObject(this.name));
    this.scriptHandle = Number(
      await this.sim.getScript(1, this.uarmHandle, this.name)
    );

    let angles = await this.sim.callScriptFunction(
      "computeAnglesFromGripperPosition",
      this.scriptHandle,
      pos,
      -0.062,
      -0.01
    );

    return [angles[0][0], angles[0][1], angles[0][2], angles[0][3]];
  }

  async goTopositon(pos: Number[]): Promise<string> {
    this.uarmHandle = Number(await this.sim.getObject(this.name));
    this.scriptHandle = Number(
      await this.sim.getScript(1, this.uarmHandle, this.name)
    );
    await this.sim.callScriptFunction("goTo", this.scriptHandle, pos);
    this.previousPos = pos;
    return "success";
  }

  async goWithspeed(pos: number[], speed: number): Promise<string> {
    this.uarmHandle = Number(await this.sim.getObject(this.name));
    this.scriptHandle = Number(
      await this.sim.getScript(1, this.uarmHandle, this.name)
    );

    let finalPos = this.posParse(pos);

    await this.sim.callScriptFunction(
      "goWithspeed",
      this.scriptHandle,
      finalPos,
      speed
    ); //this is non-blocking function

    this.previousPos = pos;
    return "success";
  }

  // open or close gripper
  async setGripperstate(state: boolean) {
    this.uarmHandle = Number(await this.sim.getObject(this.name));
    this.scriptHandle = Number(
      await this.sim.getScript(1, this.uarmHandle, this.name)
    );

    await this.sim.callScriptFunction(
      "enableGripper",
      this.scriptHandle,
      state
    );
    await delay(1000);
  }

  async getCurpos(): Promise<number[]> {
    this.uarmHandle = Number(await this.sim.getObject(this.name));
    this.scriptHandle = Number(
      await this.sim.getScript(1, this.uarmHandle, this.name)
    );

    let curPos = await this.sim.callScriptFunction(
      "getCurpos",
      this.scriptHandle
    );

    curPos = curPos[0];

    return curPos;
  }
}
