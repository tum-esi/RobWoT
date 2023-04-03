// load remote api for coppeliasim
const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");

const parseSTL = require("parse-stl");  // parse the stl file binary

// for reading local file
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


class robotMotioncheck{
    // variable
    coppeliasimSupport:boolean; // check if needs to connect with coppeliasim
    dataPointfilepath:string;
    workShapefilepath:string;

    jsonSTL:any;
    csvArray:string[][]; // csv file to array is quite special situation....

    constructor(workShapepath:string,dataPointpath:string, coppeliasimSupportstate:boolean){
        this.workShapefilepath = workShapepath;
        this.dataPointfilepath = dataPointpath;
        this.coppeliasimSupport = coppeliasimSupportstate;

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
        console.log(count,normalsArray.length);
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
        let distanceInterval = 50; //5cm accuracy

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
        // assume at least 6 points in this target area
        if (count>=10){
            let state = true;
            let collisionProbability = collisionCount / (collisionCount + nonCollisioncount);

            return {"Point accessbile":state,"Probability of collision": collisionProbability};

        }else {
            let state= false;

            return {"Point accessbile":state};
        }
    }

    // the position value can be [x,y,z] or [x,y,z,dx,dy,dz,R]
    async posSafetycheck(position:number[]) {
        // first check if it needs coppeliasim
        if (this.coppeliasimSupport == true){
            let pos = this.posCheck(position); // check the format of position, make sure it is correct

            if (typeof pos == "string"){
                console.log(pos); // if return value is string, return "invalid position"
            }
            else{
                let shapeState = this.pointInworkshape(pos); // check if the point in the working space
                console.log(shapeState);
                let cloudState = this.pointIncloud(pos); // check if the point in the point cloud

                console.log(cloudState);
            }
        }
        else if(this.coppeliasimSupport == false){
            let pos = this.posCheck(position); // check the format of position, make sure it is correct
    
            if (typeof pos == "string"){
                console.log(pos); // if return value is string, return "invalid position"
            }
            else{
                let shapeState = this.pointInworkshape(pos); // check if the point in the working space
                console.log(shapeState);

                let cloudState = this.pointIncloud(pos); // check if the point in the point cloud

                console.log(cloudState);

                console.log("Safety check without coppeliasim verification is rough estimate, normally safe area is bigger than real area");
            }
            
        }

    }

}



async function main() {
    let shapePath = "../dobot_uarm_TD_Verification/robot_info/uarm_folder/uarm_shape.stl";
    let pointPath = "../dobot_uarm_TD_Verification/robot_info/uarm_folder/uarm_data_point.csv";
    let coppeState = false;
    let coppeScene = "../dobot_uarm_TD_Verification/Virtual_IoT_lab_verification.ttt";


    let rMC = new robotMotioncheck(shapePath,pointPath,coppeState);

    let point = [195,370,90];

    rMC.posSafetycheck(point);
    
}

main();