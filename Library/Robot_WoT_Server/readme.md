## Automatic inverse kinematics calculation for common robots

>Related files: Robot_WoT_Server.ts, Robot_wot_client.ts, robot_digital_twins.ttt, robot_driver.lua

>Note: 1. automatic inverse kinematics calcualation code is saved in robot_driver.lua, which is a Lua script in the CoppeliaSim
2. ur3_robot_td_generate.ts shows how to get infomation from robot and how to generate related TD based on current robot

It is a little complicated job to realize inverse kinematics calculation for different robotic arm in CoppeliaSim. I hope that my single script could finish inverse kinematics calculation for the most of robotic arm with common structure in the world. Besides, I also want to prove correctness of automatically generated TD file by wot server.

1. Run the ```npm install``` command to install necessary packages in the repository root directory if no packages are installed
2. Please open the CoppeliaSim software manually
3. Run the following command in the current folder path to start wot server
4. You can test the template wot client first, or you can directly write your own wot client part

```
cd Robot_WoT_Server
ts-node Robot_WoT_Server.ts
ts-node Robot_wot_client.ts
```

## Automatic robot WoT server generation

>Related files: WoT_server_generation_class.ts

For the robot with common structures such as UR robot, we can directly use this class to generate the robot WoT server. You can check ```UR10_TD_verification.ts``` to see the demo.


## Plus: check if a point exists in the convex shape
>Related files: point_in_polyhedron_test.ts

The automatical generated TD file includes robotic workspace shape. It is a convex shape. Here I want to show how to use mathematical methods to check if a point is in the robotic workspace

## Plus: Generate the TD of UR3 robot
>Related files: ur3_robot_td_generate.ts

UR3 robot Thing Description could generate via this file
