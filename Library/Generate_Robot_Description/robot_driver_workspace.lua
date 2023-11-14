function sysCall_init()
    corout=coroutine.create(coroutineMain)
    a=2 -- this is for compute working space
    
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
    simIK.setIkGroupCalculation(ikEnv,ikGroup,simIK.method_jacobian_transpose,0.05,180)
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
    
    --init doCalculation parameters
    divisions=6 -- the divisions used for each joint. The total nb of pts becomes (divisions+1)^7
    checkCollision=true
    usePointCloud=true -- if false, 3D spheres will be used
    extractConvexHull=true
    generateRandom=true -- Use random configurations instead of joint divisions
    randomSteps=80000 -- Number of random configs to test
    
    
end

-- create working space
doCalculation=function()

    --local jointHandles={}
    local jointLimitLows={}
    local jointLimitRanges={}
    local initialJointPositions={}
    
    for i=1,#jointHandles,1 do
        --jointHandles[i]=sim.getObject('./joint',{index=i-1})
        local cyclic,interv=sim.getJointInterval(jointHandles[i]) -- judge if the joint is cyclic
        if cyclic then
            jointLimitLows[i]=-180*math.pi/180
            jointLimitRanges[i]=360*math.pi/180
        else
            jointLimitLows[i]=interv[1]
            jointLimitRanges[i]=interv[2]
        end
        initialJointPositions[i]=sim.getJointPosition(jointHandles[i])
    end
    
    local tip=sim.getObject('./tip')
    local base=sim.getObject('.')
    local robotCollection=sim.createCollection(0)
    sim.addItemToCollection(robotCollection,sim.handle_tree,base,0)
    local points={}
    local collisionpoints={}
    
    if not usePointCloud then
        pointContainer=sim.addDrawingObject(sim.drawing_spherepts,0.01,0.01,base,99999,{1,1,1})
        collpointContainer=sim.addDrawingObject(sim.drawing_spherepts,0.01,0.01,base,99999,{1,0,0})
    end
    
    -- get robot base position
    simBasepos=sim.getObjectPosition(simBase,sim.handle_world)
    --init file for data point save
    --print("write points into local file")
    local robotName=sim.getObjectAlias(simBase)
    local csvFileName=robotName.."_data_point.csv"
    local csvFilePath=rootPath.."\\"..csvFileName
    --print(csvFilePath)
    
    local file=io.open(csvFilePath,"w+")
    file:write("X"..",".."Y"..",".."Z"..",".."Collision_state")
    file:write('\n')
    
    if generateRandom then
        for cnt=1,randomSteps,1 do
            for i=1,#jointHandles,1 do
                local pos=jointLimitLows[i]+math.random()*jointLimitRanges[i]
                sim.setJointPosition(jointHandles[i],pos)
            
            end
            
            -- record the progress
            if (cnt%1000==0) then
                print(cnt)
            end
            
            local colliding=false
            local matrix=sim.getObjectMatrix(tip,sim.handle_world)
            
            if checkCollision then
                if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                    colliding=true
                end
            end
            
            if not colliding then
                points[#points+1]=matrix[4]
                points[#points+1]=matrix[8]
                points[#points+1]=matrix[12]
                if not usePointCloud then
                    sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                end
                -- only save relative positon path to robot model
                file:write(kArr[1]*points[#points-2]+bArr[1])
                file:write(",")
                file:write(kArr[2]*points[#points-1]+bArr[2])
                file:write(",")
                file:write(kArr[3]*points[#points]+bArr[3])
                file:write(",")
                file:write(1)  -- 1 represent not colliding
                file:write('\n')
            elseif colliding and matrix[12]>0 then
                collisionpoints[#collisionpoints+1]=matrix[4]
                collisionpoints[#collisionpoints+1]=matrix[8]
                collisionpoints[#collisionpoints+1]=matrix[12]
                if not usePointCloud then
                    sim.addDrawingObjectItem(collpointContainer,{matrix[4],matrix[8],matrix[12]})
                end
                -- only save relative positon path to robot model
                file:write(kArr[1]*collisionpoints[#collisionpoints-2]+bArr[1])
                file:write(",")
                file:write(kArr[2]*collisionpoints[#collisionpoints-1]+bArr[2])
                file:write(",")
                file:write(kArr[3]*collisionpoints[#collisionpoints]+bArr[3])
                file:write(",")
                file:write(0)  -- 0 represent colliding
                file:write('\n')            
            
            end
            
        end
        
        -- only in generate random try to save data points in csv file
        file:close()
    
    else
        local jointNum=#jointHandles
        if jointNum==7 then
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                for i2=1,divisions+1,1 do
                    local p2=jointLimitLows[2]+(i2-1)*jointLimitRanges[2]/divisions
                    sim.setJointPosition(jointHandles[2],p2)
                    for i3=1,divisions+1,1 do
                        local p3=jointLimitLows[3]+(i3-1)*jointLimitRanges[3]/divisions
                        sim.setJointPosition(jointHandles[3],p3)
                        for i4=1,divisions+1,1 do
                            local p4=jointLimitLows[4]+(i4-1)*jointLimitRanges[4]/divisions
                            sim.setJointPosition(jointHandles[4],p4)
                            for i5=1,divisions+1,1 do
                                local p5=jointLimitLows[5]+(i5-1)*jointLimitRanges[5]/divisions
                                sim.setJointPosition(jointHandles[5],p5)
                                for i6=1,divisions+1,1 do
                                    local p6=jointLimitLows[6]+(i6-1)*jointLimitRanges[6]/divisions
                                    sim.setJointPosition(jointHandles[6],p6)
                                    for i7=1,divisions+1,1 do
                                        local p7=jointLimitLows[7]+(i7-1)*jointLimitRanges[7]/divisions
                                        sim.setJointPosition(jointHandles[7],p7)

                                        local colliding=false
                                        local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                                        -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                                        if checkCollision then
                                            if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                                                colliding=true
                                            end
                                        end
                                        if not colliding then
                                            points[#points+1]=matrix[4]
                                            points[#points+1]=matrix[8]
                                            points[#points+1]=matrix[12]
                                            if not usePointCloud then
                                                sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                                            end
                                        end
                                    
                                    end
                                end
                            end
                        end
                    end
                end
            end
        elseif jointNum==6 then
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                for i2=1,divisions+1,1 do
                    local p2=jointLimitLows[2]+(i2-1)*jointLimitRanges[2]/divisions
                    sim.setJointPosition(jointHandles[2],p2)
                    for i3=1,divisions+1,1 do
                        local p3=jointLimitLows[3]+(i3-1)*jointLimitRanges[3]/divisions
                        sim.setJointPosition(jointHandles[3],p3)
                        for i4=1,divisions+1,1 do
                            local p4=jointLimitLows[4]+(i4-1)*jointLimitRanges[4]/divisions
                            sim.setJointPosition(jointHandles[4],p4)
                            for i5=1,divisions+1,1 do
                                local p5=jointLimitLows[5]+(i5-1)*jointLimitRanges[5]/divisions
                                sim.setJointPosition(jointHandles[5],p5)
                                for i6=1,divisions+1,1 do
                                    local p6=jointLimitLows[6]+(i6-1)*jointLimitRanges[6]/divisions
                                    sim.setJointPosition(jointHandles[6],p6)
                                    local colliding=false
                                    local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                                    -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                                    if checkCollision then
                                        if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                                            colliding=true
                                        end
                                    end
                                    if not colliding then
                                        points[#points+1]=matrix[4]
                                        points[#points+1]=matrix[8]
                                        points[#points+1]=matrix[12]
                                        if not usePointCloud then
                                            sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                                        end
                                    end
                                end
                            end
                        end
                    end
                end
            end
        elseif jointNum==5 then
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                for i2=1,divisions+1,1 do
                    local p2=jointLimitLows[2]+(i2-1)*jointLimitRanges[2]/divisions
                    sim.setJointPosition(jointHandles[2],p2)
                    for i3=1,divisions+1,1 do
                        local p3=jointLimitLows[3]+(i3-1)*jointLimitRanges[3]/divisions
                        sim.setJointPosition(jointHandles[3],p3)
                        for i4=1,divisions+1,1 do
                            local p4=jointLimitLows[4]+(i4-1)*jointLimitRanges[4]/divisions
                            sim.setJointPosition(jointHandles[4],p4)
                            for i5=1,divisions+1,1 do
                                local p5=jointLimitLows[5]+(i5-1)*jointLimitRanges[5]/divisions
                                sim.setJointPosition(jointHandles[5],p5)
                                local colliding=false
                                local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                                -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                                if checkCollision then
                                    if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                                        colliding=true
                                    end
                                end
                                if not colliding then
                                    points[#points+1]=matrix[4]
                                    points[#points+1]=matrix[8]
                                    points[#points+1]=matrix[12]
                                    if not usePointCloud then
                                        sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                                    end
                                end
                            end
                        end
                    end
                end
            end
        elseif jointNum==4 then
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                for i2=1,divisions+1,1 do
                    local p2=jointLimitLows[2]+(i2-1)*jointLimitRanges[2]/divisions
                    sim.setJointPosition(jointHandles[2],p2)
                    for i3=1,divisions+1,1 do
                        local p3=jointLimitLows[3]+(i3-1)*jointLimitRanges[3]/divisions
                        sim.setJointPosition(jointHandles[3],p3)
                        for i4=1,divisions+1,1 do
                            local p4=jointLimitLows[4]+(i4-1)*jointLimitRanges[4]/divisions
                            sim.setJointPosition(jointHandles[4],p4)
                            local colliding=false
                            local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                            -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                            if checkCollision then
                                if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                                    colliding=true
                                end
                            end
                            if not colliding then
                                points[#points+1]=matrix[4]
                                points[#points+1]=matrix[8]
                                points[#points+1]=matrix[12]
                                if not usePointCloud then
                                    sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                                end
                            end
                        end
                    end
                end
            end
        elseif jointNum==3 then
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                for i2=1,divisions+1,1 do
                    local p2=jointLimitLows[2]+(i2-1)*jointLimitRanges[2]/divisions
                    sim.setJointPosition(jointHandles[2],p2)
                    for i3=1,divisions+1,1 do
                        local p3=jointLimitLows[3]+(i3-1)*jointLimitRanges[3]/divisions
                        sim.setJointPosition(jointHandles[3],p3)

                        local colliding=false
                        local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                        -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                        if checkCollision then
                            if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                                colliding=true
                            end
                        end
                        if not colliding then
                            points[#points+1]=matrix[4]
                            points[#points+1]=matrix[8]
                            points[#points+1]=matrix[12]
                            if not usePointCloud then
                                sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                            end
                        end
                    end
                end
            end
        elseif jointNum==2 then
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                for i2=1,divisions+1,1 do
                    local p2=jointLimitLows[2]+(i2-1)*jointLimitRanges[2]/divisions
                    sim.setJointPosition(jointHandles[2],p2)
                    local colliding=false
                    local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                    -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                    if checkCollision then
                        if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                            colliding=true
                        end
                    end
                    if not colliding then
                        points[#points+1]=matrix[4]
                        points[#points+1]=matrix[8]
                        points[#points+1]=matrix[12]
                        if not usePointCloud then
                            sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                        end
                    end
                end
            end
        elseif jointNum==1 then
        
            for i1=1,divisions+1,1 do
                local p1=jointLimitLows[1]+(i1-1)*jointLimitRanges[1]/divisions
                sim.setJointPosition(jointHandles[1],p1)
                local colliding=false
                local matrix=sim.getObjectMatrix(tip,sim.handle_world)
                -- local pos=sim.getObjectPosition(tip,sim.handle_world)
                if checkCollision then
                    if sim.checkCollision(robotCollection,sim.handle_all)~=0 then
                        colliding=true
                    end
                end
                if not colliding then
                    points[#points+1]=matrix[4]
                    points[#points+1]=matrix[8]
                    points[#points+1]=matrix[12]
                    if not usePointCloud then
                        sim.addDrawingObjectItem(pointContainer,{matrix[4],matrix[8],matrix[12]})
                    end
                end
            end
        end
    
    end
    
    for i=1,#jointHandles,1 do
        sim.setJointPosition(jointHandles[i],initialJointPositions[i])
    end

    if usePointCloud then
        local ptcld=sim.createPointCloud(0.05,1,0,2)
        sim.insertPointsIntoPointCloud(ptcld,0,points)
        local collPtcld=sim.createPointCloud(0.05,1,0,2)
        if #collisionpoints>0 then
            sim.insertPointsIntoPointCloud(collPtcld,0,collisionpoints,{255,0,0})
        end
    end
    
    -- convert the points pos into newpoints for shape
    local newPointsforshape={}
    
    for i=1,#points,3 do
        newPointsforshape[i] = kArr[1]*points[i]+bArr[1]
        newPointsforshape[i+1] = kArr[2]*points[i+1]+bArr[2]
        newPointsforshape[i+2] = kArr[3]*points[i+2]+bArr[3]
    end
    
    
    if extractConvexHull then
        local vertices,indices=sim.getQHull(newPointsforshape)
        local shape=sim.createMeshShape(3,0,vertices,indices)
        sim.reorientShapeBoundingBox(shape,-1)
        sim.setShapeColor(shape,nil,0,{1,0,1})
        sim.setShapeColor(shape,nil,4,{0.2})
        local a,b,c = {}
        a,b,c = sim.getShapeMesh(shape)
        
        sim.setObjectParent(shape,simBase,true)
        
        -- export the shape as stl file to local computer
        local robotName=sim.getObjectAlias(simBase)
        local robotShapename=robotName.."_shape.stl"
        --[[
        --local aa,bb,cc =simAssimp.getExportFormat(4) -- only in this way return stl
        --print(cc)
        local scenePath=sim.getStringParam(sim.stringparam_scene_path_and_name)
        --print(scenePath)
        local sceneName=sim.getStringParam(sim.stringparam_scene_name)
        --print(sceneName)
        local filePath=string.gsub(scenePath,sceneName,robotShapename)
        ]]--
        
        local filePath=rootPath.."\\"..robotShapename
        
        simAssimp.exportShapes({shape},filePath,"stl",1)
        --sim.exportMesh(4,"d:\\robot_shape.stl",0,1,a,b)
        
    end

end

function sysCall_actuation()
    if coroutine.status(corout)~='dead' then
        local ok,errorMsg=coroutine.resume(corout)
        if errorMsg then
            error(debug.traceback(corout,errorMsg),2)
        end
    end
    -- for function doCalculation
    a=a+1
    if a==2 then
        doCalculation()
    end
end

function generateWorkingspace(randomState, div, savePath,k,b)
    generateRandom=randomState -- Use random configurations instead of joint divisions
    divisions=div
    
    rootPath=savePath
    kArr=k
    bArr=b
    
    a = 0
    --doCalculation()
        
    return "success"
end

function getState()

    return a
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

function moveTojoint(position)
    moveToConfig(jointHandles,maxVel,maxAccel,maxJerk,position)
end

function getJointposition()
    local curJointpos={}
    for i=1,#jointHandles,1 do
        curJointpos[i]=sim.getJointPosition(jointHandles[i])
    end
    
    return curJointpos
end

function moveToinitialPosition()
    moveTojoint(initialJointPositions)
end

function moveToPosition(targetPosition)
    -- convert the targetPosition to targetPose
    local targetDummy = sim.createDummy(0.01)
    sim.setObjectPosition(targetDummy,sim.handle_world, targetPosition)
    
    local targetPose = sim.getObjectPose(targetDummy,sim.handle_world)
    sim.removeObject(targetDummy)

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
    --generateWorkingspace(true,8,"D:\\master_thesis\\project\\robwot\\Generate_robot_description")
    --local info=robotInfo()
    --print(info)
end