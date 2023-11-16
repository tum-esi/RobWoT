## Automatic Generation of Robot Thing Description

>Related files: robot_description_generation_class.ts, robot_virtual_workspace.ttt(**Coppeliasim scene** folder), virtual_robot.ttm(**Coppeliasim scene** folder)

>Note: Remember to uncomment the **main()** function if you want to check template in this file

1. Enter the folder **Generate_robot_description**
2. Run the following command, it includes simple demo to generate Thing description based on robot in the Coppeliasim scene

```
cd Generate_robot_description
ts-node robot_description_generation_class.ts
```

3. You can also directly use this class in other folder and file

## robotDescriptiongenrate manual instruction

**let robotName = loadModel(modelPath:string)**  

modelPath: the path file of coppeliasim model  
robotName: return the name of robot model  
We can use this function load coppeliasim model to coppeliasim scene by code. Or we can directly import the model manually in coppeliasim interface  

**robotInfogeneration(robotName:string, rootFolderPath:string)**  

This function will get all necessary information from the virtual robot. These infomation are saved in rootFolderPath and will be used to generate robotic Thing description  

**generateTD(robotName:string, rootFolderPath:string)**  

Based on information of robot, it could automatically generate the robotic Thing description. For some robot with special structure, we need to manually write script to generate infomation instead of the second function. Based on these information we can directly use this function to generate the Thing Description



