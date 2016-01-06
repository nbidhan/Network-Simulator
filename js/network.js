function makeStruct(name) {
    'use strict';
    var names = name.split(' ');
    var count = names.length;
    function constructor() {
        for (var i = 0; i < count; i++) {
          this[names[i]] = arguments[i];
        }
    }
    return constructor;
}

var Interface = makeStruct("intID deviceID intType intName IPAddress SubnetMask");
var Device = makeStruct("deviceID deviceType deviceName x y");
var Connection = makeStruct("ConnectionID ConnectionType startIntID endIntID");
var Interfaces = [];
var Devices = [];
var Connections = [];


var toolbox =  document.getElementById('toolbox');
var lanArea =  document.getElementById('lanArea');
var context = lanArea.getContext("2d");
var rect = lanArea.getBoundingClientRect();
var selectedTool = '';
var imgObject;
var mouseIsDown = false;
var startX, startY, startIndex, startIntID, endX, endY, endIndex, endIntID;
var selectedDevice, selectedConnection, selectedX, selectedY, ConnectionX, ConnectionY;


////////////////CODES FROM VERSION 1 ////////////////////////////////

var _ = Infinity;
var Vertices = [];
var Edges = [];

var Vertex = makeStruct("name ipAddress subnetMask");

var Edge = makeStruct("sourceHost destHost length speed");

function shortestPath(edges, numVertices, startVertex) {
    try{
  var done = new Array(numVertices);
  done[startVertex] = true;
  var pathLengths = new Array(numVertices);
  var predecessors = new Array(numVertices);
  for (var i = 0; i < numVertices; i++) {
    pathLengths[i] = edges[startVertex][i];
    if (edges[startVertex][i] != Infinity) {
      predecessors[i] = startVertex;
    }
  }
  pathLengths[startVertex] = 0;
  for (var i = 0; i < numVertices - 1; i++) {
    var closest = -1;
    var closestDistance = Infinity;
    for (var j = 0; j < numVertices; j++) {
      if (!done[j] && pathLengths[j] < closestDistance) {
        closestDistance = pathLengths[j];
        closest = j;
      }
    }
    done[closest] = true;
    for (var j = 0; j < numVertices; j++) {
      if (!done[j]) {
        var possiblyCloserDistance = pathLengths[closest] + edges[closest][j];
        if (possiblyCloserDistance < pathLengths[j]) {
          pathLengths[j] = possiblyCloserDistance;
          predecessors[j] = closest;
        }
      }
    }
  }
  return { "startVertex": startVertex,
           "pathLengths": pathLengths,
           "predecessors": predecessors };
    }catch(err){
        return null;   
    }
}

function constructPath(shortestPathInfo, endVertex) {
    try{
  var path = [];
  while (endVertex != shortestPathInfo.startVertex) {
    path.unshift(endVertex);
    endVertex = shortestPathInfo.predecessors[endVertex];
  }
  return path;
    }catch(err){
     return null;   
    }
}

function getTime(shortestPathInfo, endVertex) {
    try{
        return shortestPathInfo.pathLengths[endVertex];
    }catch(err){
     return null;   
    }
}

function addVertex(HostName, IPAddress, SubnetMask){
    Vertices.push(new Vertex(HostName, IPAddress, SubnetMask));
}

function addEdge(sourceHost, destHost, cxnLength, cxnSpeed){
    Edges.push(new Edge(sourceHost, destHost, cxnLength, cxnSpeed));
}

function getIndex(HostName){
    var foundIndex = -1;
    for (var index = 0; index < Vertices.length; index++){
        if (Vertices[index].name.localeCompare(HostName)===0){
            foundIndex = index;
            break;
        }
    }
    return foundIndex;
}

function getHostName(IPAddress){
    var hostName = "";
    for (var index = 0; index < Vertices.length; index++){
        if (Vertices[index].ipAddress.localeCompare(IPAddress)===0){
            hostName = Vertices[index].name;
            break;
        }
    }
    return hostName;
}

function generateAdjacencyMatrix(Vertices, Edges){
//    addData();
    if(Vertices.length > 0){
    var aMatrix = [];
    for (var row = 0; row < Vertices.length; row++){
        var adjRow = [];
        for (var col = 0; col < Vertices.length; col++){
            adjRow.push(_);
        }
        aMatrix.push(adjRow);
    }
    for (var index = 0; index < Edges.length; index ++){
        aMatrix[getIndex(Edges[index].sourceHost)][getIndex(Edges[index].destHost)] = Edges[index].length;//* Edges[index].speed;
        aMatrix[getIndex(Edges[index].destHost)][getIndex(Edges[index].sourceHost)] = Edges[index].length;// * Edges[index].speed;
    }
    return aMatrix;
    }else{
        return null;   
    }
}

function getPath(Source, Destination){
    adjMatrix = generateAdjacencyMatrix(Vertices, Edges);
    if (adjMatrix !==null){
    var shortestPathInfo = shortestPath(adjMatrix, adjMatrix.length, getIndex(Source));

    var path = constructPath(shortestPathInfo, getIndex(Destination));
    return path;
    }else{
        return null;   
    }
//    document.getElementById('PingResult').innerHTML = getLatency(shortestPathInfo, getIndex(Destination));
}

function getLatency(Source, Destination){
    adjMatrix = generateAdjacencyMatrix(Vertices, Edges);
    if (adjMatrix !==null){
    var shortestPathInfo = shortestPath(adjMatrix, adjMatrix.length, getIndex(Source));

    var latency = getTime(shortestPathInfo, getIndex(Destination));
    return latency;
    }else{
        return null;   
    }
//    document.getElementById('PingResult').innerHTML = getLatency(shortestPathInfo, getIndex(Destination));
}

function dec2bin(decValue) {
    'use strict';
    var temp = parseInt(decValue, 10).toString(2);
    while (temp.length < 8) {
        temp = "0" + temp;
    }
    return temp;
//    return decValue;
}

function bin2dec(binValue) {
    'use strict';
    return parseInt(binValue, 2);
}

function isValidIP(IPAddress) {
    'use strict';
    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (IPAddress.match(ipformat)) {
        return true;
    } else {
        return false;
    }
}

function isValidSubnet(SubnetMask) {
    'use strict';
    var subnetFormat = /^(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)\.(0|128|192|224|240|248|252|254|255)$/;
    if (SubnetMask.match(subnetFormat)) {
        return true;
    } else {
        return false;
    }
}

function getNetworkID(IPAddress, SubnetMask) {
    'use strict';
    var IPOctets,
        SMOctets,
        NetworkID;
    if (isValidIP(IPAddress) === false) {
        return "Invalid IP Address";
    } else if (isValidSubnet(SubnetMask) === false) {
        return "Invalid Subnet Mask";
    } else {
        IPOctets = IPAddress.split(".");
        SMOctets = SubnetMask.split(".");
        NetworkID = IPAddress.split(".");
        for (var index = 0; index < IPOctets.length; index ++) {
            if(SMOctets[index] !== 255){
                NetworkID[index] = IPOctets[index] & SMOctets[index];
            }
        }
        return NetworkID.join(".");
    }
}

