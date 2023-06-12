import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core'; 

// for reading local TD file
import * as fs from 'fs';

// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");

import {robotMotioncontrol} from "../UR10_TD_Verification/robotMotioncontrol_class" 


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


export class robotWoTserver{
    //variable
    sceneAddress:string;
    robotName:string;
    posReal:number[][];
    posVirtual:number[][];
    driverAddress:string;
    robotTDAddress:string;
    compensateVal:any;
    sim:any;

    constructor(sceneAddress:string,driverAddress:string,robotTDAddress:string,robotName:string,posReal?:number[][],posVirtual?:number[][],compensate?:any){
        this.sceneAddress = sceneAddress;
        this.driverAddress = driverAddress;
        this.robotTDAddress = robotTDAddress;
        this.robotName = robotName;
        this.sim = null;
        // init the posreal and posvirtual, for future parse
        if ((posReal != null) &&( posVirtual != null)){
            this.posReal = posReal;
            this.posVirtual = posVirtual;
        }
        else{
            this.posReal = [[1]];
            this.posVirtual = [[1]];
        }

        this.compensateVal = compensate;
    }

    async serverInit(){
        let Robot = new robotMotioncontrol(this.sceneAddress,this.robotName,this.posReal,this.posVirtual);
        await Robot.loadDrivertoRobot(this.driverAddress);
        await Robot.sceneInit();

        // robot WoT server 
        // create Servient add HTTP binding with port configuration
        let server = new Servient();
        server.addServer(
            new HttpServer({
                port: 8081, // set port 8081 as request
            })
        );

        let robotInstance = JSON.parse(fs.readFileSync(this.robotTDAddress, "utf8"));

        await server.start().then((WoT) => {
            WoT.produce(robotInstance).then(async(thing) => {
                console.log("Produced " + thing.getThingDescription().title);

                // set property handlers (using async-await)
                // set getJointposition propety handlers
                thing.setPropertyReadHandler("getJointposition", async() => 
                (await Robot.getJointpos(this.compensateVal)));
        
                // set getCartesianposition property handlers
                thing.setPropertyReadHandler("getCartesianposition", async() => 
                (await Robot.getCartpos()));
        

                // set moveTojointPosition action handlers
                thing.setActionHandler("moveTojointPosition", async(data) =>{
                    try {
                        let jointPos:any = await data.value();

                        let jointLen = Object.keys(jointPos).length;

                        let jointPosval = []

                        for (let i = 1; i <= jointLen; i++) {
                            let curJointname = "joint" + i.toString();
                            let curVal = 
                            jointPosval.push(jointPos[curJointname]*Math.PI/180);
                        }
                        //console.log(jointPosval);
                        await Robot.moveTojointpos(jointPosval);

                        await delay(200);

                        return "success";
                    }
                    catch{
                        return "failed";
                    }
                });
        
                // set moveTocartesianPosition action handlers
                thing.setActionHandler("moveTocartesianPosition", async(data) =>{
                    try {
                        let cartPos:any = await data.value();
                        let cartPosval = [cartPos["x"], cartPos["y"], cartPos["z"],0,0.707,0,0.707];
                        await Robot.moveToCartpos(cartPosval);

                        await delay(200);

                        return "success";
                    }
                    catch{
                        return "failed";
                    }
                });
        
        
                // expose the thing
                thing.expose().then(() => {
                    console.info(thing.getThingDescription().title + " ready");
                    console.info("TD : " + JSON.stringify(thing.getThingDescription()));
                });
            });
        });
    }
}