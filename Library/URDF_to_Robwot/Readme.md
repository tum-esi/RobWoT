# URDF to RobWoT Pipeline

These files execute a full pipeline that does the following:

1. Take URDF
2. Generate CoppeliaSim Model and associated driver code
3. Calculate the workspace of the robot
4. Expose a Thing with the generated TD, linking the workspace files to it

This can be then used for simulation in the loop scenarios.