function getBroadcastID(IPAddress, SubnetMask) {
    'use strict';
    var IPOctets,
        SMOctets,
        BroadcastID;
    if (isValidIP(IPAddress) === false) {
        return "Invalid IP Address";
    } else if (isValidSubnet(SubnetMask) === false) {
        return "Invalid Subnet Mask";
    } else {
        IPOctets = IPAddress.split(".");
        SMOctets = SubnetMask.split(".");
        BroadcastID = IPAddress.split(".");
        for (var index = 0; index < IPOctets.length; index ++) {
            if(SMOctets[index] !== 255){
                BroadcastID[index] = 256 + ((~ SMOctets[index]) | IPOctets[index]);
            }
        }
        return BroadcastID.join(".");
    }
}

function pingHost(Source, Destination) {
    'use strict';
//    if (Vertices.length===0){
//        addData();
//    }
    var SourceIndex,
        SourceVertex,
        SourceIPAddress,
        SourceSubnetMask,
        SourceNetworkID,
        SourceBroadcastID,
        DestinationIndex,
        DestinationVertex,
        DestinationIPAddress,
        DestinationSubnetMask,
        DestinationNetworkID,
        DestinationBroadcastID,
        PingResult = [];
//        PingResult.push("PINGING " + Destination + ": 56 data bytes");
    if (getIndex(Destination)>=0){
        SourceIndex = getIndex(Source),
        SourceVertex = Vertices[SourceIndex],
        SourceIPAddress = SourceVertex.ipAddress,
        SourceSubnetMask = SourceVertex.subnetMask,
        SourceNetworkID = getNetworkID(SourceIPAddress, SourceSubnetMask),
        SourceBroadcastID = getBroadcastID(SourceIPAddress, SourceSubnetMask),
        DestinationIndex = getIndex(Destination),
        DestinationVertex = Vertices[DestinationIndex],
        DestinationIPAddress = DestinationVertex.ipAddress,
        DestinationSubnetMask = DestinationVertex.subnetMask,
        DestinationNetworkID = getNetworkID(DestinationIPAddress, DestinationSubnetMask),
        DestinationBroadcastID = getBroadcastID(DestinationIPAddress, DestinationSubnetMask);
        if( DestinationIPAddress === '') DestinationIPAddress = 'No IP Address';
        PingResult.push("PINGING " + Devices[getDeviceIndexOfInterface(parseInt(Destination))].deviceName + "(" + DestinationIPAddress + "): 56 data bytes\n");
    
        if( DestinationIPAddress === 'No IP Address') DestinationIPAddress = Devices[getDeviceIndexOfInterface(parseInt(Destination))].deviceName;
        if ((SourceNetworkID.localeCompare(DestinationNetworkID) === 0) && (SourceBroadcastID.localeCompare(DestinationBroadcastID) === 0) && (getPath(Source, Destination)!==null)) {
            for (var index = 0; index < 4; index++) {
                PingResult.push("\n\t64 bytes from " + DestinationIPAddress + ": \ticmp_seq=" + index + " \tttl=" + (64 - parseInt(getPath(Source, Destination).length))+ " \ttime=" + (parseInt(getLatency(Source, Destination)) + parseInt(getLatency(Destination, Source))) + " ms");
            }

            PingResult.push("\n\n--- " + DestinationIPAddress + " ping statistics --- \n4 packets transmitted, 4 packets received, 0.0% packet loss");
        } else {
            for (var index = 0; index < 4; index++) {
                PingResult.push("\nRequest timeout for icmp_seq " + index);
            }

            PingResult.push("\n\n--- " + DestinationIPAddress + " ping statistics --- \n4 packets transmitted, 0 packets received, 100.0% packet loss");
        }
    }else{
        for (var index = 0; index < 4; index++) {
            PingResult.push("\nDestination host unreacheable for icmp_seq " + index);
        }
        
        PingResult.push("\n\n--- " + DestinationIPAddress + " ping statistics --- \n4 packets transmitted, 0 packets received, 100.0% packet loss");
    }
//    return PingResult;
//    document.getElementById('PingResult').innerHTML = PingResult;
    return PingResult;
}

function pingIP(SourceIPAddress, DestinationIPAddress){

    return pingHost(getHostName(SourceIPAddress), getHostName(DestinationIPAddress));
}

function traceRoute(Source, Destination){
    var TraceResults = [], path;
    if (getIndex(Destination)>=0) {
        TraceResults.push("Traceroute has started…");
        if(Vertices[getIndex(Destination)].ipAddress ==='') Vertices[getIndex(Destination)].ipAddress = 'No IP Address';
        TraceResults.push("\n\nTraceroute to " + Devices[getDeviceIndexOfInterface(parseInt(Destination))].deviceName + " (" + Vertices[getIndex(Destination)].ipAddress + ") 30 hops max, 72 byte");
        path = getPath(Source, Destination);
        if (path!==null){
            
            for(var index = 0; index < path.length; index ++){
                if(Vertices[path[index]].ipAddress === '') Vertices[path[index]].ipAddress = 'No IP Address';
                TraceResults.push("\n" + (index + 1) + " \t" + Devices[getDeviceIndexOfInterface(parseInt(Vertices[path[index]].name))].deviceName + " (" + Vertices[path[index]].ipAddress + ") \t" + getLatency(Source, Vertices[path[index]].name) + " ms \t" + getLatency(Source, Vertices[path[index]].name) + " ms \t" + getLatency(Source, Vertices[path[index]].name) + " ms");
            }
            TraceResults.push("\n\n Trace complete");
        }else{
            for(var index = 0; index < 10; index ++){
                TraceResults.push("\n" + (index + 1) + " \tDestination host uneacheable");
            }
        }
    }else{
        TraceResults.push("Traceroute has started…");
        TraceResults.push("\n\nTraceroute to " + Destination + " 30 hops max, 72 byte");
        for(var index = 0; index < 30; index ++){
            TraceResults.push("\n" + (index + 1) + "\tRequest timed out");
        }
    }
    return TraceResults;
}

function traceRouteIP(SourceIPAddress, DestinationIPAddress){
    return traceRoute(getHostName(SourceIPAddress), getHostName(DestinationIPAddress));
}

function generateGraph(){
    Vertices = [];
    Edges = [];
    for (var i = 0; i < Interfaces.length; i++) {
        addVertex(Interfaces[i].intID.toString(), Interfaces[i].IPAddress, Interfaces[i].SubnetMask);
    }
    
    for (var i = 0; i < Devices.length; i++) {
        var internalInterfaces = [];
        for (var j = 0; j < Interfaces.length; j++ ){
            if (Interfaces[j].deviceID === Devices[i].deviceID) {
                internalInterfaces.push(Interfaces[j]);
            }
        }
        if (internalInterfaces.length > 1) {
            for (var m = 0; m < internalInterfaces.length - 1; m++) {
                for (var n = m+1; n < internalInterfaces.length; n++) {
                    addEdge(internalInterfaces[m].intID.toString(), internalInterfaces[n].intID.toString(), 1, 1);
                }
            }
        }
    }
    
    for (var i=0; i < Connections.length; i++) {
        addEdge(Connections[i].startIntID.toString(), Connections[i].endIntID.toString(), 1,1);
    }
}

////////////////END OF CODES FROM VERSION 1 ////////////////////////////////

