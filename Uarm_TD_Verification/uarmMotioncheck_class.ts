// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path
const parseSTL = require("parse-stl");  // parse the stl file binary

// for reading local file
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


export class uarmMotioncheck{
    // variable
    coppeliasimSupport:boolean; // check if needs to connect with coppeliasim
    coppeliasimScene:string;
    dataPointfilepath:string;
    workShapefilepath:string;
    robotName:string;
    sim:any;

    jsonSTL:any;
    csvArray:string[][]; // csv file to array is quite special situation....

    constructor(workShapepath:string,dataPointpath:string, coppeliasimSupportstate:boolean,coppeliasimScene:string){
        this.workShapefilepath = workShapepath;
        this.dataPointfilepath = dataPointpath;
        this.coppeliasimSupport = coppeliasimSupportstate;
        this.coppeliasimScene = coppeliasimScene;
        this.robotName = "/uarm";
        this.sim = null;

        // read data value from data point and convert it to array
        let csvContent = fs.readFileSync(this.dataPointfilepath, "utf8");
        this.csvArray = csvContent.split("\n").map(function (line) {
            return line.split(",");
        });

        // read shape from stl file and convert it to object
        let stlContent = fs.readFileSync(this.workShapefilepath, "utf8")
        this.jsonSTL = parseSTL(stlContent);

    }
    // check the position format, make sure it is correct
    private posCheck(pos:number[]):any{
        if (pos.length == 3){
            return [pos[0],pos[1],pos[2], 0, 0, -0.70711588859558, 0.70709764957428];
        }
        else if (pos.length == 7){
            return pos;
        }
        else{
            return "invalid position";
        }
    }
    // check if the point in shape
    private pointInworkshape(pos:number[]){
        let posArray = this.jsonSTL["positions"];
        let cellsArray = this.jsonSTL["cells"];
        let normalsArray = this.jsonSTL["faceNormals"];

        let count = 0;
        for (let index = 0; index < normalsArray.length; index++) {
            let curNormals = normalsArray[index];
            let curCell = cellsArray[index];
        
            let curPosinplane:number[] = [];
        
            // there are three points in this plane, just use average value of three points, which is also located in this plane
            let posX = posArray[curCell[0]][0] + posArray[curCell[1]][0] + posArray[curCell[2]][0];
            let posY = posArray[curCell[0]][1] + posArray[curCell[1]][1] + posArray[curCell[2]][1];
            let posZ = posArray[curCell[0]][2] + posArray[curCell[1]][2] + posArray[curCell[2]][2];
        
        
            curPosinplane = [posX/3, posY/3, posZ/3];
            //console.log(curPosinplane);
            let vector = [pos[0]-curPosinplane[0], pos[1]-curPosinplane[1], pos[2]-curPosinplane[2]];
        
            //console.log(vector);
            let dotVal = vector[0]*curNormals[0] + vector[1]*curNormals[1] + vector[2]*curNormals[2];
            //console.log(dotVal)
        
            //console.log(dotVal);
            if (dotVal < 0){
                count++;
            }
        }
        //console.log(count,normalsArray.length);
        if (count==normalsArray.length){
            console.log("the point is in the inside of robotic working shape");

            return true;
        }
        else if(count<normalsArray.length){
            console.log("the point is in the outside of robotic working shape");

            return false;            
        }
    }
    // check if the point in the point cloud
    private pointIncloud(pos:number[]){
        let dataPointarray = this.csvArray;

        let indexSet:number[] = [];
        let count = 0;
        let collisionCount = 0;
        let nonCollisioncount = 0;
        let distanceInterval = 0; //5cm accuracy

        // get the interval of working space again
        let maxValposX = Number(dataPointarray[1][0]);
        let maxValnegX = Number(dataPointarray[1][0]);
        let maxValposY = Number(dataPointarray[1][1]);
        let maxValnegY = Number(dataPointarray[1][1]);
        let maxValposZ = Number(dataPointarray[1][2]);
        let maxValnegZ = Number(dataPointarray[1][2]);

        // check csv array, try to find the max,min val in x,y,z based on not collision points
        for (let i = 1; i < dataPointarray.length-1; i++){
            let curStrarray = dataPointarray[i];
            for (let j = 0; j < curStrarray.length-1; j++) {
                let curState = Number(dataPointarray[i][3]);
                // only calculate the not collision points
                if (curState == 1){
                    if (j == 0){
                        let curVal = Number(dataPointarray[i][j]);
                        if (curVal>maxValposX){
                            maxValposX = curVal;
                        }
                        else if (curVal<maxValnegX){
                            maxValnegX = curVal;
                        }
                    }
                    else if (j == 1){
                        let curVal = Number(dataPointarray[i][j]);
                        if (curVal>maxValposY){
                            maxValposY = curVal;
                        }
                        else if (curVal<maxValnegY){
                            maxValnegY = curVal;
                        }
                    }
                    else if (j == 2){
                        let curVal = Number(dataPointarray[i][j]);
                        if (curVal > maxValposZ){
                            maxValposZ = curVal;
                        }
                        else if (curVal < maxValnegZ){
                            maxValnegZ = curVal;
                        }
                    }
                }
            } 
        }
        let extremeVal = [maxValnegX,maxValposX,maxValnegY,maxValposY,maxValnegZ,maxValposZ];
        let maxCoordinate:number[] = [];
        // according to the extreme value to estimate the distance interval
        for (let i = 0; i < 3; i++) {
            let curMax = Math.max(extremeVal[i], extremeVal[i+1]);
            maxCoordinate.push(curMax);
        }
        //console.log(maxCoordinate);
        distanceInterval = 0.1 * Math.sqrt(Math.pow(maxCoordinate[0],2) + Math.pow(maxCoordinate[1],2) + Math.pow(maxCoordinate[2],2));

        //console.log(distanceInterval);


        for (let i = 1; i < dataPointarray.length; i++){
            let curStrarray = dataPointarray[i];

            if (curStrarray.length>0){
                let curX = Number(curStrarray[0]);
                let curY = Number(curStrarray[1]);
                let curZ = Number(curStrarray[2]);

                //console.log(Math.pow(pos[0]-curX,2));
    
                let curPointdistance = Math.sqrt(Math.pow(pos[0]-curX,2) + Math.pow(pos[1]-curY,2) + Math.pow(pos[2]-curZ,2));
                //console.log(curPointdistance);
                if (curPointdistance <= distanceInterval){
                    let curState =  Number(curStrarray[3]);
                    if (curState == 1){
                        nonCollisioncount = nonCollisioncount + 1; // not collision
                    }
                    else if(curState == 0){
                        collisionCount = collisionCount + 1; // collision
                    }
                    count = nonCollisioncount;
                    indexSet.push(i); // get the index set which indicates the points in target area
                }               
            }
        }
        console.log(count);
        //console.log(collisionCount);
        // assume at least 6 points in this target area
        if (count>=10){
            let state = true;
            let collisionProbability = collisionCount / (collisionCount + nonCollisioncount);

            return {"Point accessible":state,"Probability of collision": collisionProbability};

        }else {
            let state= false;

            return {"Point accessible":state,"Probability of collision": "invalid position"};
        }
    }

