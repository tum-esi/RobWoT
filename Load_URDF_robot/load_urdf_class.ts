const {RemoteAPIClient} = require("./remoteApi/RemoteAPIClient.js");
var path = require('path');   // for root path



// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


export class robotURDFload{
    //variable
    sceneAddress:string
    robotName:string
    fileAddress:string;
    constructor(sceneAddress:string, fileAddress:string, robotName:string){
        this.sceneAddress = sceneAddress;
        this.fileAddress = fileAddress;
        this.robotName = robotName;
    }
    // scene initialization in coppeliasim
    private async sceneInit():Promise<any>{
        const client = new RemoteAPIClient('localhost', 23050,'json');
        console.log("load scene to coppeliasim");
        await client.websocket.open();
        let sim = await client.getObject('sim');
        console.log('Getting proxy object "sim"...');
        // get simURDF plugin
        let simURDF = await client.getObject('simURDF');
        // load the CoppeliaSim scene
        await sim.loadScene(this.sceneAddress);

        return [sim,simURDF];
    }
    async robotURDFparse():Promise<any>{

    }
    async robotDynamic(sim:any):Promise<string>{
        // get tree based objects for the scene
        let treeBasedobjects = (await sim.getObjectsInTree(await sim.handle_scene, await sim.handle_all,2))[0];
        console.log(treeBasedobjects);
        // from based objects, find out the objects with joints and remove the objects without joints
        // change the joint control mode is position control
        let robotHandles:number[] = [];
        let k = 0
        for (let index = 0; index < treeBasedobjects.length; index++) {
            let curHandle = treeBasedobjects[index];
            // get robotic joint handles
            let curTreejoints = (await sim.getObjectsInTree(curHandle, await sim.object_joint_type,0))[0];
            // save the robot handles when the curhandle has joints,
            if (curTreejoints.length != 0){
                robotHandles[k] = curHandle;
                k = k + 1;
                console.log(k + " robot joint is setting");
                // change each joint control mode to position control
                for (let j = 0; j < curTreejoints.length; j++) {
                    // set the joint position control parameters
                    // set joint to dymanic mode
                    await sim.setJointMode(curTreejoints[j], await sim.jointmode_dynamic,0);
                    await sim.setObjectInt32Param(curTreejoints[j],await sim.jointintparam_dynctrlmode, await sim.jointdynctrl_position);
                    // set the joint maximal velocity deg/s
                    await sim.setObjectFloatParam(curTreejoints[j],await sim.jointfloatparam_maxvel,50);
                    // set the joint torque
                    await sim.setJointTargetForce(curTreejoints[j],1000);
                    // rename the robot joint to name "joint"
                    await sim.setObjectAlias(curTreejoints[j],"joint");
                }
                // get robotic link handles
                let curTreelinks = (await sim.getObjectsInTree(curHandle, await sim.object_shape_type,0))[0];
                //console.log(curTreelinks);
                // first link, only set it to respondable
                await sim.setObjectInt32Param(curTreelinks[0], await sim.shapeintparam_respondable, 1);
                await sim.setObjectInt32Param(curTreelinks[0], await sim.shapeintparam_static, 1);
                for (let j = 1; j < curTreelinks.length; j++) {
                    //Query j is odd or even numbers
                    // for real link, set it respondable and compute its mass, inertia
                    if (j%2 == 0){
                        await sim.setObjectInt32Param(curTreelinks[j], await sim.shapeintparam_respondable, 1);
                        await sim.setObjectInt32Param(curTreelinks[j], await sim.shapeintparam_static, 0);
                        await sim.computeMassAndInertia(curTreelinks[j], 1200);

                    }else if(j%2 == 1){
                        // for visual link, only set it to not respondable
                        await sim.setObjectInt32Param(curTreelinks[j], await sim.shapeintparam_respondable, 0);
                    }        
                }
            }
        }
        // set the robot handle to object
        // assume that current scene only has one robotic arm
        if (robotHandles.length > 0){
            // set the object "Object is model" for the model saving
            let p = await sim.getModelProperty(robotHandles[0]);
            p = await (sim.boolOr32(p[0],await sim.modelproperty_not_model)) - await (sim.modelproperty_not_model);
            await sim.setModelProperty(robotHandles[0], p);
            // rename the robot handles based on robot name
            console.log(robotHandles);
            await sim.setObjectAlias(robotHandles[0],this.robotName);
            // save the robot as model 
            let rootAddress = path.resolve(__dirname, '..');
            let finalPath = rootAddress + "/Coppeliasim scene/" + this.robotName + ".ttm";
            await sim.saveModel(robotHandles[0], finalPath);
            console.log(finalPath);
        }

        return "success";
    }
    async loadURDF():Promise<any>{
        // initial coppeliasim and get sim
        let simArray = await this.sceneInit();
        let sim = simArray[0];
        let simURDF = simArray[1];
        // parse the URDF file(mainly modify the package name)

        // load URDF file to coppeliasim scene 
        // current problem: it only has dummy link
        console.log("load urdf file to coppeliasim, it requires a few seconds");

        // the return name is the urdf robot name, some urdf doesn't have..., so tend to not get name
        // because some urdf cause error after successfully import, so just use this method...
        try {
            await simURDF.import(this.fileAddress,516); 
            
        } catch (error) {
            console.log(error);
        }
        await delay(1000);
        console.log("Successfully load robot model to coppeliasim");
        console.log("Now generate robot dynamic properties");
        // robot dynamic parameters modify and return the complete robot model
        await this.robotDynamic(sim);
        return "success"
    }
}

async function main() {
    let rootAddress = path.resolve(__dirname, '..'); // get the root directory of the repository

    let sceneAddress = rootAddress + "/Coppeliasim scene/robot_urdf_load_scene.ttt";
    console.log(sceneAddress);
    let fileAddress = rootAddress + "/Load_URDF_robot/URDF example/mypal_description/urdf/mypal_260.urdf";
    let robotName = "virtual_robot";
    let robURDF = new robotURDFload(sceneAddress,fileAddress,robotName);



    await robURDF.loadURDF();


    

    await delay(500);
    process.exit(1); 
}

main();


