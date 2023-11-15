function sysCall_init()
    corout=coroutine.create(coroutineMain)
    a=2 -- this is for compute working space
    
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
    -- first check if it exist connection, if exist, use connection position, if not use endeffector pos
    connectionHandle=sim.getObject("./connection",{noError=true} )
    print(connectionHandle)
    if connectionHandle ~= -1 then
        connectionPos=sim.getObjectPosition(connectionHandle,sim.handle_world)
        sim.setObjectPosition(tipHandle, sim.handle_world, connectionPos)
        sim.setObjectPosition(targetHandle, sim.handle_world, connectionPos)
    else
        -- endEffector is not a idel position
        endEffectorpos = sim.getObjectPosition(objectHandlesall[#objectHandlesall], sim.handle_world)
        sim.setObjectPosition(tipHandle, sim.handle_world, endEffectorpos)
        sim.setObjectPosition(targetHandle, sim.handle_world, endEffectorpos)
    end 
    -- set dummy point to the parent object
    sim.setObjectParent(tipHandle,objectHandlesall[#objectHandlesall],true)
    sim.setObjectParent(targetHandle,simBase,true)
    
    
    -- get joint Handles
    jointHandles = sim.getObjectsInTree(simBase,sim.object_joint_type,0)
    
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
    
end

-- create working space
doCalculation=function()
    local divisions=8 -- the divisions used for each joint. The total nb of pts becomes (divisions+1)^7
    local checkCollision=true
    local usePointCloud=true -- if false, 3D spheres will be used
    local extractConvexHull=true
    local generateRandom=false -- Use random configurations instead of joint divisions
    local randomSteps=80000 -- Number of random configs to test
    
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
    --sim.wait(3) -- just tem method make it in initial position
    
    if not usePointCloud then
        pointContainer=sim.addDrawingObject(sim.drawing_spherepts,0.01,0.01,base,99999,{1,1,1})
    end
    
    if generateRandom then
        for cnt=1,randomSteps,1 do
            for i=1,#jointHandles,1 do
                local pos=jointLimitLows[i]+math.random()*jointLimitRanges[i]
                sim.setJointPosition(jointHandles[i],pos)
            
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
            end
        end
    else
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
    
    end
    -- set every joint to inital positon
    for i=1,#jointHandles,1 do
        sim.setJointPosition(jointHandles[i],initialJointPositions[i])
    end
    print(#points)
    -- there are multiple shapes are non-convex, so use convex shapes to compose a non-convex shape
    -- divide 360 degree into several parts use convex shape to compose a non-convex or convex shape
    -- assume 30 degree to each part
    local thetaDivisions=12
    local half=math.floor(thetaDivisions/2)
    local angleDived=360/thetaDivisions
    local theta=0
    local count=0
    local newClassfiedpoints={}
    -- table variable has table
    if not extractConvexHull then
        print("initial table")
        for i=1,thetaDivisions,1 do
            local tableName="pointsTable"..i
            newClassfiedpoints[tableName] = {}
        end
        print("points is classified into sub tables")
        for i=1,#points,3 do
            vector1={points[i],points[i+1]}
            vector2={1,0}
            len1=1
            len2=math.sqrt(points[i]^2+points[i+1]^2)
            cosVal=(points[i])/(len1*len2)
            theta=math.acos(cosVal)/math.pi*180
            
            if (points[i+1]>=0) then
                local curInterval=math.ceil(theta/angleDived)
                local tableName="pointsTable"..curInterval
                table.insert(newClassfiedpoints[tableName],points[i])
                table.insert(newClassfiedpoints[tableName],points[i+1])
                table.insert(newClassfiedpoints[tableName],points[i+2])
                
                local int=math.floor(theta/angleDived)
                local rem=theta/angleDived-math.floor(theta/angleDived)
                if (rem<=0.1) and (curInterval~=1) then
                    local tableName="pointsTable"..(curInterval-1) 
                    table.insert(newClassfiedpoints[tableName],points[i])
                    table.insert(newClassfiedpoints[tableName],points[i+1])
                    table.insert(newClassfiedpoints[tableName],points[i+2])
                elseif (rem<=0.1) and (curInterval==1) then
                    curInterval=half+1
                    local tableName="pointsTable"..curInterval
                    table.insert(newClassfiedpoints[tableName],points[i])
                    table.insert(newClassfiedpoints[tableName],points[i+1])
                    table.insert(newClassfiedpoints[tableName],points[i+2])
                elseif (rem>=0.9) and (curInterval==half) then
                    curInterval=thetaDivisions
                    local tableName="pointsTable"..curInterval
                    table.insert(newClassfiedpoints[tableName],points[i])
                    table.insert(newClassfiedpoints[tableName],points[i+1])
                    table.insert(newClassfiedpoints[tableName],points[i+2])
                end
                
            elseif(points[i+1]<0) then
                local curInterval= math.ceil(theta/angleDived)+half
                local tableName="pointsTable"..curInterval
                table.insert(newClassfiedpoints[tableName],points[i])
                table.insert(newClassfiedpoints[tableName],points[i+1])
                table.insert(newClassfiedpoints[tableName],points[i+2])
                
                local int=math.floor(theta/angleDived)
                local rem=theta/angleDived-math.floor(theta/angleDived)
                if (rem<=0.1) and (curInterval~=(half+1)) then
                    local tableName="pointsTable"..(curInterval-1) 
                    table.insert(newClassfiedpoints[tableName],points[i])
                    table.insert(newClassfiedpoints[tableName],points[i+1])
                    table.insert(newClassfiedpoints[tableName],points[i+2])
                elseif (rem<=0.1) and (curInterval==(half+1)) then
                    curInterval=1
                    local tableName="pointsTable"..curInterval
                    table.insert(newClassfiedpoints[tableName],points[i])
                    table.insert(newClassfiedpoints[tableName],points[i+1])
                    table.insert(newClassfiedpoints[tableName],points[i+2])
                elseif (rem>=0.9) and (curInterval==thetaDivisions) then
                    curInterval=half
                    local tableName="pointsTable"..curInterval
                    table.insert(newClassfiedpoints[tableName],points[i])
                    table.insert(newClassfiedpoints[tableName],points[i+1])
                    table.insert(newClassfiedpoints[tableName],points[i+2])
                end
            end
            
        end
    end
    
    if usePointCloud then
        local ptcld=sim.createPointCloud(0.05,1,0,2)
        sim.insertPointsIntoPointCloud(ptcld,0,points)
        local shapeHandle = simSurfRec.reconstruct_scale_space(ptcld,10,200,1000)
        print(shapeHandle)
        local tem =sim.getPointCloudPoints(ptcld)
        print(#tem)
    end
    
    print("write points into local file")
    local fileName="test.csv"
    local scenePath=sim.getStringParam(sim.stringparam_scene_path_and_name)
    local sceneName=sim.getStringParam(sim.stringparam_scene_name)
    local filePath=string.gsub(scenePath,sceneName,fileName)
    print(filePath)
    local file=io.open(filePath,"w+")
    file:write("X"..",".."Y"..",".."Z")
    file:write('\n')
    for i=1,#points,3 do
        file:write(points[i])
        file:write(",")
        file:write(points[i+1])
        file:write(",")
        file:write(points[i+2])
        file:write('\n')
    end
    file:close()

    if extractConvexHull then
        local vertices,indices=sim.getQHull(points)
        local shape=sim.createMeshShape(3,0,vertices,indices)
        sim.reorientShapeBoundingBox(shape,-1)
        sim.setShapeColor(shape,nil,0,{1,0,1})
        sim.setShapeColor(shape,nil,4,{0.2})
        local a,b,c = {}
        a,b,c = sim.getShapeMesh(shape)
        
        sim.setObjectParent(shape,simBase,true)
        
        -- export the shape as stl file to local computer
        local robotName="robot_shape.stl"
        --local aa,bb,cc =simAssimp.getExportFormat(4) -- only in this way return stl
        --print(cc)
        local scenePath=sim.getStringParam(sim.stringparam_scene_path_and_name)
        --print(scenePath)
        local sceneName=sim.getStringParam(sim.stringparam_scene_name)
        --print(sceneName)
        
        local filePath=string.gsub(scenePath,sceneName,robotName)
        print(filePath)
        
        --sim.stopSimulation()
        
        simAssimp.exportShapes({shape},filePath,"stl",1)
        --sim.exportMesh(4,"d:\\robot_shape.stl",0,1,a,b)
    else
        local shapesHandle={}
        print("combine the convex shapes into new shape")
        for i=1,thetaDivisions,1 do
            local tableName="pointsTable"..i
            local curPoints=newClassfiedpoints[tableName]
            print(i)
            if (#curPoints~=0) then
                local vertices,indices=sim.getQHull(curPoints)
                if (vertices~=nil) then
                    local curShape=sim.createMeshShape(3,0,vertices,indices)
                    sim.reorientShapeBoundingBox(curShape,-1)
                    sim.setShapeColor(curShape,nil,0,{1,0,1})
                    sim.setShapeColor(curShape,nil,4,{0.2})
                    
                    table.insert(shapesHandle,curShape)
                end
            end
        end
        
        local finalShape=sim.groupShapes(shapesHandle)
        --sim.setObjectParent(finalShape,simBase,true)
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

function generateWorkingspace()
    a = 0
    --doCalculation()
        
    return "success"
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
    sim.setObjectPosition(targetDummy,sim.getObject('.'), targetPosition)
    
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
function robotInfo(robotType)
    local robotInfo={}
    local jointLimitLows={}
    local jointLimitRanges={}
    
    -- get robot name
    --robotName=sim.getObjectAlias(simBase,-1)
    robotName=robotType
    robotInfo.robotName=robotName
    
    -- get joint amount and limits
    for i=1,#jointHandles,1 do
        local cyclic,interv=sim.getJointInterval(jointHandles[i]) -- judge if the joint is cyclic
        if cyclic then
            jointLimitLows[i]=-180*math.pi/180
            jointLimitRanges[i]=360*math.pi/180
        else
            jointLimitLows[i]=interv[1]
            jointLimitRanges[i]=interv[2]
        end
    end
    robotInfo.jointAmount=#jointHandles
    robotInfo.jointLimitLows=jointLimitLows
    robotInfo.jointLimitHighs=jointLimitRanges
    
    -- get position limit
    -- 21.01.2023 just according to object height to set limits
    local model_x=sim.getObjectFloatParam(simBase, sim.objfloatparam_modelbbox_max_x)
    local model_y=sim.getObjectFloatParam(simBase, sim.objfloatparam_modelbbox_max_y)
    local model_z=sim.getObjectFloatParam(simBase, sim.objfloatparam_modelbbox_max_z)
    
    robotInfo.positionLimits=math.max(model_x,model_y,model_z)
    
    return robotInfo
end

function coroutineMain()
    local targetPos1={90*math.pi/180,90*math.pi/180,-90*math.pi/180,90*math.pi/180,90*math.pi/180,90*math.pi/180}
    --moveToConfig(jointHandles,maxVel,maxAccel,maxJerk,targetPos1)
    --moveTojoint(targetPos1)
    local info=robotInfo()
    --print(info)
    generateWorkingspace()
    
    --local tem = sim.getObject("/Shape")
    --sim.removeObject(tem)
    --local tem1= sim.getObject("/PointCloud")
    
    
    local targetPos2={-90*math.pi/180,45*math.pi/180,90*math.pi/180,135*math.pi/180,90*math.pi/180,90*math.pi/180}
    --moveToConfig(jointHandles,maxVel,maxAccel,maxJerk,targetPos2)

    local targetPos3={0,0,0,0,0,0}
    --moveToConfig(jointHandles,maxVel,maxAccel,maxJerk,targetPos3)
end