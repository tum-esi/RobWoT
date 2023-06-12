## Virtual IoT remote lab  

>Related files: virtual_devices_server.ts, virtualDevices.ts, IoT_remote_lab.ttt  

<img src="../Picture folder/IoT remote lab.JPG" width="600">

Combine with two verification scene, the virtual IoT remote lab scene reproduces the devices in the real IoT remote lab. We can implemet all previous tasks such as workspace generation and robotic TD verification in this scene. 

Furthermore, object such as cube or gripper shaking is a normal phenomenon in Coppeliasim simulation. If sometimes action fails due to the vibration of the object. You can try to restart the Coppeliasim to fix this problem

## How to initialize the virtual IoT lab based on WoT server

>Related files: virtual_devices_server.ts,virtual_devices_server_new.ts, client_template.ts

>Note: the client_template.ts file is just an example WoT client, you can write your own WoT client

1. Run the ```npm install``` command to install necessary packages in the repository root directory
2. Please open the Coppeliasim and load the scene file **Virtual_IoT_lab.ttt** or **Virtual_IoT_lab_new.ttt** manually
3. Enter the **virtual_devices_WoT** folder and run the following command

```
cd IoT_remote_lab
ts-node virtual_devices_server.ts
ts-node client_template.ts
```

4. Don't run two scene and corresponding server at the same time, which will cause port conflict.
5. It requires 5-7 seconds for the server to initialization. So it needs a little time interval between commands.
6. You can write your own client script, or you can directly use **client_template.ts** 

## Extra

>light_pantilt_template.ts : It is template to show how to interact with virtual light and pantilt

>debug_code.ts: It shows how to automatically generate the robotic TD and it could also debug Coppeliasim remote API interaction without WoT server