function addToLog(message) {
    var currentDate = new Date();
    document.getElementById('txtLogs').innerHTML += "\n" + currentDate.getHours() + ":" + currentDate.getMinutes() + " -- " + message;
    document.getElementById('messageArea').innerHTML = currentDate.getHours() + ":" + currentDate.getMinutes() + " -- " + message;
    var txtLogs = document.getElementById('txtLogs');
    txtLogs.scrollTop = txtLogs.scrollHeight;
}

function getTool() {
    'use strict';
    return $('input[name=toolbox]:checked').val();;
}

function getUnusedInterfaces(deviceID, intType) {
    'use strict';
    var unusedInterfaces = [];
    for (var i = 0; i < Interfaces.length; i ++) {
        if (Interfaces[i].deviceID === deviceID && (Interfaces[i].intType === intType || intType === 'All')) {
            var unused = true;
            for (var j = 0; j < Connections.length; j++){
                if (Connections[j].startIntID === Interfaces[i].intID || Connections[j].endIntID === Interfaces[i].intID){
                    unused = false;
                    break;
                }
            }
            if (unused === true) {
                unusedInterfaces.push(Interfaces[i]);   
            }
        }
    }
    return unusedInterfaces;
}

function detectCollision(x, y) {
    'use strict';
    var collisionDetected = false;
    if (Devices.length > 0) {
        for (var i = 0; i < Devices.length; i++){
            imgObject = document.getElementById('img' + Devices[i].deviceType);
            var left = Devices[i].x - imgObject.width/2;
            var right = left + imgObject.width;
            var top = Devices[i].y - imgObject.height/2;
            var bottom = top + imgObject.height;
            if ((x >= left) && (x <= right) && (y >= top) && (y <= bottom)) {
                collisionDetected = true;
            }
        }
    }
    return collisionDetected;   
}

function getNewDeviceID() {
    'use strict';
    var newDeviceID = 1;
    if (Devices.length > 0) {
        newDeviceID = Devices[Devices.length-1].deviceID + 1;   
    }
    return newDeviceID;
}

function getNewInterfaceID() {
    'use strict';
    var newIntID = 1;
    if (Interfaces.length > 0) {
        newIntID = Interfaces[Interfaces.length-1].intID + 1;   
    }
    return newIntID;
}

function getNewConnectionID() {
    'use strict';
    var newConnectionID = 1;
    if (Connections.length > 0) {
        newConnectionID = Connections[Connections.length-1].ConnectionID + 1;   
    }
    return newConnectionID;
}

function addMode() {
    'use strict';
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    if (detectCollision(x, y) === false){
        imgObject = document.getElementById('img' + selectedTool);
        var newInterface;
        var newDevice = new Device(getNewDeviceID(), selectedTool, selectedTool + getNewDeviceID(), x , y );
        Devices.push(newDevice);
        addToLog("Added new " + newDevice.deviceType + " named " + newDevice.deviceName);
        if (selectedTool === 'Computer'){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'FastEthernet1', '', '');
            Interfaces.push(newInterface);
        }
        if (selectedTool === 'Server'){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet2', '', '');
            Interfaces.push(newInterface);
        }
        if (selectedTool === 'Laptop' || selectedTool === 'Printer'){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'FastEthernet1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Wireless', 'Wireless1', '', '');
            Interfaces.push(newInterface);
        }
        if (selectedTool === 'Tablet' || selectedTool === 'Phone' ){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Wireless', 'Wireless1', '', '');
            Interfaces.push(newInterface);
        }
        if (selectedTool === 'Router'){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet2', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Wireless', 'Wireless1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Serial', 'Serial1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Serial', 'Serial2', '', '');
            Interfaces.push(newInterface);
        }
        if (selectedTool === 'Switch'){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet2', '', '');
            Interfaces.push(newInterface);
            for (var i = 1; i <=24; i++) {
                newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'FastEthernet' + i, '', '');
                Interfaces.push(newInterface);
            }
        }
        if (selectedTool === 'Internet'){
            for (var i = 1; i <=24; i++) {
                newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Serial', 'Serial' + i, '', '');
                Interfaces.push(newInterface);
            }
        }
        if (selectedTool === 'Network'){
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Serial', 'Serial1', '', '');
            Interfaces.push(newInterface);
            newInterface = new Interface(getNewInterfaceID(), newDevice.deviceID, 'Ethernet', 'GigabitEthernet1', '', '');
            Interfaces.push(newInterface);
        }
        selectedDevice = getDeviceIndexAt(x, y);
        showDeviceProperties(selectedDevice);
    } else {
        addToLog("Another device already exists in the area");
    }
}

function getDeviceIndexOfInterface(IntID) {
    'use strict';
    var deviceIndex = -1;
    if (Devices.length > 0 && Interfaces.length > 0) {
        var devID = -1;
        for (var i = 0; i < Interfaces.length; i++){
            if (Interfaces[i].intID === IntID) {
                devID = Interfaces[i].deviceID;
                break;
            }
        }
        for (var i = 0; i < Devices.length; i++){
            if (Devices[i].deviceID === devID) {
                deviceIndex = i;
                break;
            }
        }
    }
    return deviceIndex;   
}

function getInterfaceIndexOf(IntID) {
    'use strict';
    var intIndex = -1;
    if (Interfaces.length > 0) {
        for (var i = 0; i < Interfaces.length; i++){
            if (Interfaces[i].intID === IntID) {
                intIndex = i;
                break;
            }
        }
    }
    return intIndex;   
}

function drawConnection(x1, y1, x2, y2, type, selected) {
    if (selected === true) {
        context.strokeStyle = "#77C4F7";
        context.lineWidth = 5;
    }

    context.moveTo(x1, y1);

    if (type === 'Wireless') {
        var angle = Math.atan2(y2 - y1, x2 - x1);
        var radius = Math.sqrt((y2 - y1)*(y2 - y1) + (x2 - x1)*(x2 - x1));
        for (var i = 1; i < radius; i += 5) {
            context.beginPath();
            if (selected === false) {
                context.strokeStyle = "#2253d9";
                context.lineWidth = 1;
            }
            context.arc(x1, y1, i, angle - 0.02, angle + 0.02);
            context.stroke();
        }
    }else{
        context.beginPath();
        context.moveTo(x1, y1);
        if (type === 'Ethernet') {
            if (selected === false) {
                context.strokeStyle = "#484848";
                context.lineWidth = 2;
            }
            context.lineTo(x2, y2);
            context.stroke();
        }else if (type === 'Serial') {
            if (selected === false) {
                context.strokeStyle = "#FF0000";
                context.lineWidth = 2;
            }
            var midX = (x1 + x2)/2;
            var midY = (y1 + y2)/2;
            var angle = Math.atan2(y2 - y1, x2 - x1);
            context.lineTo(midX + 5*Math.cos(angle + Math.PI/4), midY+ 5*Math.sin(angle + Math.PI/4));
            context.stroke();
            context.moveTo(midX + 5*Math.cos(angle + Math.PI/4), midY+ 5*Math.sin(angle + Math.PI/4));
            context.lineTo(midX - 5*Math.cos(angle + Math.PI/4), midY- 5*Math.sin(angle + Math.PI/4));
            context.stroke();
            context.moveTo(midX - 5*Math.cos(angle + Math.PI/4), midY- 5*Math.sin(angle + Math.PI/4));
            context.lineTo(x2, y2);
            context.stroke();
        }

    }
}

