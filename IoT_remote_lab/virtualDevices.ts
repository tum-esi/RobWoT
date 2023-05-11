// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export class virtualConveyor{
    // variable
    name:String;
    sim:any;
    conveyorHandle:Number;
    // constructor
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.conveyorHandle = 0;
    }
    // get conveyorbelt info
    async getConveyorState(){
        this.conveyorHandle = Number(await this.sim.getObject(this.name));
        return await(this.sim.readCustomTableData(this.conveyorHandle,'__state__'));
    }
    //speed should be -1 to 1
    async setConveyorSpeed(speed:Number){
        this.conveyorHandle = Number(await this.sim.getObject(this.name));
        await this.sim.writeCustomTableData(this.conveyorHandle,'__ctrl__',{'vel': speed});
    }
}

export class virtualSensor{
    // variable
    name:String;
    sim:any;
    sensorHandle:Number;
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.sensorHandle = 0;
    }
    async getSensorState(){
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        return await(this.sim.handleProximitySensor(this.sensorHandle));
    }
    // detect if it exists object
    async objectDetect():Promise<boolean>{
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        let sensorInfo = await(this.sim.handleProximitySensor(this.sensorHandle));
        //console.log(sensorInfo);
        if (sensorInfo[0] == 0){
            return false;
        }
        else if(sensorInfo[0] == 1){
            return true;
        }
        else{
            return false;
        }
    }
    async getObjectcolor():Promise<number[]>{
        this.sensorHandle = Number(await this.sim.getObject(this.name));
        let sensorInfo = await(this.sim.handleProximitySensor(this.sensorHandle));   
        let detectObjecthandle = sensorInfo[3];
        let colorInfo;
        if (detectObjecthandle != -1){
            colorInfo = await(this.sim.getObjectColor(detectObjecthandle,0,await this.sim.colorcomponent_ambient_diffuse))
            let colorRGB = [colorInfo[0][0]*255,colorInfo[0][1]*255,colorInfo[0][2]*255];
            //console.log(colorRGB);
            return colorRGB;
        }
        else{
            return [0,0,0];
        }
    }
}

export class virtualUarm{
    // variable
    name:String;
    sim:any;
    uarmHandle:Number;
    scriptHandle:Number;
    previousPos:Number[];
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.uarmHandle = 0;
        this.scriptHandle = 0
        this.previousPos = [0.22,0,0];
    }
    posParse(realPos:number[]){
        let z = realPos[2] + 1.054 ;
        let x = realPos[0] + 1.157;
        let y = 1.26*realPos[1] - 0.3;

        let finalPos = [x,y,z];

        //console.log(finalPos);

        return finalPos;

    }
    async computeAnglefromPosition(pos:Number[]){
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        //console.log(pos);

        let angles = await (this.sim.callScriptFunction("computeAnglesFromGripperPosition", this.scriptHandle,pos,-0.062,-0.01));

        //console.log(angles);
        return [angles[0][0], angles[0][1], angles[0][2],angles[0][3]];
    }
    async goTopositon(pos:Number[]):Promise<string>{
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        //let angles = await this.computeAnglefromPosition(pos);
        //await this.sim.callScriptFunction("moveToPosition", this.scriptHandle,angles, true);
        /*
        if ((this.previousPos[0] != 0.22)||(this.previousPos[1] != 0)||(this.previousPos[2] != 0)){
            await this.sim.callScriptFunction("goTo", this.scriptHandle, [this.previousPos[0], this.previousPos[1], pos[2]]);
            await delay(2000);
        }
        */
        await this.sim.callScriptFunction("goTo", this.scriptHandle,pos); //this is non-blocking function
        //await delay(2000);

        this.previousPos = pos;

        return "success";
    }
    async goWithspeed(pos:number[],speed:number):Promise<string> {
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        let finalPos = this.posParse(pos);
        
        await this.sim.callScriptFunction("goWithspeed", this.scriptHandle,finalPos,speed); //this is non-blocking function
        //await delay(2000);
        // now change it to blocking function
        /*
        // ----------------------------------
        await this.sim.callScriptFunction("moveWithspeed", this.scriptHandle,pos,speed);
        while (true){
            let state = await this.sim.callScriptFunction("check", this.scriptHandle);
            //console.log(state);
            await delay(500);
            if (state[0]==3){
                break;
            }
        }
        await delay(100);
        // -----------------------------------
        */

        this.previousPos = pos;

        return "success";
        
    }
    // open or close gripper
    async setGripperstate(state:boolean){
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        await this.sim.callScriptFunction("enableGripper", this.scriptHandle,state);
        await delay(1000);
    }
    async getCurpos():Promise<number[]>{
        this.uarmHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.uarmHandle,this.name));

        let curPos = await this.sim.callScriptFunction("getCurpos", this.scriptHandle);

        curPos = curPos[0];

        return curPos
    }
}

