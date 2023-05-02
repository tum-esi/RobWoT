## Automatic generate robot things description

>Related files: robot_description_generation_class.ts, robot_virtual_workspace.ttt(**Coppeliasim scene** folder), virtual_robot.ttm(**Coppeliasim scene** folder)

>Note: Remember to uncomment the **main()** function if you want to check template in this file

1. Enter the folder **Generate_robot_description**
2. Run the following command, it includes simple demo to generate Thing description based on robot in the Coppeliasim scene

```
ts-node robot_description_generation_class.ts
```

## robotDescriptiongenrate manual instruction

**let robotName = loadModel(modelPath:string)** 

modelPath: the path file of coppeliasim model
robotName: return the name of robot model
We can use this function load coppeliasim model to coppeliasim scene by code. Or we can directly import the model manually in coppeliasim interface

**robotInfogeneration(robotName:string, rootFolderPath:string)**

This function will get all necessary information from the virtual. These infomation are saved in rootFolderPath and we can use these infomation to generate robotic Things description

**generateTD(robotName:string, rootFolderPath:string)**

Based on information of robot, it could automatically generate the robotic Things description. For some robot with special structure, we manually write script to generate infomation instead of the second function and directly use this function