function drawObjects() {
    'use strict';
    lanArea.width = lanArea.width;
    if (selectedDevice >= 0) {
        imgObject = document.getElementById('img' + Devices[selectedDevice].deviceType);
        context.strokeStyle = "#77C4F7";
        context.lineWidth = 2;
        context.strokeRect(Devices[selectedDevice].x - imgObject.width/2, Devices[selectedDevice].y - imgObject.height/2, imgObject.width, imgObject.height); 
    } else {
        if (selectedConnection >= 0) {
            var startInterfaceID = Connections[selectedConnection].startIntID;
            var startInterfaceIndex = getDeviceIndexOfInterface(startInterfaceID);
            var startInterfaceX = Devices[startInterfaceIndex].x;
            var startInterfaceY = Devices[startInterfaceIndex].y;

            var endInterfaceID = Connections[selectedConnection].endIntID;
            var endInterfaceIndex = getDeviceIndexOfInterface(endInterfaceID);
            var endInterfaceX = Devices[endInterfaceIndex].x;
            var endInterfaceY = Devices[endInterfaceIndex].y;

            drawConnection(startInterfaceX, startInterfaceY, endInterfaceX, endInterfaceY, Connections[selectedConnection].ConnectionType, true);
        }
    }
    
    for (var ConnectionIndex = 0; ConnectionIndex < Connections.length; ConnectionIndex++) {
        
        var startInterfaceID = Connections[ConnectionIndex].startIntID;
        var startInterfaceIndex = getDeviceIndexOfInterface(startInterfaceID);
        var startInterfaceX = Devices[startInterfaceIndex].x;
        var startInterfaceY = Devices[startInterfaceIndex].y;
        
        var endInterfaceID = Connections[ConnectionIndex].endIntID;
        var endInterfaceIndex = getDeviceIndexOfInterface(endInterfaceID);
        var endInterfaceX = Devices[endInterfaceIndex].x;
        var endInterfaceY = Devices[endInterfaceIndex].y;

        drawConnection(startInterfaceX, startInterfaceY, endInterfaceX, endInterfaceY, Connections[ConnectionIndex].ConnectionType, false);
    }
    for (var i = 0; i < Devices.length; i++) {
        imgObject = document.getElementById('img' + Devices[i].deviceType);
        if(imgObject !== null) {
            context.drawImage(imgObject, Devices[i].x - imgObject.width / 2, Devices[i].y - imgObject.height / 2);
            context.fillText(Devices[i].deviceName, Devices[i].x - imgObject.width/3, Devices[i].y + imgObject.height*3/4);
        }
    }
    showDeviceList();
}

function getDeviceIndexAt(x, y) {
    'use strict';
    var deviceIndex = -1;
    if (Devices.length > 0) {
        for (var i = 0; i < Devices.length; i++){
            imgObject = document.getElementById('img' + Devices[i].deviceType);
            var left = Devices[i].x - imgObject.width/2;
            var right = left + imgObject.width ;
            var top = Devices[i].y - imgObject.height/2;
            var bottom = top + imgObject.height ;
            if ((x >= left) && (x <= right) && (y >= top) && (y <= bottom)) {
                deviceIndex = i;
                break;
            }
        }
    }
    return deviceIndex;   
}

function getConnectionIndexAt(x, y) {
    var ConnectionIndex = -1;
    for (var i = 0; i < Connections.length; i++ ) {
        var x1 = Devices[getDeviceIndexOfInterface(Connections[i].startIntID)].x;
        var y1 = Devices[getDeviceIndexOfInterface(Connections[i].startIntID)].y;
        var x2 = Devices[getDeviceIndexOfInterface(Connections[i].endIntID)].x;
        var y2 = Devices[getDeviceIndexOfInterface(Connections[i].endIntID)].y;
        if ((Math.abs(x1 - x2) < 10 && (Math.abs(x1 - x) < 10 || Math.abs(x - x2) < 10)) || (Math.abs(y1 - y2) < 20 && (Math.abs(y1 - y) < 10 || Math.abs(y - y2) < 10))) {
            ConnectionIndex = i;
            break;
        } else {
            if ((x >= Math.min(x1, x2)) && (x <= Math.max(x1, x2)) && (y >= Math.min(y1, y2)) && (y <= Math.max(y1, y2))){
                var slope = (y2 - y1) / (x2 - x1);
                var intercept = y1 - slope * x1;
                if ((Math.abs((y - (slope * x + intercept))) < 10) || (Math.abs(x - (y - intercept)/slope)) < 10)  {
                    ConnectionIndex = i;
                    break;
                }
            }
        }
    }
    return ConnectionIndex;
}

