const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js")

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

class virtualLights{
    // variable
    lightHandle:Number;
    lightAddress:String;
    lightState:Number;
    specularPart:Number[];
    diffusePart:Number[];
    sim:any;
    // constructor
    constructor(s:any,address:String){
        this.sim = s;
        this.lightHandle = 0;
        this.lightAddress = address;
        this.lightState = 1;
        this.specularPart = [0,0,0];
        this.diffusePart = [1,0,0];  
    }
    check(){
        if (this.lightHandle != 0){
            return true
        }
        else{
            console.log("please fetch the object handle at first!");
            return false
        }
    } 
    async fetchObjecthandle() {
        this.lightHandle = Number(await this.sim.getObject(this.lightAddress)); 
        return this.lightHandle;  
    }
    async getLightinfo(){
        if (this.check()){
            let info = await this.sim.getLightParameters(this.lightHandle);
            console.log(info);
        }
    }
    // set light open or close
    async setLightstate(state:boolean){
        if(this.check()){
            if (state == true){
                this.lightState = 1;
            }
            else{
                this.lightState = 0;
            }
            await this.sim.setLightParameters(this.lightHandle,this.lightState,[0,0,0],this.diffusePart, this.specularPart);
        }
    }
    // set light color based on rgb (value must in 0-1)
    async setLightcolor(color:Number[]){
        if (this.check()){
            this.diffusePart = color;
            await this.sim.setLightParameters(this.lightHandle,this.lightState,[0,0,0],this.diffusePart, this.specularPart);
        }
    }

}

async function init(address:String){
    console.log('Hello...');
    const client = new RemoteAPIClient('localhost', 23050,'json');
    console.log('Connecting...');
    await client.websocket.open();
    console.log('Getting proxy object "sim"...');
    let sim = await client.getObject('sim');

    // load the CoppeliaSim scene
    await sim.loadScene(address);

    await delay(1000);

    
    await sim.startSimulation();

    return sim;
}


async function main() {
    let sceneAddress:String = "D:/master_thesis/project/robwot/Virtual_scenes/Virtual_light.ttt"; // you need to modify to your own path
    let sim = await init(sceneAddress); // initialize scene and sim

    // generate light instance based on the scene
    let lightAddress1 = "/Spotlight1";
    let lightAddress2 = "/Spotlight2";
    var lightInstance1 = new virtualLights(sim,lightAddress1);
    var lightInstance2 = new virtualLights(sim,lightAddress2);

    // light initialize - necessary
    let tem1 = await lightInstance1.fetchObjecthandle();
    let tem2 = await lightInstance2.fetchObjecthandle();
    //console.log(tem1,tem2);

    // example: a complex color convert 
    let val1 = 1;
    let val2 = 0;
    let color1 = [val1,val2,0];
    let color2 = [val2,val1,0];
    await lightInstance1.setLightcolor(color1);
    await lightInstance2.setLightcolor(color2);

    await delay (2000);

    while (val2 < 1){
        val1 = val1 - 0.05;
        val2 = val2 + 0.05;
        color1 = [val1,val2,0];
        color2 = [val2,val1,0];

        await lightInstance1.setLightcolor(color1);
        await lightInstance2.setLightcolor(color2);

        await delay(500);
    }

    // light color set
    //await lightInstance1.setLightcolor([0.5,1,0]);
    //await lightInstance2.setLightcolor([0.5,1,0]);

    // light close or open
    //await lightInstance1.setLightstate(false);
    //await lightInstance2.setLightstate(false);
    //await lightInstance1.setLightstate(true);
    //await lightInstance2.setLightstate(true);

    await delay(5000);

    // for the next simulation open, it must close simulation manually
    console.log("simulation stop");
    await sim.stopSimulation();
}


main();


export {};