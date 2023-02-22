const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

class robotDescriptiongenrate{
    //variable
    sceneAddress:string
    driverAddress:string
    robotName:string
    robotInstancename:string
    constructor(sceneAddress:string){
        this.sceneAddress = sceneAddress;
        this.driverAddress = "./robot_driver_workspace.txt";
        this.robotName = "/virtual_robot";
        this.robotInstancename = "./generated_robot_td/robot_" + "instance" + ".json";

    }
    // scene initialization in copperliasim
    private async sceneInit():Promise<any>{
        const client = new RemoteAPIClient('localhost', 23050,'json');
        console.log("load scene to copperliasim");
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
    
        let robotInfo = await sim.callScriptFunction("robotInfo", robotScripthandle,name);

        return robotInfo[0];
    }
    private async limitContentgenerate(robotInfo:any,robotType:string):Promise<any>{
        // robot_template should be a fixed path
        let robot_template = JSON.parse(fs.readFileSync("../robot_template.json", "utf8"));

        //console.log(robotInfo);
        // modify the joint amount and position,cartesian limit
        // action moveTojointPosition
        for (let index = 0; index < Number(robotInfo["jointAmount"]); index++) {
            let curJointname = "joint" + String(index+1);
            robot_template["actions"]["moveTojointPosition"]["input"]["properties"][curJointname] = {
                "type" : "number",
                "minimum": robotInfo["jointLimitLows"][index],
                "maximum": robotInfo["jointLimitHighs"][index]
            }; 
        }
        // action moveTocartesianPosition
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["minimum"] = - Number(robotInfo["positionLimits"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["maximum"] = Number(robotInfo["positionLimits"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["minimum"] = - Number(robotInfo["positionLimits"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["maximum"] = Number(robotInfo["positionLimits"]);
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["minimum"] = 0;
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["maximum"] = Number(robotInfo["positionLimits"]);
        // property getJointposition
        for (let index = 0; index < Number(robotInfo["jointAmount"]); index++) {
            let curJointname = "joint" + String(index+1);
            robot_template["properties"]["getJointposition"]["properties"][curJointname] = {
                "type" : "number",
                "minimum": robotInfo["jointLimitLows"][index],
                "maximum": robotInfo["jointLimitHighs"][index]
            }; 
        }
        // property getCartesianposition
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["minimum"] = - Number(robotInfo["positionLimits"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["maximum"] = Number(robotInfo["positionLimits"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["minimum"] = - Number(robotInfo["positionLimits"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["maximum"] = Number(robotInfo["positionLimits"]);
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["minimum"] = 0;
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["maximum"] = Number(robotInfo["positionLimits"]);    

        robot_template["title"] = "virtualRobot-" + robotType;

        //link model stl location record
        //robot_template["links"][0]["href"] = "http://localhost:8080/robot_template" + "/robot_shape.stl";
        robot_template["links"][0]["href"] = __dirname + "\\robot_shape.stl";
        const data = JSON.stringify(robot_template); // data convert 
        
        return data;
    }
    private async workShapegenerate(sim:any):Promise<string>{
        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        await sim.callScriptFunction("generateWorkingspace", robotScripthandle,this.robotName,0);
        console.log("generate working space shape, it requires about 20 seconds")
        await delay(3000);

        return "success"
    }
    private async shapeRecord(robotInfo:any) {
        
    }
    // generate TD file and save it
    async generateTD(robotType:string):Promise<string>{
        // load scene to copperliasim and get sim
        let sim = await this.sceneInit();
        // load script to object of copperliasim and get necessary information about robot
        let robotInfo = await this.loadDrivertoRobot(sim,robotType); // return format will be a array, so only use first
        // generate new content for the TD file now only includes the joint limits or pos limit
        console.log(robotInfo);
        let infoNew = await this.limitContentgenerate(robotInfo,robotType);
        // generate robot working space and save the shape
        await this.workShapegenerate(sim);
        // record the shape in the TD


        let finalData = infoNew;
        // file save
        fs.writeFileSync(this.robotInstancename, finalData);
        await delay(2000);
        // stop simulation
        await sim.stopSimulation();
        await delay(200);

        return "success";
    }

}


async function main() {
    let sceneAddress = __dirname + "/robot_virtual_workspace.ttt";
    let rdg = new robotDescriptiongenrate(sceneAddress);

    await rdg.generateTD("ur_robot");

    await delay(500);
    process.exit(1);
    
    
}

main();