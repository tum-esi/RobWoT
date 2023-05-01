## Automatic inverse kinematics calculation for common robots

>Related files: Robot_wot_server.ts, Robot_wot_client.ts, robot_digital_twins.ttt, robot_driver.txt

>Note: automatic inverse kinematics calcualation code is saved in robot_driver.txt

It is a little complicated job to realize inverse kinematics calculation for different robotic arm in coppeliasim. I hope that my single script could finish inverse kinematics calculation for the most of robotic arm with common structure in the world. Besides, I also want to prove correctness of automatically generated TD file by wot server.

1. Run the ```npm install``` command to install necessary packages in the repository root directory if no packages are installed
2. Please open the Coppeliasim software manually
3. Run the following command in the current folder path to start wot server
4. You can test the template wot client first, or you can directly write your own wot client part

```
ts-node Robot_wot_server.ts
ts-node Robot_wot_client.ts
```

## Plus: check if a point exists in the convex shape
>Related files: point_in_polyhedron_test.ts

The automatical generated TD file includes robotic workspace shape. It is a convex shape. Here I want to show how to use mathematical methods to check if a point is in the robotic workspace