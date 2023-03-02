## The Copperliasim scene to reproduce the IoT lab platform

>Virtual_IoT_lab.ttt: 95% replicate the IoT lab platform except dobot gripper


>Virtual_IoT_lab_new.ttt: 99% replicate the IoT lab plafrom


Due the characteristic of physical engine in Copperliasim, the complex gripper lead to more complex collision calculations in the simulation. Therefore,  normally the success rate of whole action in scene **Virtual_IoT_lab.ttt** is 99%, and the success rate in scene **Virtual_IoT_lab_new.ttt** is 95%. It is recommended to test your client script in scene  **Virtual_IoT_lab.ttt** at beginning. 

## How to initialize the virtual IoT lab based on WoT server

>Related files: virtual_devices_server.ts,virtual_devices_server_new.ts, client_template.ts

>Note: the client_template.ts file is just an example WoT client, you can write your own WoT client

1. Run the ```npm install``` command to install necessary packages in the repository root directory
2. Please open the Copperliasim and load the scene file **Virtual_IoT_lab.ttt** or **Virtual_IoT_lab_new.ttt** manually
3. Enter the **virtual_devices_WoT** folder and run the following command
4. Don't run two scene and corresponding server at the same time, which will cause port conflict.

```
ts-node virtual_devices_server.ts
ts-node client_template.ts
```

or

```
ts-node virtual_devices_server_new.ts
ts-node client_template.ts
```