function showDeviceProperties(deviceIndex){
    'use strict';
    if (deviceIndex >= 0) {
        var firstDeviceInterfaceIndex = -1;
        var formProperties = "<form method='POST'><table>";
        formProperties += "<tr><td><label for='txtName'>Name</label></td>";
        formProperties += "<td><input type='textbox' id='txtName' value='" + Devices[deviceIndex].deviceName + "'/></td><td>Type: " + Devices[deviceIndex].deviceType + "</td></tr>";
        if (Devices[deviceIndex].deviceType !== 'Switch' && Devices[deviceIndex].deviceType !== 'Internet') {
            formProperties += "<tr><td><b>Interface</b></td><td><b>IP Address</b></td><td><b>Subnet Mask</b></td></tr>";
            for (var intIndex = 0; intIndex < Interfaces.length; intIndex++) {
                if (Interfaces[intIndex].deviceID === Devices[deviceIndex].deviceID) {
                    if (firstDeviceInterfaceIndex === -1) {
                        firstDeviceInterfaceIndex = intIndex;
                    }
                    formProperties += "<tr><td><input type='textbox' id='txtInterfaceName" + intIndex + "' value='" + Interfaces[intIndex].intName + "' /></td>";
                    formProperties += "<td><input type='textbox' id='txtIPAddress" + intIndex + "' value='" + Interfaces[intIndex].IPAddress + "' /></td>";
                    formProperties += "<td><input type='textbox' id='txtSubnetMask" + intIndex + "' value='" + Interfaces[intIndex].SubnetMask + "' /></td></tr>";
                }
            }
        }
//        formProperties += "<tr><td><input type='button' id='btnUndo' value='Undo Changes' /></td><td><input type='button' id='btnSave' value='Save Changes' /></td><td><input type='button' id='btnDelete' value='Delete Device' /></td></tr>";
        formProperties += "<tr><td><a id='btnUndo' href='#' class='button small secondary'>Undo Changes</a></td><td><a id='btnSave' href='#' class='button small success'>Save Changes</a></td><td><a id='btnDelete' href='#' class='button small alert'>Delete Device</a></td></tr>";
        formProperties += "</table></form>";
        document.getElementById('deviceProperties').innerHTML = formProperties;
        
        var btnUndo = document.getElementById('btnUndo');
        btnUndo.addEventListener('click', function(){
            showDeviceProperties(deviceIndex);
            addToLog("Undone changes to " + Devices[deviceIndex].deviceName);
        }, false);
        
        var btnSave = document.getElementById('btnSave');
        btnSave.addEventListener('click', function(){
            if (Devices[deviceIndex].deviceName.localeCompare(document.getElementById('txtName').value) !==0){
                addToLog("Updated device name from " + Devices[deviceIndex].deviceName + " to " + document.getElementById('txtName').value);
                Devices[deviceIndex].deviceName = document.getElementById('txtName').value;
            }
            if (Devices[deviceIndex].deviceType !== 'Switch') {
                for (var intIndex = 0; intIndex < Interfaces.length; intIndex++) {
                    if (Interfaces[intIndex].deviceID === Devices[deviceIndex].deviceID) {
                        if(Interfaces[intIndex].intName.localeCompare(document.getElementById('txtInterfaceName' + intIndex).value) !==0) {
                            addToLog("Updated Interface Name from " + Interfaces[intIndex].intName + " to " + document.getElementById('txtInterfaceName' + intIndex).value);
                            Interfaces[intIndex].intName = document.getElementById('txtInterfaceName' + intIndex).value;
                        }
                        if (Interfaces[intIndex].IPAddress.localeCompare(document.getElementById('txtIPAddress' + intIndex).value) !==0) {
                            addToLog("Updated IP Address from " + Interfaces[intIndex].IPAddress + " to " + document.getElementById('txtIPAddress' + intIndex).value);
                            Interfaces[intIndex].IPAddress = document.getElementById('txtIPAddress' + intIndex).value;
                        }
                        if(Interfaces[intIndex].SubnetMask.localeCompare(document.getElementById('txtSubnetMask' + intIndex).value) !==0) {
                            addToLog("Updated Subnet Mask from " + Interfaces[intIndex].SubnetMask + " to " + document.getElementById('txtSubnetMask' + intIndex).value);
                            Interfaces[intIndex].SubnetMask = document.getElementById('txtSubnetMask' + intIndex).value;
                        }
                    }
                }
            }
            drawObjects();
        }, false);
        
        var btnDelete = document.getElementById('btnDelete');
        btnDelete.addEventListener('click', function(){
            
            for (var i = Interfaces.length - 1; i >= 0; i--) {
                if (Interfaces[i].deviceID === Devices[deviceIndex].deviceID) {
                    for (var j = Connections.length - 1; j >= 0; j--) {
                        if (Connections[j].startIntID === Interfaces[i].intID || Connections[j].endIntID === Interfaces[i].intID) {
                            addToLog("Deleted Connection from " + Devices[getDeviceIndexOfInterface(Connections[j].startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[j].startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(Connections[j].endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[j].endIntID)].intName + ")");
                            Connections.splice(j, 1);
                        }
                    }
                    Interfaces.splice(i, 1);
                }
                
            }
            addToLog("Deleted " + Devices[deviceIndex].deviceType + " named " + Devices[deviceIndex].deviceName);
        
            Devices.splice(deviceIndex, 1);
            selectedDevice = -1;
            
            drawObjects();
        }, false);
        
//        var formNetworkUtilites = "<label for='txtHostName'>Type IP or HostName:</label>";
//            formNetworkUtilites += "<input type='textbox' id='txtHostName' placeholder='IP or Hostname' />";
//            formNetworkUtilites += "<a id='btnPing' href='#' class='button small success'>Start Ping</a>";
//            formNetworkUtilites += "<a id='btnTraceRoute'  href='#' class='button small success'>Start Traceroute</a>";
//            formNetworkUtilites += "<textarea id='txtTestResults' readonly='readonly' rows='10' wrap='hard'>";
//            formNetworkUtilites += "</textarea>";
        
        var formNetworkUtilites = "<div class='row'><div class='large-12 columns'><div class='row collapse'><div class='small-2 columns'><span class='prefix'>" + Devices[deviceIndex].deviceName + ":</span></div><div class='small-4 columns'>";
            formNetworkUtilites += "<input type='text' id='txtHostName' placeholder='Type IP/Hostname' /></div>";
            formNetworkUtilites += "<div class='small-3 columns'><a id='btnPing' href='#networkUtilities' class='button postfix'>Start Ping</a></div>";
            formNetworkUtilites += "<div class='small-3 columns'><a id='btnTraceRoute'  href='#networkUtilities' class='button postfix info'>Start Traceroute</a></div></div></div>";
            formNetworkUtilites += "<textarea id='txtTestResults' readonly='readonly' rows='10' wrap='hard'>";
            formNetworkUtilites += "</textarea>";
        

          
        
        
            
        document.getElementById("networkUtilities").innerHTML = formNetworkUtilites;
        
//        alert(firstDeviceInterfaceIndex);
        var txtTestResults = document.getElementById('txtTestResults');
        var btnPing = document.getElementById('btnPing');
        btnPing.addEventListener('click', function(){
            generateGraph();
            var pingResults;
            var txtHostName = document.getElementById('txtHostName').value;
            if (isValidIP(txtHostName)===true) {
                pingResults = pingIP(Interfaces[firstDeviceInterfaceIndex].IPAddress, txtHostName);
            }else{
                var txtDeviceIndex = -1;
                for (var devIndex = 0; devIndex < Devices.length; devIndex++) {
                    if (txtHostName === Devices[devIndex].deviceName) {
                        txtDeviceIndex = devIndex;
                        break;
                    }
                }
                var txtDestinationHostName = txtHostName;
                if (txtDeviceIndex >= 0){
                    var firstDestinationInterfaceIndex = -1;
                    for (var intIndex = 0; intIndex < Interfaces.length; intIndex++) {
                        if (Interfaces[intIndex].deviceID === Devices[txtDeviceIndex].deviceID) {
                            if (firstDestinationInterfaceIndex === -1) {
                                firstDestinationInterfaceIndex = intIndex;
                                txtDestinationHostName = Interfaces[firstDestinationInterfaceIndex].intID.toString();
                                break;
                            }
                        }
                    }
                }
                pingResults = pingHost(Interfaces[firstDeviceInterfaceIndex].intID.toString(), txtDestinationHostName);
            }
            txtTestResults.innerHTML = '';
            txtTestResults.focus();
            (function myLoop (i) {      
                txtTestResults.innerHTML += pingResults[pingResults.length - i];
                
                txtTestResults.scrollTop = txtTestResults.scrollHeight;
               setTimeout(function () {   
                  if (--i) myLoop(i);    
               }, 1000)
            })(pingResults.length);
        }, false);
        
        var btnTraceRoute = document.getElementById('btnTraceRoute');
        btnTraceRoute.addEventListener('click', function(){
            generateGraph();
            var traceResults;
            var txtHostName = document.getElementById('txtHostName').value;
            if (isValidIP(txtHostName)===true) {
                traceResults = traceRouteIP(Interfaces[firstDeviceInterfaceIndex].IPAddress, txtHostName);
            }else{
                var txtDeviceIndex = -1;
                for (var devIndex = 0; devIndex < Devices.length; devIndex++) {
                    if (txtHostName === Devices[devIndex].deviceName) {
                        txtDeviceIndex = devIndex;
                        break;
                    }
                }
                var txtDestinationHostName = txtHostName;
                if (txtDeviceIndex >= 0){
                    var firstDestinationInterfaceIndex = -1;
                    for (var intIndex = 0; intIndex < Interfaces.length; intIndex++) {
                        if (Interfaces[intIndex].deviceID === Devices[txtDeviceIndex].deviceID) {
                            if (firstDestinationInterfaceIndex === -1) {
                                firstDestinationInterfaceIndex = intIndex;
                                txtDestinationHostName = Interfaces[firstDestinationInterfaceIndex].intID.toString();
                                break;
                            }
                        }
                    }
                }
                traceResults = traceRoute(Interfaces[firstDeviceInterfaceIndex].intID.toString(), txtDestinationHostName);
            }
            txtTestResults.innerHTML = '';
            txtTestResults.focus();
            (function myLoop (i) {      
                txtTestResults.innerHTML += traceResults[traceResults.length - i]; 
                txtTestResults.scrollTop = txtTestResults.scrollHeight;
               setTimeout(function () {   
                  if (--i) myLoop(i);    
               }, 1000)
            })(traceResults.length);

        }, false);
    }
}

function showConnectionProperties(ConnectionIndex) {
    'use strict';
    if (ConnectionIndex >= 0) {
        var formProperties = "<form method='POST'><table>";
        formProperties += "<tr><td>Connection Type: </td><td colspan=2>" + Connections[ConnectionIndex].ConnectionType + "</td></tr>";
        formProperties += "<tr><td>" + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].startIntID)].deviceName + "</td><td></td><td>" + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].endIntID)].deviceName + "</td></tr>";
        formProperties += "<tr><td>Current Interface:<br><input type='radio' name='startIntID' value='" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intID + "'  id='" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intID + "'checked='checked'/><label for='" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intID + "'>" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intName + "</label>";
        formProperties += "<td></td><td>Current Interface:<br><input type='radio' name='endIntID' value='" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intID + "' id='" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intID + "' checked='checked'/><label for='" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intID + "'>" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intName + "</label></td></tr>";
        
        
        formProperties += "<tr><td>Unused Interface(s):";
        var startUnusedInterfaces = getUnusedInterfaces(Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].startIntID)].deviceID);
        if(startUnusedInterfaces.length > 0){
            for (var i = 0; i < startUnusedInterfaces.length; i ++) {
                formProperties += "<br><input type='radio' name='startIntID' value='" + startUnusedInterfaces[i].intID + "' id='" + startUnusedInterfaces[i].intID + "'/><label for='" + startUnusedInterfaces[i].intID + "'>" + startUnusedInterfaces[i].intName + "</label>";
            }
        }else{
            formProperties += "none";
        }
            
            
        formProperties += "</td><td></td><td>Unused Interface(s):";
        
        var endUnusedInterfaces = getUnusedInterfaces(Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].endIntID)].deviceID);
        if(endUnusedInterfaces.length > 0){
            for (var i = 0; i < endUnusedInterfaces.length; i ++) {
                formProperties += "<br><input type='radio' name='endIntID' value='" + endUnusedInterfaces[i].intID + "' id='" + endUnusedInterfaces[i].intID + "'/><label for='" + endUnusedInterfaces[i].intID + "'>" + endUnusedInterfaces[i].intName + "</label>";
            }
        }else{
            formProperties += "none";
        }
        formProperties += "</td></tr>";
        formProperties += "<tr><td><a id='btnUndo' href='#' class='button small secondary'>Undo Changes</a></td><td><a id='btnSave' href='#' class='button small success'>Save Changes</a></td><td><a id='btnDelete' href='#' class='button small alert'>Delete Connection</a></td></tr>";
        formProperties += "</table></form>";
        document.getElementById('deviceProperties').innerHTML = formProperties;
        
        var btnUndo = document.getElementById('btnUndo');
        btnUndo.addEventListener('click', function(){
            showConnectionProperties(ConnectionIndex);
            addToLog("Undone changes to Connection from " + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intName + ")");
        }, false);
        
        var btnSave = document.getElementById('btnSave');
        btnSave.addEventListener('click', function(){
            var newStartIntID = parseInt($("input:radio[name ='startIntID']:checked").val());
//            alert(getInterfaceIndexOf(newStartIntID));
            var newEndIntID = parseInt($("input:radio[name ='endIntID']:checked").val());
            if (Connections[ConnectionIndex].startIntID !== newStartIntID) {
                addToLog("Moved Connection from " + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].startIntID)].deviceName + "(" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intName + ") to " + Interfaces[getInterfaceIndexOf(newStartIntID)].intName);
                Connections[ConnectionIndex].startIntID = newStartIntID;
            }
            if (Connections[ConnectionIndex].endIntID !== newEndIntID) {
                addToLog("Moved Connection from " + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].endIntID)].deviceName + "(" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intName + ") to " + Interfaces[getInterfaceIndexOf(newEndIntID)].intName);
                Connections[ConnectionIndex].endIntID = newEndIntID;
            }
            drawObjects();
        }, false);
        
        var btnDelete = document.getElementById('btnDelete');
        btnDelete.addEventListener('click', function(){
            addToLog("Deleted Connection from " + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intName + ")");
            Connections.splice(ConnectionIndex, 1);
            selectedConnection = -1;
            drawObjects();
        }, false);
        
        document.getElementById('networkUtilities').innerHTML = "";
    }
}