export class virtualDobot{
    // variable
    name:String;
    sim:any;
    dobotHandle:Number;
    scriptHandle:Number;
    jointAngle:Number[];
    gripperState:Boolean;
    
    constructor(s:any,objectName:String){
        this.name = objectName;
        this.sim = s;
        this.dobotHandle = 0;
        this.scriptHandle = 0;
        this.jointAngle = [0,0,0,0];
        this.gripperState = false;
    }
    async setJointangle(angle:number[]):Promise<string>{
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        // get motor handles
        let handles = await this.sim.callScriptFunction("fetchJointHandles", this.scriptHandle);
        //console.log(handles);
        let len = handles[0].length;
        let motorHandles:any = [];
        for (let index = 0; index < len; index++) {
            motorHandles[index] = handles[0][index];
        }
        let vel=22;  
        let accel=40;
        let jerk=80;
        let maxVel=[vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180,vel*Math.PI/180];
        let maxAccel=[accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180,accel*Math.PI/180];
        let maxJerk=[jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180,jerk*Math.PI/180];

        for (let index = 0; index < angle.length; index++) {
            angle[index]=angle[index]*Math.PI/180;
        }
        this.jointAngle = angle;
        // also change it to blocking function
        await this.sim.callScriptFunction("moveJoint", this.scriptHandle, motorHandles,maxVel,maxAccel,maxJerk,this.jointAngle);

        while (true){
            let state = await this.sim.callScriptFunction("check", this.scriptHandle);
            //console.log(state);
            await delay(500);
            if (state[0]==3){
                break;
            }
        }
        await delay(100);

        return "success";
    }
    async setGripperstate(state:boolean):Promise<string>{
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        this.gripperState = state;
       
        await this.sim.callScriptFunction("setGripperstate", this.scriptHandle, this.gripperState);
        await delay(500);
        return "success";
    }
    async dobotMove(targetY:number):Promise<string> {
        this.dobotHandle = Number(await this.sim.getObject(this.name));

        let curPos = await this.sim.getObjectPosition(this.dobotHandle,await this.sim.handle_world);

        curPos = curPos[0];

        let distance = Math.abs(targetY - curPos[1]);

        if (targetY>=curPos[1]){
            distance = distance;
        }
        else{
            distance = -distance;
        }

        let curMove = 0;

        while(true){
            if (distance>=0){
                curPos[1] = curPos[1]+0.01;
                await this.sim.setObjectPosition(this.dobotHandle,await this.sim.handle_world, [curPos[0], curPos[1], curPos[2]])
                curMove = curMove + 0.01;
                //console.log(curMove);
                if (curMove>distance){
                    break
                }
                await delay(60);
            }
            else if (distance<0){
                curPos[1] = curPos[1] - 0.01;
                await this.sim.setObjectPosition(this.dobotHandle,await this.sim.handle_world, [curPos[0], curPos[1], curPos[2]])
                curMove = curMove + 0.01;
                //console.log(curMove);
                if (curMove>Math.abs(distance)){
                    break
                }
                await delay(60);      
            }
        }
        return "success";
        //return "success";
    }
    // moveTopos update to the blocking function
    async moveTopos(position:number[]):Promise<string>{
        this.dobotHandle = Number(await this.sim.getObject(this.name));
        this.scriptHandle = Number(await this.sim.getScript(1, this.dobotHandle,this.name));
        
        await this.sim.callScriptFunction("move", this.scriptHandle, position);
        while (true){
            let state = await this.sim.callScriptFunction("check", this.scriptHandle);
            //console.log(state);
            await delay(500);
            if (state[0]==3){
                break;
            }
    
        }
        await delay(100);
        
        return "success";
    }
}

export class virtualLight{
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

