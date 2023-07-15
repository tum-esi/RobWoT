# RobWoT

>Prerequest: node.js, CoppeliaSim V4.4.0 installed

>Note: Run the ```npm install``` command to install necessary packages in the repository root directory

<img src="./virtual_devices_WoT/Virtual_IoT_lab_new.png" width="600">

## Introduction

This thesis tends to propose the common method to automatically generate Thing Description based on Robotic simulation framework. This robotic TD document could indicate the kinematics properties of robotic arm and contain the essential metadata about the robotic workspace and digital twin. It also includes a method to automatically implement inverse kinematics conversion, which is suitable for both real robot and its digital twin. 

Besides, in the simulation framework, it introduces how to correctly build two digital twin scenes about IoT platform. These two virtual scenes with full functionality and same response-ability as real scene can be used in research and teaching in the future. In this repository, you can check the code implementation in my thesis.

## Table of Contents

- [CoppeliaSim scens communication via Remote API](./Virtual_scenes/)
- [Virtual device Thing description](./virtual_things_description/)
- [Virtual IoT robot platform](./virtual_devices_WoT/)
- [Automatic load URDF in Coppeliasim scene to generate robot model](./Load_URDF_robot/)
- [Automatic implemetation of inverse kinematics calculation for robots](./Robot_WoT_server/)
- [Automatic generate robot things description](./Generate_robot_description/)
- [Uarm robot TD verification](./Uarm_TD_Verification/)
- [UR10 robot TD verification](./UR10_TD_Verification/)
- [Virtual IoT remote lab](./IoT_remote_lab/)

## IoT remote lab
<img src="./Picture folder/IoT remote lab.jpg" width="600">

<!-- ## Reference

--[1] Lagally, M., Matsukura, R., McCool, M., & Toumura, K. (2023, January 19). Web of Things (WoT) Architecture 1.1. https://www.w3.org/TR/wot-architecture11/.

--[2] Korkan, E., Salama, F., Kaebisch, S., & Steinhorst, S. (2021, May). A-MaGe: Atomic mashup generator for the web of things. In Web Engineering: 21st International Conference, ICWE 2021, Biarritz, France, May 18–21, 2021, Proceedings (pp. 320-327). Cham: Springer International Publishing.

--[3] Korkan, E., Regnath, E., Kaebisch, S., & Steinhorst, S. (2020, June). No-Code Shadow Things Deployment for the IoT. In 2020 IEEE 6th World Forum on Internet of Things (WF-IoT) (pp. 1-6). IEEE.

--[4] Edelsbrunner, H., Kirkpatrick, D., & Seidel, R. (1983). On the shape of a set of points in the plane. IEEE Transactions on information theory, 29(4), 551-559.

--[5] Tursynbek, I., & Shintemirov, A. (2020, December). Modeling and simulation of spherical parallel manipulators in CoppeliaSim (V-REP) robot 	simulator software. In 2020 International Conference Nonlinearity, Information and Robotics (NIR) (pp. 1-6). IEEE.

--[6] Pastor-Vargas, R., Tobarra, L., Robles-Gómez, A., Martin, S., Hernández, R., & Cano, J. (2020). A wot platform for supporting full-cycle iot solutions from edge to cloud infrastructures: A practical case. Sensors, 20(13), 3770. -->
