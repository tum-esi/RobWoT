## The verification of UR10 robot Thing Description and robot motion by Coppeliasim

>Related files: UR10_TD_Verification.ttt, robotMotioncontrol_class.ts, UR10_TD_verification.ts

>Note: UR10 robot belongs to the robot with common mechanical structure, so we can interact with virtual UR10 robot in automatically generated WoT server. Or we can directly interact with virtual UR10 robot locally.

1. Enter the folder **UR10_TD_Verification**
2. Run the following command, this is a simple demo to use the instace of class **WoT_server_generation_class.ts**

```
cd UR10_TD_Verification
ts-node UR10_TD_verification.ts
```

3. Or run the following command, this is a simple demo to use the instace of class **robotMotioncontrol_class**

```
cd UR10_TD_Verification
ts-node robotMotioncontrol_class.ts
```

## Plus: Check if the point in workspace without Coppeliasim

>Related files: robotPositioncheck_class.ts

Here it provides a method to check if point in robot workspace without Coppeliasim

```
cd UR10_TD_Verification
ts-node robotPositioncheck_class.ts
```

## Plus: UR10 robot TD generation

>Related files: UR10_TD_generation.ts

```
cd UR10_TD_Verification
ts-node UR10_TD_generation.ts
```