function checkIfDeviceSupportsInterface(deviceIndex, intType) {
    var supported = false;
    for (var intIndex = 0; intIndex < Interfaces.length; intIndex++) {
        if (Interfaces[intIndex].deviceID === Devices[deviceIndex].deviceID && Interfaces[intIndex].intType === intType) {
            supported = true;
            break;
        }
    }
    return supported;
}

function handleMouseDown(){
    'use strict';
    mouseIsDown = true;
    selectedTool = getTool();
    
    if (selectedTool !== 'Select' && selectedTool !== 'Ethernet' && selectedTool !== 'Wireless' && selectedTool !== 'Serial') {
        addMode();
    }
    if (selectedTool === 'Ethernet' || selectedTool === 'Serial') {
        startX = event.clientX - rect.left;
        startY = event.clientY - rect.top;
        startIndex = getDeviceIndexAt(startX, startY);
        if (startIndex >= 0) {
            if (checkIfDeviceSupportsInterface(startIndex, selectedTool) === true) {
                var unusedInt = getUnusedInterfaces(Devices[startIndex].deviceID, selectedTool);
                if (unusedInt.length > 0) {
                    startIntID = unusedInt[0].intID;   
                }else{
                    startIntID = -1;
                    addToLog("All " + selectedTool + " interfaces are full at " + Devices[startIndex].deviceName);
                }
            }else{
                addToLog(Devices[startIndex].deviceName + " doesn't support " + selectedTool + " connection.");
            }
        }else {
            addToLog("No device detected at Connection start point");
        }
    }
    if (selectedTool === 'Wireless') {
        startX = event.clientX - rect.left;
        startY = event.clientY - rect.top;
        startIndex = getDeviceIndexAt(startX, startY);
        if (startIndex >= 0) {
            startIntID = -1;
            for (var i = 0; i < Interfaces.length; i ++) {
                if (Interfaces[i].deviceID === Devices[startIndex].deviceID && Interfaces[i].intType  === 'Wireless') {
                    startIntID = Interfaces[i].intID;
                    break;
                }
            }
            if (startIntID < 0) {
                addToLog(Devices[startIndex].deviceName + " doesn't support Wireless connection.");
            }
        }else {
            addToLog("No device detected at Connection start point");
        }
    }
    if (selectedTool === 'Select') {
        selectedX = event.clientX - rect.left;
        selectedY = event.clientY - rect.top;
        selectedDevice = getDeviceIndexAt(selectedX, selectedY);
        if (selectedDevice >= 0) {
            selectedConnection = -1;
            showDeviceProperties(selectedDevice);
            addToLog("Selected " + Devices[selectedDevice].deviceName);
        } else {
            ConnectionX = event.clientX - rect.left;
            ConnectionY = event.clientY - rect.top;
            selectedConnection = getConnectionIndexAt(ConnectionX, ConnectionY);
//            alert(selectedConnection);
            if (selectedConnection >= 0) {
                selectedDevice = -1;
                showConnectionProperties(selectedConnection);
                addToLog("Selected Connection from " + Devices[getDeviceIndexOfInterface(Connections[selectedConnection].startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[selectedConnection].startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(Connections[selectedConnection].endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[selectedConnection].endIntID)].intName + ")");
            } else {
                document.getElementById('deviceProperties').innerHTML = "";
                document.getElementById("networkUtilities").innerHTML = "";
            }
        }
    }
    drawObjects();
}

function handleMouseMove(){
    'use strict';
    
    selectedTool = getTool();
    if (selectedTool !== undefined) {
 
        if(selectedTool !== 'Select') {
            lanArea.style.cursor = "none";
        }else{
            lanArea.style.cursor = "auto";
        }
        startX = event.clientX - rect.left;
        startY = event.clientY - rect.top;


        imgObject = document.getElementById('img' + selectedTool);
        drawObjects();
        if (selectedTool !== 'Select' && selectedTool !== 'Ethernet' && selectedTool !== 'Wireless' && selectedTool !== 'Serial') {
            imgObject = document.getElementById('img' + selectedTool);
            context.globalAlpha = 0.5;
            context.drawImage(imgObject, startX - imgObject.width /2, startY - imgObject.height /2);
            context.globalAlpha = 1;
        }else{
            selectedTool = getTool();
            imgObject = document.getElementById('img' + selectedTool);
            if(imgObject !== null) {
                context.drawImage(imgObject, startX - 8 , startY - 10);
            }
        }
    }
    if (mouseIsDown === true) {
        selectedTool = getTool();
        if (selectedTool === 'Select' && selectedDevice >=0) {
            startX = event.clientX - rect.left;
            startY = event.clientY - rect.top;

            drawObjects();
            imgObject = document.getElementById('img' + Devices[selectedDevice].deviceType);
            
            context.globalAlpha = 0.5;
            context.drawImage(imgObject, startX - imgObject.width / 2, startY - imgObject.height / 2);
            context.globalAlpha = 1;
        }else if(startIntID >=0 && (selectedTool === 'Ethernet' || selectedTool === 'Wireless' || selectedTool === 'Serial')) {
            
            var startInterfaceIndex = getDeviceIndexOfInterface(startIntID);
            var startInterfaceX = Devices[startInterfaceIndex].x;
            var startInterfaceY = Devices[startInterfaceIndex].y;
            
            context.globalAlpha = 0.5;
            drawConnection(startInterfaceX, startInterfaceY, startX, startY, selectedTool, false);
            context.globalAlpha = 1;
            
            
        }
    }
}

function handleMouseUp(){
    'use strict';
    mouseIsDown = false;
    if (selectedTool === 'Ethernet' || selectedTool === 'Serial') {
        if (startIntID >= 0) {
            endX = event.clientX - rect.left;
            endY = event.clientY - rect.top;
            endIndex = getDeviceIndexAt(endX, endY);
            if (checkIfDeviceSupportsInterface(endIndex, selectedTool) === true) {
                if (endIndex >= 0 && endIndex !== startIndex) {
                    var unusedInt = getUnusedInterfaces(Devices[endIndex].deviceID, selectedTool);
                    if (unusedInt.length > 0) {
                        endIntID = unusedInt[0].intID;   
                        var newConnection = new Connection(getNewConnectionID(), selectedTool, startIntID, endIntID);
                        startIntID = -1;
                        endIntID = -1;
                        Connections.push(newConnection);
                        addToLog("Added " + selectedTool + " Connection from " + Devices[getDeviceIndexOfInterface(newConnection.startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(newConnection.startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(newConnection.endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(newConnection.endIntID)].intName + ")");
                        selectedConnection = Connections.length - 1;
                        showConnectionProperties(selectedConnection);
                        selectedDevice = -1;
                    }else {
                        addToLog("All " + selectedTool + " interfaces are full at " + Devices[endIndex].deviceName);
                    }
                }else{
                    if (endIndex < 0) {
                        addToLog("No device detected at Connection end point");
                    }
                    if (endIndex === startIndex) {
                        addToLog("Cannot connect Connection to the same device");
                    }
                }
            }else{
                addToLog(Devices[endIndex].deviceName + " doesn't support " + selectedTool + " connection.");
            }
        }
    }
    if (selectedTool === 'Wireless') {
        endX = event.clientX - rect.left;
        endY = event.clientY - rect.top;
        endIndex = getDeviceIndexAt(endX, endY);
        if (endIndex >= 0) {
            endIntID = -1;
            for (var i = 0; i < Interfaces.length; i ++) {
                if (Interfaces[i].deviceID === Devices[endIndex].deviceID && Interfaces[i].intType  === 'Wireless') {
                    endIntID = Interfaces[i].intID;
                    break;
                }
            }
            if (endIntID >= 0) {
                var newConnection = new Connection(getNewConnectionID(), selectedTool, startIntID, endIntID);
                startIntID = -1;
                endIntID = -1;
                Connections.push(newConnection);
                addToLog("Added " + selectedTool + " Connection from " + Devices[getDeviceIndexOfInterface(newConnection.startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(newConnection.startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(newConnection.endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(newConnection.endIntID)].intName + ")");
                selectedConnection =  Connections.length - 1;
                showConnectionProperties(selectedConnection);
                selectedDevice = -1;
            }else{
                addToLog(Devices[endIndex].deviceName + " doesn't support Wireless connection.");
            }
        }else {
            addToLog("No device detected at Connection start point");
        }
    }
    if (selectedTool === 'Select') {
        if (selectedDevice >= 0) {
            selectedX = event.clientX - rect.left;
            selectedY = event.clientY - rect.top;
            if (detectCollision(selectedX, selectedY) === false) {
                Devices[selectedDevice].x = selectedX;
                Devices[selectedDevice].y = selectedY;
            }
        }
    }
    drawObjects();
}

function selectDevice(index){
    if(index >=0 && index < Devices.length) {
        selectedDevice = index;
        showDeviceProperties(index);
        drawObjects();
    }
}

function selectConnection(index){
    if(index >=0 && index < Connections.length) {
        selectedConnection = index;
        selectedDevice = -1;
        showConnectionProperties(index);
        drawObjects();
    }
}

function showDeviceList(){
    'use strict';
    var deviceList = "<table><thead><tr><td>Device</td><td>Interfaces</td><td>IP Address</td><td>Subnet Mask</td></tr></thead>";
    for (var deviceIndex = 0; deviceIndex < Devices.length; deviceIndex++) {
        deviceList += "<tr><td colspan=4><b><a href='javascript:selectDevice(" + deviceIndex + ");'>" + Devices[deviceIndex].deviceName + "</a></b></td></tr>";
        if (Devices[deviceIndex].deviceType !== 'Switch' && Devices[deviceIndex].deviceType !== 'Internet') {
            for (var intIndex = 0; intIndex < Interfaces.length; intIndex++) {
                if (Interfaces[intIndex].deviceID === Devices[deviceIndex].deviceID) {
                    deviceList += "<tr><td></td><td><a href='javascript:selectDevice(" + deviceIndex + ");'>" + Interfaces[intIndex].intName + "</a></td><td><a href='javascript:selectDevice(" + deviceIndex + ");'>" + Interfaces[intIndex].IPAddress + "</a></td><td><a href='javascript:selectDevice(" + deviceIndex + ");'>" + Interfaces[intIndex].SubnetMask + "</a></td></tr>";
                }
            }
        }
    }
    deviceList += "</table>";
    document.getElementById('deviceList').innerHTML = deviceList;
    var ConnectionsList = "<table><thead><tr><td>Starting Device</td><td>Starting Interface</td><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>End Device</td><td>End Interface</td></tr></thead>";
    for (var ConnectionIndex = 0; ConnectionIndex < Connections.length; ConnectionIndex++) {
        ConnectionsList += "<tr><td><a href='javascript:selectConnection(" + ConnectionIndex + ");'>" + Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].startIntID)].deviceName + "</a></td><td><a href='javascript:selectConnection(" + ConnectionIndex + ");'>" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].startIntID)].intName + "</a></td><td><a href='javascript:selectConnection(" + ConnectionIndex + ");'> => </a></td><td><a href='javascript:selectConnection(" + ConnectionIndex + ");'>" +  Devices[getDeviceIndexOfInterface(Connections[ConnectionIndex].endIntID)].deviceName + "</a></td><td><a href='javascript:selectConnection(" + ConnectionIndex + ");'>" + Interfaces[getInterfaceIndexOf(Connections[ConnectionIndex].endIntID)].intName + "</a></td></tr>";
    }
    ConnectionsList += "</table>";
    document.getElementById('ConnectionsList').innerHTML = ConnectionsList;
}

function loadDiagram(index) {
    var saveData = JSON.parse(localStorage.getItem(localStorage.key(index)));
    Devices = saveData[0];
    Interfaces = saveData[1];
    Connections = saveData[2];
    var container = $('.top-bar');
    container.removeClass('expanded');
    selectedDevice = -1;
    selectedConnection = -1;
    drawObjects();
}

function populateDiagramList(){
    var saveDiagramList = "";
    for(var i=0; i<localStorage.length; i++) {
        saveDiagramList += "<li><a href='javascript:loadDiagram(" + i + ");'>" + localStorage.key(i) + "</a></li>";
    }
    document.getElementById('savedDiagramList').innerHTML = saveDiagramList;
}

function clearList() {
    localStorage.clear();
    populateDiagramList();
}

lanArea.addEventListener('mousedown', handleMouseDown, false);
lanArea.addEventListener('mousemove', handleMouseMove, false);
lanArea.addEventListener('mouseup', handleMouseUp, false);
lanArea.addEventListener('mouseout', drawObjects, false);
lanArea.addEventListener('keydown', function(e){
    if(e.keyCode === 46) {
        if(selectedDevice >=0) {
            for (var i = Interfaces.length - 1; i >= 0; i--) {
                if (Interfaces[i].deviceID === Devices[selectedDevice].deviceID) {
                    for (var j = Connections.length - 1; j >= 0; j--) {
                        if (Connections[j].startIntID === Interfaces[i].intID || Connections[j].endIntID === Interfaces[i].intID) {
                            addToLog("Deleted Connection from " + Devices[getDeviceIndexOfInterface(Connections[j].startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[j].startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(Connections[j].endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[j].endIntID)].intName + ")");
                            Connections.splice(j, 1);
                        }
                    }
                    Interfaces.splice(i, 1);
                }
                
            }
            addToLog("Deleted " + Devices[selectedDevice].deviceType + " named " + Devices[selectedDevice].deviceName);
        
            Devices.splice(selectedDevice, 1);
            selectedDevice = -1;
            
            drawObjects();
        }else if(selectedConnection >=0) {
            addToLog("Deleted Connection from " + Devices[getDeviceIndexOfInterface(Connections[selectedConnection].startIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[selectedConnection].startIntID)].intName + ") to " +  Devices[getDeviceIndexOfInterface(Connections[selectedConnection].endIntID)].deviceName + " (" + Interfaces[getInterfaceIndexOf(Connections[selectedConnection].endIntID)].intName + ")");
            Connections.splice(selectedConnection, 1);
            selectedConnection = -1;
            drawObjects();
        }
        document.getElementById('deviceProperties').innerHTML = "";
        drawObjects();
    }
},false);

window.onload = function () {
    populateDiagramList();
    
    var btnSaveDiagram = document.getElementById('btnSaveDiagram');
    btnSaveDiagram.addEventListener('click', function(){
        var txtSaveName = document.getElementById('txtSaveName').value;
        var saveData=[];
        saveData.push(Devices);
        saveData.push(Interfaces);
        saveData.push(Connections);
        localStorage.setItem(txtSaveName, JSON.stringify(saveData));
        $('#saveDiagram').foundation('reveal', 'close');
        populateDiagramList();
    },false);
    
    var btnDownloadDiagram = document.getElementById('btnDownloadDiagram');
    btnDownloadDiagram.addEventListener('click', function(){
        var txtDownloadName = document.getElementById('txtDownloadName').value;
        var saveData=[];
        saveData.push(Devices);
        saveData.push(Interfaces);
        saveData.push(Connections);
//        localStorage.setItem(txtSaveName, JSON.stringify(saveData));
        
        var blob = new Blob([JSON.stringify(saveData)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, txtDownloadName + ".txt");
        $('#downloadDiagram').foundation('reveal', 'close');
    },false);
    
    var loadDevices = [];
    var loadInterfaces = [];
    var loadConnections = [];
    
    function loadFromFile(evt) {
        
        var f = evt.target.files[0]; 

        if (f) {
          var r = new FileReader();
          r.onload = function(e) { 
              var contents = e.target.result;
              var saveData = JSON.parse(contents);
              loadDevices = saveData[0];
                loadInterfaces = saveData[1];
                loadConnections = saveData[2];
          }
          r.readAsText(f);
        } 
//        alert(output);
        

    }
//    
    document.getElementById('txtFileName').addEventListener('change', loadFromFile, false);
    
    var btnLoadFromFile = document.getElementById('btnLoadFromFile');
    btnLoadFromFile.addEventListener('click', function(){
        Devices = loadDevices;
        Interfaces = loadInterfaces;
        Connections = loadConnections;
        drawObjects();
        $('#downloadDiagram').foundation('reveal', 'close');
    },false);

}

window.onresize = function(){
    rect = lanArea.getBoundingClientRect();
};

window.onscroll = function(){
    rect = lanArea.getBoundingClientRect();
};

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent)
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob(["\ufeff", blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if (target_view && is_safari && typeof FileReader !== "undefined") {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var base64Data = reader.result;
							target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && is_safari) {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				save_link.href = object_url;
				save_link.download = name;
				setTimeout(function() {
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name, no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name || "download");
		};
	}

	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));

