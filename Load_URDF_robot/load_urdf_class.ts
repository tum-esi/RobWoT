const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");


// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


class robotURDFload{
    //variable
    sceneAddress:string
    robotName:string
    constructor(sceneAddress:string){
        this.sceneAddress = sceneAddress;
        this.robotName = "/virtual_robot";
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
}

async function main() {
    let sceneAddress = __dirname + "/robot_virtual_workspace.ttt";
    let rdg = new robotURDFload(sceneAddress);

    

    await delay(500);
    process.exit(1); 
}

main();


