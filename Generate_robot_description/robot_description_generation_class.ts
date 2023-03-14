const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

class robotDescriptiongenrate{
    //variable
    sceneAddress:string;
    driverAddress:string;
    robotName:string;
    robotInstancename:string;
    modelAddress:string;
    sim:any;
    constructor(sceneAddress:string,modelAddress:string){
        this.sceneAddress = sceneAddress;
        this.modelAddress = modelAddress;
        this.driverAddress = "./robot_driver_workspace.txt";
        this.robotName = "/virtual_robot";
        this.robotInstancename = "./generated_robot_td/robot_" + "instance" + ".json";
        this.sim = null;

    }
    // scene initialization in coppeliasim
    private async sceneInit():Promise<any>{
        const client = new RemoteAPIClient('localhost', 23050,'json');
        console.log("load scene to coppeliasim");
        await client.websocket.open();
        let sim = await client.getObject('sim');
        console.log('Getting proxy object "sim"...');
        // load the CoppeliaSim scene
        await sim.loadScene(this.sceneAddress);

        return sim;
    }
    private async loadDrivertoRobot(sim:any,name:string):Promise<any>{
        const fileName = this.driverAddress;
        let fileContent = fs.readFileSync(fileName, 'utf8');

        this.robotName = "/" + name;

        let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1

        let objectHandle = Number(await sim.getObject(this.robotName));

        let checkScripthandle = await sim.getScript(1, objectHandle, this.robotName);
        if (checkScripthandle != -1){
            await sim.removeScript(checkScripthandle[0]); // when the script exists, remove the previous script
        }
    
        await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script
    
        await sim.associateScriptWithObject(scriptHandle, objectHandle); // success 
    
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        await sim.startSimulation();

        await delay(500);
    
        //let robotInfo = await sim.callScriptFunction("robotInfo", robotScripthandle,name);

        //return robotInfo[0];
    }
    private async limitContentgenerate(robotInfo:any,robotType:string):Promise<any>{
        // robot_template should be a fixed path
        let robot_template = JSON.parse(fs.readFileSync("../robot_template.json", "utf8"));

        //console.log(robotInfo);
        // modify the joint amount and position,cartesian limit
        // action moveTojointPosition
        for (let index = 0; index < Number(robotInfo["jointAmount"]); index++) {
            let curJointtype = robotInfo["jointTypes"][index];
            if (curJointtype == "Revolute_joint"){
                let curJointname = "joint" + String(index+1);
                let min = robotInfo["jointLimitLows"][index] * 180 / Math.PI;
                let max = robotInfo["jointLimitHighs"][index] * 180 / Math.PI;
                robot_template["actions"]["moveTojointPosition"]["input"]["properties"][curJointname] = {
                    "type" : "number",
                    "unit" : "deg",
                    "minimum": min,
                    "maximum": max
                };            
            }
            else if(curJointtype == "Prismatic_joint"){
                let curJointname = "joint" + String(index+1);
                let min = robotInfo["jointLimitLows"][index];
                let max = robotInfo["jointLimitHighs"][index];
                robot_template["actions"]["moveTojointPosition"]["input"]["properties"][curJointname] = {
                    "type" : "number",
                    "unit" : "meter",
                    "minimum": min,
                    "maximum": max
                };                   
            }
        }
        // action moveTocartesianPosition
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["minimum"] = Number(robotInfo["positionLimits"]["x"]["Lows"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["maximum"] = Number(robotInfo["positionLimits"]["x"]["Highs"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["minimum"] = Number(robotInfo["positionLimits"]["y"]["Lows"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["maximum"] = Number(robotInfo["positionLimits"]["y"]["Highs"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["minimum"] = Number(robotInfo["positionLimits"]["z"]["Lows"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["maximum"] = Number(robotInfo["positionLimits"]["z"]["Highs"]);
        // property getJointposition
        for (let index = 0; index < Number(robotInfo["jointAmount"]); index++) {
            let curJointtype = robotInfo["jointTypes"][index];
            if (curJointtype == "Revolute_joint"){
                let curJointname = "joint" + String(index+1);
                let min = robotInfo["jointLimitLows"][index] * 180 / Math.PI;
                let max = robotInfo["jointLimitHighs"][index] * 180 / Math.PI;
                robot_template["properties"]["getJointposition"]["properties"][curJointname] = {
                    "type" : "number",
                    "unit" : "deg",
                    "minimum": min,
                    "maximum": max
                };            
            }
            else if(curJointtype == "Prismatic_joint"){
                let curJointname = "joint" + String(index+1);
                let min = robotInfo["jointLimitLows"][index];
                let max = robotInfo["jointLimitHighs"][index];
                robot_template["properties"]["getJointposition"]["properties"][curJointname] = {
                    "type" : "number",
                    "unit" : "meter",
                    "minimum": min,
                    "maximum": max
                };                   
            }
        }
        // property getCartesianposition
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["minimum"] = Number(robotInfo["positionLimits"]["x"]["Lows"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["maximum"] = Number(robotInfo["positionLimits"]["x"]["Highs"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["minimum"] = Number(robotInfo["positionLimits"]["y"]["Lows"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["maximum"] = Number(robotInfo["positionLimits"]["y"]["Highs"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["minimum"] = Number(robotInfo["positionLimits"]["z"]["Lows"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["maximum"] = Number(robotInfo["positionLimits"]["z"]["Highs"]);   

        robot_template["title"] = "virtualRobot_" + robotType;

        //link model stl location record
        //robot_template["links"][0]["href"] = "http://localhost:8080/robot_template" + "/robot_shape.stl";
        robot_template["links"][0]["href"] = __dirname + "\\robot_shape.stl";
        const data = JSON.stringify(robot_template); // data convert 
        
        return data;
    }
    private async workShapegenerate(sim:any, savePath:string):Promise<any>{
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        let generateState = true;
        let div = 7;

        let Path = savePath;

        await sim.callScriptFunction("generateWorkingspace", robotScripthandle, generateState, div, Path);
        console.log("generate working space shape, it requires a few seconds")
        await delay(3000);
        while(true){
            await delay(1000);
            let state = (await sim.callScriptFunction("getState", robotScripthandle))[0];
            // wait only the docalculation is finished
            if (state>3){
                break;
            }
        }

        let robotInfo = await sim.callScriptFunction("robotInfo", robotScripthandle);

        return robotInfo[0];
    }
    private async loadModel(sim:any):Promise<any> {
        let robotHandle = await sim.loadModel(this.modelAddress);
        robotHandle = robotHandle[0];

        let curRobotpos = (await sim.getObjectPosition(robotHandle, sim.handle_world))[0];
        let compensateHeight = 0.03; // consider potential collision, increase the height
        await sim.setObjectPosition(robotHandle, sim.handle_world, [curRobotpos[0],curRobotpos[1], curRobotpos[2]+compensateHeight]);

        let robotName = (await sim.getObjectAlias(robotHandle))[0]; //get robot name based on robot handle
        //console.log(await sim.getObjectAlias(robotHandle));

        return robotName;  
    }
    // generate TD file and save it
    async generateTD(filePath:string):Promise<string>{
        // load scene to coppeliasim and get sim
        let sim = await this.sceneInit();
        // load robot model to scene
        let robotName = await this.loadModel(sim);
        // load script to object of coppeliasim and get necessary information about robot
        await this.loadDrivertoRobot(sim,robotName); // only load driver to robot
        // generate robot working space and save the shape
        let robotInfo = await this.workShapegenerate(sim, filePath);
        // generate new content for the TD file now only includes the joint limits or pos limit
        console.log(robotInfo);
        let infoNew = await this.limitContentgenerate(robotInfo,robotName);
        // record the shape in the TD


        let finalData = infoNew;
        console.log("write infomation in things description")
        // file save
        fs.writeFileSync(this.robotInstancename, finalData);
        await delay(2000);
        // stop simulation
        //await sim.stopSimulation();
        await delay(200);

        return "success";
    }

}


async function main() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let modelAddress = rootAddress + "/Coppeliasim scene/virtual_robot.ttm";
    let sceneAddress = rootAddress + "/Coppeliasim scene/robot_virtual_workspace.ttt";
    let rdg = new robotDescriptiongenrate(sceneAddress,modelAddress);

    let shapePath = __dirname; //the path to save the shape

    await rdg.generateTD(shapePath);

    await delay(500);
    //process.exit(1);
    
    
}

main();