    // scene initialization in coppeliasim
    private async sceneInit(sceneAddress:string):Promise<any>{
        const client = new RemoteAPIClient('localhost', 23050,'json');
        console.log("connect with coppeliasim");
        await client.websocket.open();
        let sim = await client.getObject('sim');
        console.log('Getting proxy object "sim"...');

        // check the simulation state
        let simState =  Number(await sim.getSimulationState());

        // the simulation is running, do nothing
        if (simState == Number(await sim.simulation_advancing_running)){

        }
        else if(simState == Number(await sim.simulation_stopped)){
            // if the simulation is not running, the load the CoppeliaSim scene
            await sim.loadScene(sceneAddress);
            // after load scene, begin to simulation
            await sim.startSimulation();
        }

        return sim;
    }

    // the position value can be [x,y,z] or [x,y,z,dx,dy,dz,R]
    async posSafetycheck(position:number[]):Promise<any> {
        var finalState = true;
        // first check if it needs coppeliasim
        if (this.coppeliasimSupport == true){
            let pos = this.posCheck(position); // check the format of position, make sure it is correct

            if (typeof pos == "string"){
                console.log(pos); // if return value is string, return "invalid position"

                return {"state":"invalid position"};
            }
            else{
                let shapeState = this.pointInworkshape(pos); // check if the point in the working space
                //console.log(shapeState);
                let cloudState = this.pointIncloud(pos); // check if the point in the point cloud
                //console.log(cloudState);

                if ((shapeState==true)&&(cloudState["Point accessible"]==true)){
                    console.log("Then check point safety in coppeliasim");
                    let sim:any;
                    // now check everything in the copperliasim
                    if (this.sim == null){
                        sim = await this.sceneInit(this.coppeliasimScene);
                        this.sim = sim;
                    }
                    else{
                        sim = this.sim;
                    }
    
                    let objectHandle = Number(await sim.getObject(this.robotName));
                    let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));
                    
                    // ---------------------------------------------------------------------------------------
                    // position convert part
                    // in the uarm, needs to convert the position based on coppeliasim coordinates
                    let z = (pos[2] + 30) / 1000;
                    let x = (-pos[0] + 120) / 1000;
                    let y = 0;
                    if (pos[1]>0){
                        y = - (pos[1] + 45) / 1000;
                    }
                    else if(pos[1]<0){
                        y = - (pos[1] - 45) / 1000;
                    }
                    let finalPos = [x,y,z];
                    // ---------------------------------------------------------------------------------------


                    let speed = 800;
                    console.log(finalPos);
    
                    let coppCollState = false; // set collision state in coppeliasim, for further judgement
    
                    let previousPos = await sim.callScriptFunction("getCurpos", robotScripthandle);
                    previousPos = previousPos[0];
                    //console.log(previousPos);
    
                    let Anglestate = await sim.callScriptFunction("moveWithspeed", robotScripthandle,finalPos,speed);
                    // ik get solution
                    if (Anglestate == "success"){
                        while (true){
                            let systemState = await sim.callScriptFunction("check", robotScripthandle);
        
                            let collState = await sim.callScriptFunction("collisionCheck", robotScripthandle);
                            //console.log(collState);
                            //console.log(state);
                            // means collision happened
                            if (collState[0]==true){
                                coppCollState = collState[0];
                                // make the robot go to previous position if collision happened
                                console.log("collision happened!");
                                await sim.callScriptFunction("moveWithspeed", robotScripthandle,previousPos,speed);
                                console.log("go to the previous position!");
                                while (true){
                                    let systemState = await sim.callScriptFunction("check", robotScripthandle);
                                    await delay(300);
                                    // means motion is successfully finished
                                    if (systemState[0]==3){
                                        break;
                                    }
                                }
        
                                break;                 
                            }
                            await delay(200);
                            // means motion is successfully finished
                            if (systemState[0]==3){
                                console.log("motion finished");
                                // try to compare the target positon and current positon
                                // if big difference, consider this point is hard to reach
                                let curPos = await sim.callScriptFunction("getCurpos", robotScripthandle);
                                curPos = curPos[0];
                                console.log(curPos);
                                let count = 0;
                                for (let i = 0; i < 3; i++) {
                                    let curVal = Math.abs(curPos[i] - finalPos[i])/Math.abs(finalPos[i]);
                                    if (curVal >= 0.25){
                                        count = count + 1;
                                    }
                                }
                                // if x,y,z of two has great difference, means it is impossible to reach the target point
                                if (count >= 2){
                                    finalState = false;
                                    console.log("Exists great difference between target position")
                                    await sim.callScriptFunction("moveWithspeed", robotScripthandle,previousPos,speed);
                                    console.log("go to the previous position!");
                                }
                                break;
                            }
                        }

                        if (coppCollState==true){
                            finalState = false; // means it exists collision
                        }
                        return {"state":finalState,"Probability of collision": cloudState["Probability of collision"]};
                    }
                    // there many reasons that Ik don't get solution, here we just assume it means the point isn't accessible
                    else if(Anglestate == "failed"){
                        console.log("This Motion is impossible");
                        finalState = false;
                        return {"state":finalState,"Probability of collision": cloudState["Probability of collision"]};
                    }
                    
                }
                else{
                    finalState = false;

                    return {"state":finalState,"Probability of collision": cloudState["Probability of collision"]};
                }

            }
        }
        else if(this.coppeliasimSupport == false){
            let pos = this.posCheck(position); // check the format of position, make sure it is correct
    
            if (typeof pos == "string"){
                console.log(pos); // if return value is string, return "invalid position"

                return {"state":"invalid position"};
            }
            else{
                let shapeState = this.pointInworkshape(pos); // check if the point in the working space
                console.log(shapeState);

                let cloudState = this.pointIncloud(pos); // check if the point in the point cloud

                console.log(cloudState);

                console.log("Safety check without coppeliasim verification is rough estimate, normally safe area is bigger than real area");

                // any false means collisions exists
                if ((shapeState==false)||(cloudState["Point accessible"]==false)){
                    finalState = false;
                }
                return {"state":finalState,"Probability of collision": cloudState["Probability of collision"]};
            }  
        }

    }

}



async function main() {
    let shapePath = "./robot_info/uarm_folder/uarm_shape.stl";
    let pointPath = "./robot_info/uarm_folder/uarm_data_point.csv";
    let coppeState = true;
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    console.log(rootAddress);
    let coppeScene = rootAddress + "/Uarm_TD_Verification/Virtual_IoT_lab_verification.ttt";


    let rMC = new uarmMotioncheck(shapePath,pointPath,coppeState,coppeScene);

    let point1 = [180,240,90];
    let point2 = [220,260,100];
    let point3 = [200,-240,100];
    let point4 = [180,-200,70];

    //let access = await rMC.posSafetycheck(point1);

    //await rMC.posSafetycheck(point2);
    //await rMC.posSafetycheck(point3);
    //await rMC.posSafetycheck(point4);
    
}

//main();