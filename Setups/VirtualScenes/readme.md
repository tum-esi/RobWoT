## How to control scenes in Coppeliasim via remote API

>Related files: .ttt, .ts

>Note: Make sure the coppeliasim is state of "stop simulation" before run the following command

>virtual_test_code.ts: This script could be used as debug

1. Run the ```npm install``` command to install necessary packages in the repository root directory
2. Please open the Coppeliasim and load the scene file(.ttt) manually
3. According to the scene name, just open corresponding typescript file ```<scene name>_template.ts```
4. Run the following command in the current folder path(use Virtual_lab.ttt as example)

```
cd Virtual_scenes
ts-node Virtual_light_template.ts
ts-node virtual_robot_template.ts
ts-node Virtual_lab_template.ts
```

## Virtual light devices in coppeliasim
<img src="../pictures/scene1 virtual light.JPG" width="400">

## Virtual robot devices in coppeliasim
<img src="../pictures/scene2 virtual robot.JPG" width="400">

## Virtual lab devices in coppeliasim
<img src="../pictures/scene3 virtual lab.JPG" width="400">