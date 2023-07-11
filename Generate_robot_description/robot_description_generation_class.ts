const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path
import * as fs from 'fs';

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class robotDescriptiongenrate{
    //variable
    sceneAddress:string;
    driverAddress:string;
    robotName:string;
    robotInstancename:string;
    modelAddress:string;
    sim:any;
    constructor(sceneAddress:string){
        this.sceneAddress = sceneAddress;
        this.modelAddress = "";
        console.log(__dirname);
        this.driverAddress = __dirname + "/robot_driver_workspace.txt";
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

        // check the simulation state
        let simState =  Number(await sim.getSimulationState());

        // the simulation is running, stop the simulation for new command
        if (simState == Number(await sim.simulation_advancing_running)){
            await sim.stopSimulation();

        }
        else if(simState == Number(await sim.simulation_stopped)){
            // if the simulation is not running, the load the CoppeliaSim scene
            await sim.loadScene(this.sceneAddress);
            // after load scene, begin to simulation
            //await sim.startSimulation();
        }

        return sim;
    }
    private async loadDrivertoRobot(sim:any,name:string):Promise<any>{
        const fileName = this.driverAddress;
        let fileContent = fs.readFileSync(fileName, 'utf8');

        this.robotName = "/" + name;

        let scriptHandle = Number(await sim.addScript(1)); // add sim.scripttype_childscript 1

        let objectHandle = Number(await sim.getObject(this.robotName));

        let checkScripthandle = await sim.getScript(1, objectHandle, this.robotName);

        if (checkScripthandle[0] != -1){
            //console.log("hello");
            await sim.removeScript(checkScripthandle[0]); // when the script exists, remove it and add new scripts
        }
        
        await sim.setScriptStringParam(scriptHandle,Number(await sim.scriptstringparam_text),fileContent); // load code to script

        await sim.associateScriptWithObject(scriptHandle, objectHandle); // success        

        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        //let robotInfo = await sim.callScriptFunction("robotInfo", robotScripthandle,name);

        //return robotInfo[0];
    }
    private async limitContentgenerate(robotInfo:any,stlFilepath:string,csvFilepath:string,options?:any):Promise<any>{
        // robot_template should be a fixed path
        let robot_template = JSON.parse(fs.readFileSync("../robot_template.json", "utf8"));
        let robotType = robotInfo["robotName"];

        // parse the csv file, try to find max,min value of x,y,z
        let csvContent = fs.readFileSync(csvFilepath, "utf8");

        // convert the csvConten to csv array in string type
        let csvStrarray =csvContent.split("\n").map(function (line) {
            return line.split(",");
        });


        let maxValposX = Number(csvStrarray[1][0]);
        let maxValnegX = Number(csvStrarray[1][0]);
        let maxValposY = Number(csvStrarray[1][1]);
        let maxValnegY = Number(csvStrarray[1][1]);
        let maxValposZ = Number(csvStrarray[1][2]);
        let maxValnegZ = Number(csvStrarray[1][2]);

        // check csv array, try to find the max,min val in x,y,z based on not collision points
        for (let i = 1; i < csvStrarray.length-1; i++){
            let curStrarray = csvStrarray[i];
            for (let j = 0; j < curStrarray.length-1; j++) {
                let curState = Number(csvStrarray[i][3]);
                // only calculate the not collision points
                if (curState == 1){
                    if (j == 0){
                        let curVal = Number(csvStrarray[i][j]);
                        if (curVal>maxValposX){
                            maxValposX = curVal;
                        }
                        else if (curVal<maxValnegX){
                            maxValnegX = curVal;
                        }
                    }
                    else if (j == 1){
                        let curVal = Number(csvStrarray[i][j]);
                        if (curVal>maxValposY){
                            maxValposY = curVal;
                        }
                        else if (curVal<maxValnegY){
                            maxValnegY = curVal;
                        }
                    }
                    else if (j == 2){
                        let curVal = Number(csvStrarray[i][j]);
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

        // check unit of distance
        let unitDis = "meter";

        if (options["unit of distance"] != null){
            unitDis = options["unit of distance"];
        }
        // ------------------------ set the dynamics parameters of robotic TD --------------------------------------------
        // modify the joint amount and position,cartesian limit
        // action moveTojointPosition
        for (let index = 0; index < Number(robotInfo["jointAmount"]); index++) {
            let curJointtype = robotInfo["jointTypes"][index];
            if (curJointtype == "Revolute_joint"){
                let curJointname = "joint" + String(index+1);
                let min = robotInfo["jointLimitLows"][index] * 180 / Math.PI - 1;
                let max = robotInfo["jointLimitHighs"][index] * 180 / Math.PI + 1;
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
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["minimum"] = extremeVal[0];
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["maximum"] = extremeVal[1];
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["minimum"] = extremeVal[2];
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["maximum"] = extremeVal[3];
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["minimum"] = extremeVal[4];
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["maximum"] = extremeVal[5];
        // add unit for action moveTocartesianPosition
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["x"]["unit"] = unitDis;
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["y"]["unit"] = unitDis;
        robot_template["actions"]["moveTocartesianPosition"]["input"]["properties"]["z"]["unit"] = unitDis;


        // property getJointposition
        for (let index = 0; index < Number(robotInfo["jointAmount"]); index++) {
            let curJointtype = robotInfo["jointTypes"][index];
            if (curJointtype == "Revolute_joint"){
                let curJointname = "joint" + String(index+1);
                let min = robotInfo["jointLimitLows"][index] * 180 / Math.PI - 1;
                let max = robotInfo["jointLimitHighs"][index] * 180 / Math.PI + 1;
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
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["minimum"] = extremeVal[0];
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["maximum"] = extremeVal[1];
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["minimum"] = extremeVal[2];
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["maximum"] = extremeVal[3];
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["minimum"] = extremeVal[4];
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["maximum"] = extremeVal[5];   
        // add unit for property getCartesianposition
        robot_template["properties"]["getCartesianposition"]["properties"]["x"]["unit"] = unitDis; 
        robot_template["properties"]["getCartesianposition"]["properties"]["y"]["unit"] = unitDis; 
        robot_template["properties"]["getCartesianposition"]["properties"]["z"]["unit"] = unitDis; 

        // ---------------------------------------------------------------------------------------------------

        // ------------------------ set the other parameters of robotic TD --------------------------------------------
        // modify title and id
        robot_template["title"] = "coppeliasim_virtualrobot_" + robotType;
        robot_template["id"] = "urn:dev:ops:32473-virtual-" + robotType;

        // modify description, if description of options doesn't exist, use default description
        let robot_description = "The TD document for digital twins of " + robotType;
        if (options["description"] != null){
            robot_description = options["description"];
        }
        robot_template["description"] = robot_description

        //link model stl location record
        //now change it to the address of http file server
        if (options["stlFilepath"] != null){
            stlFilepath = options["stlFilepath"];
        }
        if (options["csvFilepath"] != null){
            csvFilepath = options["csvFilepath"];
        }
        // link to stl and data csv file
        robot_template["links"][0]["href"] = stlFilepath;
        robot_template["links"][1]["href"] = csvFilepath;
        // link to the virtual scene
        if (options["sceneFilepath"] != null){
            robot_template["links"][2] = 
            {
                "href": options["sceneFilepath"],
                "type": "application/octet-stream",
                "rel": "coppeliasim scene"  
            }
        }

        // then begin to modify the href
        let basicHref = "http://localhost:8080/" + robot_template["title"];

        if (options["href"] != null){
            basicHref = options["href"] + robot_template["title"];
            // modify for property and actions
            robot_template["properties"]["getJointposition"]["forms"][0]["href"] = basicHref + "/properties/getJointposition";
            robot_template["properties"]["getCartesianposition"]["forms"][0]["href"] = basicHref + "/properties/getCartesianposition";
            robot_template["actions"]["moveTojointPosition"]["forms"][0]["href"] = basicHref + "/actions/moveTojointPosition";
            robot_template["actions"]["moveTocartesianPosition"]["forms"][0]["href"] = basicHref + "/actions/moveTocartesianPosition";
        }


        const data = JSON.stringify(robot_template); // data convert 
        
        return data;
    }
    private async workShapegenerate(sim:any, savePath:string,state:boolean,divisions:number,posReal?:number[][],posVirtual?:number[][]):Promise<any>{
        let k = [1,1,1];
        let b = [0,0,0]; 
        // if need to convert
        if ((posReal != null)&&(posVirtual != null)){
            let kbVal = this.posRefparse(posReal,posVirtual);
            //console.log(kbVal);
            k = kbVal[0];
            b = kbVal[1];
        }
        
        await sim.startSimulation();

        await delay(300);

        let objectHandle = Number(await sim.getObject(this.robotName));
        let robotScripthandle = Number(await sim.getScript(1, objectHandle,this.robotName));

        let generateState = state;
        let div = divisions;

        let Path = savePath;

        await sim.callScriptFunction("generateWorkingspace", robotScripthandle, generateState, div, Path,k,b);
        console.log("generate working space shape, it requires a few seconds or minutes")
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

        // workspace successfully generate, stop simulation
        await delay(300);
        console.log("workspace successfully generate, stop simulation");
        await sim.stopSimulation();
        await delay(300);
        
        await sim.saveScene(this.sceneAddress);
        await delay(300);

        return robotInfo[0];
    }
    // transform virtual position to the real position
    private posRefparse(posReal:number[][],posVirtual:number[][]){
        // check correctness of position
        if ((posReal.length >=2) &&(posVirtual.length >=2)){
            let k:number[] = [0,0,0];
            let b:number[] = [0,0,0];

            for (let i = 0; i < 3; i++) {
                if (posVirtual[0][i] == posVirtual[1][i]){
                    k[i] = 1;
                    b[i] = posReal[1][i] - posVirtual[1][i];
                }
                else{
                    k[i] = (posReal[0][i] - posReal[1][i]) / (posVirtual[0][i] - posVirtual[1][i]);
                    b[i] = posReal[1][i] - (posReal[0][i] - posReal[1][i]) / (posVirtual[0][i] - posVirtual[1][i]) * posVirtual[1][i];               
                }
            }

            return [k,b];
        }
        else{
            return [[1,1,1],[0,0,0]];
        }
    }
    // load robot model to scene
    async loadModel(modelPath:string, modelPosition?:number[]):Promise<any> {
        let sim:any;
        // load scene to coppeliasim and get sim
        if (this.sim == null){
            sim = await this.sceneInit();
            this.sim = sim;
        }
        else{
            sim = this.sim;
        }

        this.modelAddress = modelPath;
        let robotHandle = await sim.loadModel(this.modelAddress);
        robotHandle = robotHandle[0];

        if (modelPosition == null){
            let curRobotpos = (await sim.getObjectPosition(robotHandle, sim.handle_world))[0];
            let compensateHeight = 0.03; // consider potential collision, increase the height
            await sim.setObjectPosition(robotHandle, sim.handle_world, [curRobotpos[0],curRobotpos[1], curRobotpos[2]+compensateHeight]);
    
        }
        else{
            let compensateHeight = 0.03; // consider potential collision, increase the height
            // set model position based on user set
            await sim.setObjectPosition(robotHandle, sim.handle_world, [modelPosition[0],modelPosition[1],modelPosition[2]+compensateHeight]);

        }

        let robotName = (await sim.getObjectAlias(robotHandle))[0]; //get robot name based on robot handle
        //console.log(await sim.getObjectAlias(robotHandle));

        return robotName;  
    }
    // the robots with common structure, looking forward to using the a common script to generate working space in copperliasim
    async robotInfogeneration(robotName:string, filePath:string,posReal?:number[][],posVirtual?:number[][]):Promise<any>{
        let sim:any;
        // load scene to coppeliasim and get sim
        // if sim don't exist, init scene first to get scene
        if (this.sim == null){
            sim = await this.sceneInit();
            this.sim = sim;
        }
        else{
            sim = this.sim;  // if exist, directly use sim
        }
        // based on file path and robot name to create a folder for saving information for this robot
        //let robotFolderpath = filePath + "/" + robotName + "_folder";
        let robotFolderpath = filePath;
        if (!fs.existsSync(robotFolderpath)){
            fs.mkdirSync(robotFolderpath);
        }

        // load driver script to robot with common structure in the coppeliasim scene 
        await this.loadDrivertoRobot(sim,robotName); 
        // begin to simulation to generation working space and save the necessary file into folder
        let robotInfo = await this.workShapegenerate(sim, robotFolderpath,true,8,posReal,posVirtual);
        // save the shape and csv file to folder, then save robot info into folder
        let robotJson = JSON.stringify(robotInfo);
        let robotJsonpath = robotFolderpath + "/" + robotName + "_info.json";
        fs.writeFileSync(robotJsonpath, robotJson);


        return robotInfo;
    }
    // based on the exist info or file to generate TD file and save it
    async generateTD(robotName:string, rootPath:string,options?:any):Promise<any>{
        let stlFilepath = rootPath + "/" + robotName + "_shape.stl";
        let jsonFilepath = rootPath + "/" + robotName + "_info.json";
        let csvFilepath = rootPath + "/" + robotName + "_data_point.csv";

        // check if three files exist
        if ((!fs.existsSync(stlFilepath))&&(!fs.existsSync(jsonFilepath))&&(!fs.existsSync(csvFilepath))){
            console.log("It lacks files, please check files integrity");

            return "failed";
        }
        else{
            // when all files exist
            let robotInfo = JSON.parse(fs.readFileSync(jsonFilepath,"utf-8"));

            // generate new content for the TD file now includes the joint limits or pos limit
            // then record the shape in the TD 
            if (options == null){
                options = {};
            }
            let infoNew = await this.limitContentgenerate(robotInfo,stlFilepath,csvFilepath,options);
            // filter the data point, which is not in the shape

            let finalData = infoNew;
            console.log("write infomation into things description")
            // file save
            this.robotInstancename = rootPath + "/" + robotInfo["robotName"] +"_instance" + ".json";
            fs.writeFileSync(this.robotInstancename, finalData);

            await delay(5000);
            //await sim.stopSimulation();

            return "success";
        }
    }

}


async function main() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository
    let modelAddress = rootAddress + "/Coppeliasim scene/default robot models/mypal_robot.ttm";
    let sceneAddress = rootAddress + "/Coppeliasim scene/robot_virtual_workspace.ttt";
    let rdg = new robotDescriptiongenrate(sceneAddress);

    let rootFolderPath = __dirname + "/robot_info/mypal_robot"; //the path of folder to save necessary files

    // choose the model that you want load to the scene
    let robotName = await rdg.loadModel(modelAddress); 
    console.log(robotName);

    // generate related info based on robot model in coppeliasim
    let robotInfo = await rdg.robotInfogeneration(robotName, rootFolderPath);
    console.log(robotInfo);
    let optionsUR5 = {
        "unit of distance": "meter",
        "stlFilepath": "http://localhost:4000/ur5_robot/ur5_shape.stl",
        "csvFilepath": "http://localhost:4000/ur5_robot/ur5_data_point.csv",
        "sceneFilepath": "http://localhost:4000/ur5_robot/UR5.ttm",
        "href":"http://localhost:8090/",
        "port": 8090
    }

    let optionsMypal = {
        "unit of distance": "meter",
        "stlFilepath": "http://localhost:4000/mypal_robot/mypal_robot_shape.stl",
        "csvFilepath": "http://localhost:4000/mypal_robot/mypal_robot_data_point.csv",
        "sceneFilepath": "http://localhost:4000/mypal_robot/mypal_robot.ttm",
        "href":"http://localhost:8091/",
        "port": 8091
    }

    // generate TD file base on robot name and necessary files in folder
    await rdg.generateTD(robotName, rootFolderPath,optionsMypal); 
    

    await delay(500);
    process.exit(1);
    
    
}

//main();