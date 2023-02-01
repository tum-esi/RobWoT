## How to initialize the virtual IoT lab based on WoT server

>Related files: virtual_devices_server.ts, client_template.ts
>Note: the client_template.ts file is just an example WoT client, you can write your own WoT client

1. Run the ```npm install``` command to install necessary packages in the repository root directory
2. Please open the Copperliasim and load the scene file **Virtual_IoT_lab.ttt** manually
3. Enter the **virtual_devices_WoT** folder and run the followling command

```
ts-node virtual_devices_server.ts
ts-node client_template.ts
```
 
