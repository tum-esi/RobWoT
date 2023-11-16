# RobWoT

## Introduction

RobWoT offers a set of methods to automatically generate Web of Things-compliant Digital Twins and Simulations using only a robot's Universal Robot Description Format (URDF) as an input.
Furthermore, RobWoT provides methods for automatically generating and annotating the robot's Thing Description (TD) with its workspace based on the simulated environment.

RobWoT methods have been implemented in CoppeliaSim using its Remote API which runs over Websockets.

To showcase our methods, we recreate setups of the IoT Remote Lab (see picture below) of the Professorship of Embedded Systems and Internet of Things located in the main campus of the Technical University of Munich (TUM) and provide all the code that allows interacting using WoT interaction affordances with the devices inside these setups.

<img src="./pictures/IoT remote lab.jpg" width="600">

## Installation

- Prerequisite: Node.js, CoppeliaSim V4.4.0 or higher installed
- Run the ```npm install``` or ``yarn install`` command to install necessary packages in the repository root directory

## Table of Contents

There are different resources available in this repository. They are listed below for convenience:

- [Thing Descriptions of Virtual Devices](./TDs/Virtual/)
- [Thing Descriptions of Real Devices](./TDs/Real/)
- [URDF Examples of Robots](./URDFs/)
- [Individual Things to be used in Simulation Setups](./SimulationThings/) (Under construction!)
- [Simulation Setups including CoppeliaSim Scenes](./Setups/)
- [Automatic load URDF in CoppeliaSim scene to generate robot model](./Library/Load_URDF_robot/)
- [Automatic implementation of inverse kinematics calculation for robots](./Library/Robot_WoT_server/)
- [Automatic generation robot Thing Description](./Library/GenerateRobotDescription/)
- [Simulation in the Loop Tests with Uarm and UR10 Robots](./SimulationInTheLoop/)
