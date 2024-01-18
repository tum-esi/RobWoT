import { readFileSync } from "fs";
import { Servient } from "@node-wot/core";
import { HttpClientFactory, HttpsClientFactory } from "@node-wot/binding-http";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// virtual devices TDs

const uarmTD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_uarm.td.json", "utf-8"));
const dobotTD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_dobot.td.json", "utf-8"));
const conveyor1TD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_conveyor_right.td.json", "utf-8"));
const conveyor2TD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_conveyor_left.td.json", "utf-8"));
const sensor1TD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_infrared_sensor1.td.json", "utf-8"));
const sensor2TD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_infrared_sensor2.td.json", "utf-8"));
const colorsensorTD_V = JSON.parse(readFileSync("../TDs/Virtual/virtual_color_sensor.td.json", "utf-8"));

async function main() {
  
  let Consumer = new Servient();
  Consumer.addClientFactory(new HttpClientFactory());
  Consumer.addClientFactory(new HttpsClientFactory());
  const WoT = await Consumer.start();
  // Consume Things
  const uarm = await WoT.consume(uarmTD_V);
  const dobot = await WoT.consume(dobotTD_V);
  const conveyor1 = await WoT.consume(conveyor1TD_V);
  const conveyor2 = await WoT.consume(conveyor2TD_V);
  const infraredSensor1 = await WoT.consume(sensor1TD_V);
  const infraredSensor2 = await WoT.consume(sensor2TD_V);
  const colorSensor = await WoT.consume(colorsensorTD_V);

  const startPosition = {
    x: 150,
    y: 0,
    z: 70,
  };

  let P1 = {
    x: 192,
    y: 192,
    z: 87,
  };
  let P4 = {
    x: 192,
    y: 192,
    z: 52,
  };
  let P2 = {
    x: 200,
    y: -200,
    z: 90,
  };
  let P3 = {
    x: 180,
    y: 0,
    z: 60,
  };
  let P5 = {
    x: 200,
    y: 0,
    z: 80,
  };
  let P6 = {
    x: 200,
    y: -200,
    z: 70,
  };

  console.log("Starting Mashup");
  
  uarm.invokeAction("goTo", startPosition);

  await dobot.invokeAction("getCube");

  await delay(10000);

  await conveyor1.invokeAction("startBeltForward");

  while (true) {
    const sensor2Read = await infraredSensor2.readProperty("objectPresence");
    if (await sensor2Read.value() == true) {
      await delay(500);
      await conveyor1.invokeAction("stopBelt");
      break;
    }
    await delay(800);
  }

  await uarm.invokeAction("gripOpen");
  await uarm.invokeAction("goTo", P1);
  await delay(6000);
  await uarm.invokeAction("goTo", P4);
  await delay(6000);
  await uarm.invokeAction("gripClose");
  await delay(4000);
  await uarm.invokeAction("goTo", P1);
  await delay(4000);
  await uarm.invokeAction("goTo", P3);
  await delay(4000);

  const colorRead = await colorSensor.readProperty("color");
  console.log("current color RGB is");
  console.log(await colorRead.value());

  await delay(2000);
  await uarm.invokeAction("goTo", P2);
  await delay(4000);
  await uarm.invokeAction("goTo", P6);
  await delay(4000);
  await uarm.invokeAction("gripOpen");
  await delay(4000);
  await uarm.invokeAction("goTo", P5);
  await delay(4000);

  await conveyor2.invokeAction("startBeltBackward");
  while (true) {
    const sensor1Read = await infraredSensor1.readProperty("objectPresence");
    if (await sensor1Read.value() == true) {
      await delay(600);
      await conveyor2.invokeAction("stopBelt");
      break;
    }
    await delay(1500);
  }

  await delay(4000);

  await dobot.invokeAction("returnCube");
}

main();
