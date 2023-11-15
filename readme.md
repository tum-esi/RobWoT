# RobWoT

## Introduction

RobWoT offers a set of methods to automatically generate Web of Things-compliant Digital Twins and Simulations using only a robot's Universal Robot Description Format (URDF) as an input. Furthermore, RobWoT provides methods for automatically generating and annotating the robot's Thing Description (TD) with its workspace based on the simulated environment.

RobWoT methods have been implemented in CoppeliaSim using its Remote API with runs over Websockets.

To showcase our methods, we recreate setups of the IoT Remote Lab of the Professorship of Embedded Systems and Internet of Things located in the main campus of the Technical University of Munich (TUM) and provide all the code that allows interacting using WoT interaction affordances with the devices inside these setups.

## Installation

>Prerequisite: node.js, CoppeliaSim V4.4.0 or higher installed  
>Run the ```npm install``` or ``yarn install`` command to install necessary packages in the repository root directory

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

## IoT Remote Lab

<img src="./pictures/IoT remote lab.jpg" width="600">
