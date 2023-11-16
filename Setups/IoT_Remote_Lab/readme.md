## Virtual IoT Remote Lab  

<img src="../../pictures/IoT remote lab.jpg" width="600">

The virtual IoT Remote Lab scene reproduces the devices in the real IoT Remote Lab at TU Munich. 

Furthermore, object such as cube or gripper shaking is a normal phenomenon in CoppeliaSim simulation. If sometimes action fails due to the vibration of the object. You can try to restart the CoppeliaSim to fix this problem

## How to initialize the virtual IoT lab based on WoT server

>Related files: virtual_devices_server.ts,virtual_devices_server_new.ts, client_template.ts

>Note: the client_template.ts file is just an example WoT client, you can write your own WoT client

1. Run the ```npm install``` command to install necessary packages in the repository root directory
2. Please open the CoppeliaSim and load the scene file **IoT_remote_lab.ttt** manually
3. Enter the **virtual_devices_WoT** folder and run the following command

```
cd IoT_remote_lab
ts-node virtual_devices_server.ts
ts-node client_template.ts
```

4. Don't run multiple scene and corresponding server at the same time, which will cause port conflict.
5. It requires 5-7 seconds for the server to initialization. So it needs a little time interval between commands.
6. You can write your own client script, or you can directly use **client_template.ts** 

## Plus: Some scripts can be used for debug

>light_pantilt_template.ts : It is template to show how to interact with virtual light and pantilt

>debug_code.ts: It shows how to automatically generate the robotic TD and it could also debug CoppeliaSim remote API interaction without WoT server