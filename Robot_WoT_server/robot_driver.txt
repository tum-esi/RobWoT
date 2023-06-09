function sysCall_init()
    corout=coroutine.create(coroutineMain)
    a=2 -- this is for compute working space
    rState = 0 --initial state  rState=3 stop state  rState=1 moveToCart rState=2 moveTojoint
    
    
    simBase=sim.getObject('.')
    -- consider someone will manually modify the dummy points according to requirements
    local tip=sim.getObject("./tip",{noError=true} )
    local target=sim.getObject("./target",{noError=true} )
    if (tip == -1)and(target == -1) then   -- if two dummy don't exist, then create
        -- initialize the dummy point for IK
        local tipHandle = sim.createDummy(0.01)
        local targetHandle = sim.createDummy(0.01)
        -- dummy point rename
        sim.setObjectAlias(tipHandle, "tip")
        sim.setObjectAlias(targetHandle, "target")
        -- set the dummy point position
        simBase=sim.getObject('.')
        objectHandlesall = sim.getObjectsInTree(simBase,sim.handle_all,0)
        --print(sim.getObjectAlias(objectHandlesall[#objectHandlesall],-1))
        -- try to make the ik target,tip point closed to real end position
        -- finally use endeffector as final position
        -- endEffector is not a idel position
        endEffectorpos = sim.getObjectPosition(objectHandlesall[#objectHandlesall], sim.handle_world)
        sim.setObjectPosition(tipHandle, sim.handle_world, endEffectorpos)
        sim.setObjectPosition(targetHandle, sim.handle_world, endEffectorpos)

        -- set dummy point to the parent object
        sim.setObjectParent(tipHandle,objectHandlesall[#objectHandlesall],true)
        sim.setObjectParent(targetHandle,simBase,true)
    end
    
    -- get joint Handles
    -- for common robot, assume all joints is controllable
    jointHandles = sim.getObjectsInTree(simBase,sim.object_joint_type,0)
    -- conside if it exists handles than 7 
    -- 6 is quite special cases, because gripper has joint can't be identify
    -- modify this part later
    newjointHandles = {}
    for i=1,#jointHandles,1 do
        newjointHandles[i] = jointHandles[i]
        if i==6 then
            break
        end
    end
    jointHandles = newjointHandles
    
    -- prepare handles for the IK calculation
    simBase=sim.getObject('.')
    simTip=sim.getObject('./tip')
    simTarget=sim.getObject('./target')
    
    simJoints=jointHandles
    -- Prepare an ik group, using the convenience function 'simIK.addIkElementFromScene':
    ikEnv=simIK.createEnvironment()
    ikGroup=simIK.createIkGroup(ikEnv)
    -- simIK.method_damped_least_squares better 2
    -- simIK.method_undamped_pseudo_inverse terrible 4
    -- simIK.method_jacobian_transpose best  1
    -- simIK.method_pseudo_inverse middle 3
    simIK.setIkGroupCalculation(ikEnv,ikGroup,simIK.method_damped_least_squares,0.05,180)
    local ikElement=simIK.addIkElementFromScene(ikEnv,ikGroup,simBase,simTip,simTarget,simIK.constraint_pose)
    simIK.setIkElementPrecision(ikEnv,ikGroup,ikElement,{0.0005,0.001*math.pi/180})
    
    
    
    -- set basic parameters for vel, accel, jerk for the moveTojoint
    local vel=180
    local accel=40
    local jerk=80
    default_maxVel={vel*math.pi/180,vel*math.pi/180,vel*math.pi/180,vel*math.pi/180,vel*math.pi/180,vel*math.pi/180}
    default_maxAccel={accel*math.pi/180,accel*math.pi/180,accel*math.pi/180,accel*math.pi/180,accel*math.pi/180,accel*math.pi/180}
    default_maxJerk={jerk*math.pi/180,jerk*math.pi/180,jerk*math.pi/180,jerk*math.pi/180,jerk*math.pi/180,jerk*math.pi/180}
    
    maxVel={}
    maxAccel={}
    maxJerk={}
    initialJointPositions={} -- also record the inital joint position
    for i=1,#jointHandles,1 do
        maxVel[i]=default_maxVel[i]
        maxAccel[i]=default_maxAccel[i]
        maxJerk[i]=default_maxJerk[i]
        initialJointPositions[i]=sim.getJointPosition(jointHandles[i])
    end
    
    
end

function sysCall_actuation()
    if rState==0 then
        if coroutine.status(corout)~='dead' then
            local ok,errorMsg=coroutine.resume(corout)
            if errorMsg then
                error(debug.traceback(corout,errorMsg),2)
            end
        end
    elseif rState==1 then
        if coroutine.status(corout_move)~='dead' then
            local ok,errorMsg=coroutine.resume(corout_move,finalPos)
            if errorMsg then
                --print(errorMsg)
                error(debug.traceback(corout_move,errorMsg),2)
            end
        else 
            rState=3
        end
    elseif rState==2 then
        if coroutine.status(corout_moveJoint)~='dead' then
            local ok,errorMsg=coroutine.resume(corout_moveJoint,var1,var2,var3,var4,var5)
            if errorMsg then
                error(debug.traceback(corout_moveJoint,errorMsg),2)
            end
        else 
            rState=3
        end
    end
    
end

-- This is a threaded script, and is just an example!
function moveToPoseCallback(pose,velocity,accel,auxData)
    sim.setObjectPose(auxData.target,sim.handle_world,pose)
    simIK.applyIkEnvironmentToScene(auxData.ikEnv,auxData.ikGroup)
end

function moveToPose_viaIK(maxVelocity,maxAcceleration,maxJerk,targetPose,auxData)
    local currentPose=sim.getObjectPose(auxData.tip,sim.handle_world)
    return sim.moveToPose(-1,currentPose,maxVelocity,maxAcceleration,maxJerk,targetPose,moveToPoseCallback,auxData,nil)
end

function movCallback(config,vel,accel,handles)
    for i=1,#handles,1 do
        if sim.isDynamicallyEnabled(handles[i]) then
            sim.setJointTargetPosition(handles[i],config[i])
        else    
            sim.setJointPosition(handles[i],config[i])
        end
    end
end

function moveToConfig(handles,maxVel,maxAccel,maxJerk,targetConf)
    local currentConf={}
    for i=1,#handles,1 do
        currentConf[i]=sim.getJointPosition(handles[i])
    end
    sim.moveToConfig(-1,currentConf,nil,nil,maxVel,maxAccel,maxJerk,targetConf,nil,movCallback,handles)
end

function moveTojoint(targetConf)
    var1=jointHandles
    var2=maxVel
    var3=maxAccel
    var4=maxJerk
    var5=targetConf
    
    corout_moveJoint=coroutine.create(moveToConfig)
    rState=2
  
    
    return "success"
end

function getJointposition()
    local curJointpos={}
    for i=1,#jointHandles,1 do
        jointName="joint"..i
        curJointpos[jointName]=sim.getJointPosition(jointHandles[i]) / math.pi * 180
    end
    
    return curJointpos
end

function getCartesianposition()
    local curCartpos={}
    curPos=sim.getObjectPosition(simTip,sim.handle_world)

    curCartpos.x=curPos[1]
    curCartpos.y=curPos[2]
    curCartpos.z=curPos[3]

    return curCartpos
end

function moveToinitialPosition()
    moveTojoint(initialJointPositions)
end

function moveToPos(targetPos)
    --local targetPose = {targetPos[1],targetPos[2],targetPos[3],0,0,0,1}
    --print(targetPose)
    local targetPose = targetPos

    -- IK movement data:
    local maxIkVel={0.45,0.45,0.45,4.5} -- vx,vy,vz in m/s, Vtheta is rad/s
    local maxIkAccel={0.13,0.13,0.13,1.24} -- ax,ay,az in m/s^2, Atheta is rad/s^2
    local maxIkJerk={0.1,0.1,0.1,0.2} -- is ignored (i.e. infinite) with RML type 2
    
    local data={}
    data.ikEnv=ikEnv
    data.ikGroup=ikGroup
    data.tip=simTip
    data.target=simTarget
    data.joints=simJoints
    
    moveToPose_viaIK(maxIkVel,maxIkAccel,maxIkJerk,targetPose,data)

end

function moveToPosition(targetPosition)
    finalPos=targetPosition
    corout_move=coroutine.create(moveToPos)
    rState=1
    
    return "success"
end

function check() -- check the state, make sure go to stop state
    return rState
end

function collisionCheck() -- check the robot collision state, if collision, make robot go back to previous position
    local robotCollection=sim.createCollection(0)
    local base=sim.getObject('.')
    sim.addItemToCollection(robotCollection,sim.handle_tree,base,0)
    local collState=false
    if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
        collState=true
    end
    
    return collState
    
end

-- get necessary information from the robot
-- related infomaiont: 1. robot type and name
-- 2. the number of joints
-- 3. the joint limit
-- 4. the position limit
function robotInfo()
    local robotInfo={}
    local jointLimitLows={}
    local jointLimitRanges={}
    local jointType={}
    
    -- get robot name
    simBase=sim.getObject('.')
    robotInfo.robotName=sim.getObjectAlias(simBase)
    
    -- get joint amount and limits
    for i=1,#jointHandles,1 do
        local cyclic,interv=sim.getJointInterval(jointHandles[i]) -- judge if the joint is cyclic
        if cyclic then
            jointLimitLows[i]=-180*math.pi/180
            jointLimitRanges[i]=360*math.pi/180
        else
            jointLimitLows[i]=interv[1]
            jointLimitRanges[i]=interv[2]+interv[1]
        end
        jointType[i]=sim.getJointType(jointHandles[i])
        if (jointType[i]== sim.joint_revolute_subtype) then
            jointType[i]="Revolute_joint"
        elseif (jointType[i]== sim.joint_prismatic_subtype) then
            jointType[i]="Prismatic_joint"
        elseif (jointType[i]== sim.joint_spherical_subtype) then
            jointType[i]="Spherical_joint"
        end
    end
    
    robotInfo.jointAmount=#jointHandles
    robotInfo.jointLimitLows=jointLimitLows
    robotInfo.jointLimitHighs=jointLimitRanges
    robotInfo.jointTypes=jointType
    
    return robotInfo
end

function coroutineMain()
    local targetPos1={90*math.pi/180,90*math.pi/180,-90*math.pi/180,90*math.pi/180,90*math.pi/180,90*math.pi/180}

    --moveToPosition({-0.15,0.25,0.35,0,0.707,0,0.707})
    --moveTojoint(targetPos1)
    
    --local tem=getCartesianposition()
    --print(tem)
    --local tem1=getJointposition()
    --print(tem1)
    
end