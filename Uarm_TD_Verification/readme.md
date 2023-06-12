## The verification of Uarm Thing Description and robot motion by coppeliasim

>Related files: Uarm_TD_Verification.ttt, uarmMotioncheck_class.ts,  uarm_Verification.ts

>Note: Uarm belongs to the robot with special mechanical structure, so it doesn't provide WoT server automatical generation.

Based on coppeliasim scene, we can verify the precision of Uarm TD files. Since it already has a WoT server to control the digital twin of Uarm, so I want to show how to implement Uarm motion and collision detection locally.

1. Enter the folder **Uarm_TD_Verification**
2. Run the following command, this is a simple demo to use the instace of class **uarmMotioncheck**

```
cd Uarm_TD_Verification
ts-node uarm_Verification.ts
```


