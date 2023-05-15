import {Servient} from '@node-wot/core';
import {HttpServer, HttpClientFactory} from '@node-wot/binding-http'

import {Helpers} from '@node-wot/core'; 

// add delay function
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


export class makeWoTinteraction{
    // variable
    TDfile:string;
    client:Servient;
    wotHelper:Helpers;
    data:WoT.DataSchemaValue;
    // constructor
    constructor(fileAddress:string,credentials?:any){
        this.TDfile = fileAddress; // local path or remote ip address
        // init WoT server
        // create Servient and add HTTP binding
        this.client = new Servient();
        this.client.addClientFactory(new HttpClientFactory());
        this.wotHelper = new Helpers(this.client);

        // if need credential to access the server
        this.client.addCredentials(credentials);

        this.data = "null";
    }
    async invokeAction(actionName:string, options?:any) {
        this.wotHelper
            .fetch(this.TDfile)
            .then(async (td: any) => {
                // using await for serial execution (note 'async' in then() of fetch())
                const WoT = await this.client.start();
                const thing = await WoT.consume(td);

                //console.log(options);
                await thing.invokeAction(actionName, options);
                console.log("invoke action " + actionName);
                
            })
            .catch((err) => {
                console.error("invoke action error:", err);
            });
    }
    async readProperty(propertyName:string):Promise<WoT.DataSchemaValue>{
        let td:any = await this.wotHelper.fetch(this.TDfile);

        // using await for serial execution (note 'async' in then() of fetch())
        const WoT = await this.client.start();
        const thing = await WoT.consume(td);
        let data:WoT.DataSchemaValue;
        data = (await (await thing.readProperty(propertyName)).value());
             

        return data;
    }
    async writeProperty(propertyName:string,options:any){
        this.wotHelper
            .fetch(this.TDfile)
            .then(async (td: any) => {
                // using await for serial execution (note 'async' in then() of fetch())
                const WoT = await this.client.start();
                const thing = await WoT.consume(td);
                
                await thing.writeProperty(propertyName,options);
            })
            .catch((err) => {
                console.error("write property error:", err);
            });  
    }
}


export {};