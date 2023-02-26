const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path



// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


class robotURDFload{
    //variable
    sceneAddress:string
    robotName:string
    fileAddress:string;
    constructor(sceneAddress:string, fileAddress:string, robotName:string){
        this.sceneAddress = sceneAddress;
        this.fileAddress = fileAddress;
        this.robotName = robotName;
    }
    // scene initialization in copperliasim
    private async sceneInit():Promise<any>{
        const client = new RemoteAPIClient('localhost', 23050,'json');
        console.log("load scene to copperliasim");
        await client.websocket.open();
        let sim = await client.getObject('sim');
        console.log('Getting proxy object "sim"...');
        // get simURDF plugin
        let simURDF = await client.getObject('simURDF');
        // load the CoppeliaSim scene
        await sim.loadScene(this.sceneAddress);

        return [sim,simURDF];
    }
    async loadURDF():Promise<any>{
        // initial copperliasim and get sim
        let simArray = await this.sceneInit();
        let sim = simArray[0];
        let simURDF = simArray[1];
        // parse the URDF file(mainly modify the package name)

        // load URDF file to copperliasim scene 
        // current problem: it only has dummy link
        console.log("load urdf file to copperliasim, it requires a few seconds")
        await simURDF.import(this.fileAddress,4); // the return name is the urdf robot name, some urdf doesn't have...
        

        // robot dynamic parameters modify



        return "success"
    }
}

async function main() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository

    let sceneAddress = rootAddress + "/Copperliasim scene/robot_urdf_load_scene.ttt";
    console.log(sceneAddress);
    let fileAddress = rootAddress + "/Load_URDF_robot/URDF example/mycobot_description/urdf/mycobot.urdf";
    let robotName = "/virtual_robot";
    let robURDF = new robotURDFload(sceneAddress,fileAddress,robotName);



    await robURDF.loadURDF();

    

    await delay(500);
    process.exit(1); 
}

main();


