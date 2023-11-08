# Scenes for CoppeliaSim

Each scene imports a set of Things (see SimulationThings folder) and also has a .ttt file that has the placement and visuals of the devices.

Starting one .ts file per scene is all that is needed.
One can configure that ts file by adding other Things.

Each scene has a Servient where the Simulation Things are added. This allows you to configure the protocol stack of that scene (e.g. one scene with only HTTP or other only with MQTT).