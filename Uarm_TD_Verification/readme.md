# The verification of Uarm things description by coppeliasim

>Related files: Uarm_TD_verification.ttt, uarm_workspace_check_class.ts,  uarm_Verification.ts

>Note: Uarm belongs to the robot with special mechanical structure, so it doesn't provide WoT server automatical generation.

Based on coppeliasim scene, we can verify the precision of Uarm TD files

1. Enter the folder **Uarm_TD_Verification**
2. Run the following command, this is a simple demo to generate instace of class **uarmMotioncheck**

```
cd Uarm_TD_Verification
ts-node load_urdf_class.ts
```