    async getLightinfo(){
        // get light handle
        this.lightHandle = Number(await this.sim.getObject(this.lightAddress)); 

        let info = await this.sim.getLightParameters(this.lightHandle);
        
        return info;
    }
    async getLightstate():Promise<any>{
        // get light handle
        this.lightHandle = Number(await this.sim.getObject(this.lightAddress)); 

        let info = await this.sim.getLightParameters(this.lightHandle);
        //console.log(info);
        let lightState = info[0];
        //console.log(lightState);
        
        if (lightState == 0){
            return false;
        }
        else{
            return true;
        }

    }
    // set light open or close
    async setLightstate(state:boolean){
        // get light handle
        this.lightHandle = Number(await this.sim.getObject(this.lightAddress)); 

        if (state == true){
            this.lightState = 1;
        }
        else{
            this.lightState = 0;
        }
        await this.sim.setLightParameters(this.lightHandle,this.lightState,[0,0,0],this.diffusePart, this.specularPart);
    }
    // set light color based on rgb (value must in 0-255)
    async setLightcolor(color:number[]){
        // get light handle
        this.lightHandle = Number(await this.sim.getObject(this.lightAddress)); 

        //for (let i = 0; i < color.length; i++) {
        //    color[i] = color[i] / 255;
        //}
 
        this.diffusePart = color;
        await this.sim.setLightParameters(this.lightHandle,this.lightState,[0,0,0],this.diffusePart, this.specularPart);
    
    }

}

export class virtualPanTilt{
    // variable
    deviceName:string;
    sim:any;
    panPos:number;
    tiltPos:number;
    stopState:boolean;
    // constructor
    constructor(s:any,name:string){
        this.sim = s;
        this.deviceName = name;
        this.panPos = 0;
        this.tiltPos = -90;
        this.stopState = false;
    }
    async goHome():Promise<string>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        
        await this.sim.callScriptFunction("goHome", scriptHandle);   
        
        await delay(3000);

        return "success";
    }
    async moveTo(pos:number[]):Promise<string>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        // convert it to joint pos coordinates in scene
        let finalPos = [pos[0]*Math.PI/180, (pos[1]-90)*Math.PI/180];
        
        await this.sim.callScriptFunction("moveTo", scriptHandle,finalPos);   

        //await delay(1000);
        return "success";
    }
    async panPosition():Promise<any>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        
        let val = await this.sim.callScriptFunction("panPosition", scriptHandle); 
        this.panPos = val[0];  

        return val[0];
    }
    async tiltPosition():Promise<any>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        
        let val = await this.sim.callScriptFunction("tiltPosition", scriptHandle); 
        this.tiltPos = val[0];  

        return val[0];
    }
    async panTo(panPosition:number):Promise<any>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        // convert it to joint pos coordinates in scene
        let finalPos = [panPosition*Math.PI/180, this.tiltPos*Math.PI/180];
        
        await this.sim.callScriptFunction("moveTo", scriptHandle,finalPos);   

        //await delay(3000);
        return "success";      
    }
    async tiltTo(tiltPosition:number):Promise<any>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        // convert it to joint pos coordinates in scene
        let finalPos = [this.panPos*Math.PI/180, (tiltPosition-90)*Math.PI/180];
        
        await this.sim.callScriptFunction("moveTo", scriptHandle,finalPos);   

        //await delay(3000);
        return "success";      
    }
    async stopMovement():Promise<any>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        
        this.panPos = await this.panPosition();
        this.tiltPos = await this.tiltPosition();
        let finalPos = [this.panPos*Math.PI/180, (this.tiltPos-90)*Math.PI/180];

        this.stopState = true;
        await this.sim.callScriptFunction("moveTo", scriptHandle,finalPos);   
        
        await delay(3000);
        return "success";
    }
    async panContinuously():Promise<any>{
        let panHandle = Number(await this.sim.getObject(this.deviceName));
        let scriptHandle = Number(await this.sim.getScript(1, panHandle ,this.deviceName));
        
        this.panPos = -89;

        while(true){
            let finalPos = [this.panPos*Math.PI/180, -90*Math.PI/180];
            await this.sim.callScriptFunction("moveTo", scriptHandle,finalPos); 

            await delay(50);
            this.panPos = this.panPos + 1;
            if (this.panPos > 89){
                break;
            }
            // stop in stop state
            if(this.stopState == true){
                this.stopState = false;
                break;
            }
        }
        await delay(300);
        
        return "success";
    }

    
}
