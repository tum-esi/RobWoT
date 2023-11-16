## Virtual IoT Remote Lab

![Virtual IoT Remote](../../pictures/iot-remote-lab.jpg)

The virtual IoT Remote Lab scene reproduces the devices in the real IoT Remote Lab at TU Munich.

### How to initialize the virtual IoT Remote Lab

> Related files: virtual_devices_server.ts,virtual_devices_server_new.ts, client_template.ts

1. Please open the CoppeliaSim and load the scene file **IoT_remote_lab.ttt** manually
2. In one terminal, run `ts-node virtual_devices_server.ts` which will start the layer to allow interaction with the simulation via WoT.
3. In another terminal, run `ts-node client_template.ts` which will run a mashup (control logic) to interact with the simulated devices.

**Notes:**

- The client_template.ts file is just an example WoT Mashup, you can write your own.
- Don't run multiple scene and corresponding server at the same time, which will cause port conflict.
- You can run the two scripts in separate computers. Even CoppeliaSim and the virtual_devices_server can be in different computers but you should change the configuration to point to another IP address and pay attention to opening the correct ports.
