var vscode = require('vscode');
var outputChannel = vscode.window.createOutputChannel("Fuse");
outputChannel.show();

// Spawn daemon client
var spawn = require('child_process');
var fuseClient = spawn.spawn("fuse", ['daemon-client', 'Simple Client']);

var buffer = new Buffer(0);
fuseClient.stdout.on('data', function (data) {
  // Data is a stream and must be parsed as that
  var latestBuf = Buffer.concat([buffer, data]);
  buffer = parseMsgFromBuffer(latestBuf, function (message) {
    var json = JSON.parse(message);
    var data = json.Data;
    switch(json.Name)
    {
        case "Fuse.BuildStarted":
            outputChannel.clear();
            outputChannel.appendLine("Build started...");
        break;
        case "Fuse.BuildIssueDetected":
            if (data.StartPosition != null)
            {
                outputChannel.appendLine(data.IssueType + " in file '" + data.Path + "' (" + (data.StartPosition.Line+1)+":"+data.StartPosition.Character+"):");
                outputChannel.appendLine(data.Message);
            }
            else
            {
                outputChannel.appendLine(data.Message);
            }
        break;
        case "Fuse.BuildEnded":
            outputChannel.appendLine(data.Status);
            outputChannel.appendLine("");
        break;
        case "Fuse.LogEvent":
            outputChannel.appendLine("LOG: ("+data.ClientName + "): " + data.Message);
        break;
        case "Fuse.ExceptionEvent":
            outputChannel.appendLine("EXCEPTION: ("+data.ClientName + "): " +data.Type + ": " + data.Message);
            outputChannel.appendLine("StackTrace:");
            outputChannel.appendLine(data.StackTrace);
        break;
    }
  });
});

fuseClient.stderr.on('data', function (data) {
  //console.log(data.toString('utf-8'));
});

fuseClient.on('close', function (code) {
  outputChannel.append("Daemon client closed with code " + code);
});

var subRequest = JSON.stringify({
  Name: "Subscribe",
  Id: 0, // Arbitrary identifier to map responses back to requests
  Arguments: {
    Filter: "Fuse.*",
    Replay: false, // Use replay to receive messages sent before you connected
    SubscriptionId: 10 // Arbitrary ID to map events to a particular subscription
  }
});

send(fuseClient, "Request", subRequest);

function parseMsgFromBuffer(buffer, msgCallback) {
  var start = 0;

  while (start < buffer.length) {
    var endOfMsgType = buffer.indexOf('\n', start);
    if (endOfMsgType < 0)
      break; // Incomplete or corrupt data

    var startOfLength = endOfMsgType + 1;
    var endOfLength = buffer.indexOf('\n', startOfLength);
    if (endOfLength < 0)
      break; // Incomplete or corrupt data

    //var msgType = buffer.toString('utf-8', start, endOfMsgType);
    var length = parseInt(buffer.toString('utf-8', startOfLength, endOfLength));
    if (isNaN(length)) {
      console.log('fuse: Corrupt length in data received from Fuse.');
      // Try to recover by starting from the beginning
      start = endOfLength + 1;
      continue;
    }

    var startOfData = endOfLength + 1;
    var endOfData = startOfData + length;
    if (buffer.length < endOfData)
      break; // Incomplete data

    var jsonData = buffer.toString('utf-8', startOfData, endOfData);
    msgCallback(jsonData);
    start = endOfData;
  }

  return buffer.slice(start, buffer.length);
}

function send(fuseClient, msgType, serializedMsg) {
  // Pack the message to be compatible with Fuse Protocol.
  // As:
  // '''
  // MessageType (msgType)
  // Length (length)
  // JSON(serializedMsg)
  // '''
  // For example:
  // '''
  // Event
  // 50
  // {
  //   "Name": "Test",
  //   "Data":
  //   {
  //     "Foo": "Bar"
  //   }
  // }
  // '''
  var length = Buffer.byteLength(serializedMsg, 'utf-8');
  var packedMsg = msgType + '\n' + length + '\n' + serializedMsg;
  try {
    fuseClient.stdin.write(packedMsg);
  }
  catch (e) {
    console.log(e);
  }
}

function activate(context) {
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;