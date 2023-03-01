import * as fs from 'fs';
var parseSTL = require("parse-stl");

let fileContent = fs.readFileSync("../Generate_robot_description/robot_shape.stl", "utf8")
let jsonSTL = parseSTL(fileContent);

let posArray = jsonSTL["positions"];
let cellsArray = jsonSTL["cells"];
let normalsArray = jsonSTL["faceNormals"];

//console.log(cellsArray.length);
//console.log(posArray.length);
//console.log(normalsArray.length);

let targetPoint = [-0.39, 0.39, 0.39];

var start = performance.now();

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
    let vector = [targetPoint[0]-curPosinplane[0], targetPoint[1]-curPosinplane[1], targetPoint[2]-curPosinplane[2]];

    //console.log(vector);
    let dotVal = vector[0]*curNormals[0] + vector[1]*curNormals[1] + vector[2]*curNormals[2];

    //console.log(dotVal);
    if (dotVal < 0){
        count++;
    }
    //console.log(curPosinplane);
}

var end = performance.now();
console.log('cost is', `${end - start}ms`)


console.log(count);
console.log(normalsArray.length);