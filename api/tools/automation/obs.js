const OBSWebSocket = require('obs-websocket-js').default;
const util = require('util');
const obs = new OBSWebSocket();

(async () => {

	try {
	  const {
	    obsWebSocketVersion,
	    negotiatedRpcVersion
	  } = await obs.connect('ws://127.0.0.1:4455', 'password', {
	    rpcVersion: 1
	  });
	  //console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
	} catch (error) {
	  console.error('Failed to connect', error.code, error.message);
	}
	  
	//var result = await obs.call('SetFilenameFormatting');
	//console.log(result);
	//console.log(util.inspect(result.availableRequests, { colors: true, depth: Infinity }));

	//for (var i of result.availableRequests){
		//console.log(i)
	//}

	//	var result = await obs.call('GetOutputSettings');
	//console.log(util.inspect(result, { colors: true, depth: Infinity }));

	try {
		var result = await obs.call('StopRecord');
	} catch(err){
		console.log(err)
	}

	//const currentProgramSceneName = await obs.call('SetFilenameFormatting', { "filename-formatting": "test"});

	console.log(result)

  
})();

