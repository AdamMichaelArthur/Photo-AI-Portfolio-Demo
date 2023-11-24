/*
	Created Sat Apr 11 11:13 AM
	The purpose of this file is to create syncronization between
	a mongoDB collection and a device, delivered via websockets
	in real time

	The specific use-case we have:

	A freelancer is interested in claiming a bounty.  However, other freelances
	may, at any time, also claim the bounty.  If another freelancer claims a bounty,
	while another freelancer is looking at it, you might have multiple people
	try to claim the bounty.  Thus, when a bounty becomes unavailable, we need to
	update the client device in real time with the status update.

	Currently I'm using mongoose as my mongo node.js driver but I'm very seriously
	thinking of slowly migrating to the official driver.
*/


var mongoose = require( 'mongoose');

// Watch the bounty schema
// Wait for 'bStatus' to change
// If bStatus changes, update all sockets who are watching this document id

// The socket client will connect
// Register the documents it's interested in receiving notifications for
// When notifications happen the change will be sent upstream to the client

var app = require('express')();

//var io = require('socket.io')(server);

//console.log("Watching the Bounty Model for the socket functionality");

module.exports = function(io){

var bRunOnce = false;

var model = mongoose.model("Bounty");

model.watch().on('change', data =>
	  {
	  	// Emit to everyone!  Let the client figure out if it has to
	  	// remove it.  This will be very harsh at scale, but should be fine
	  	// for 10-15 simultaneous users.  Again I need to get this working
	  	// and if we get customers I can come back and make this scalable

	  	if(data.operationType == 'delete'){

	  		io.emit('delete', 'bounty deleted');
	  		return;	
	  	}

	  	if(data.operationType == 'insert'){
	  		//console.log(61, 'emitting insert');
	  		io.emit('create', 'bounty inserted');
	  		return;	
	  	}

		if(data.operationType == 'update'){

	  		io.emit('update', 'bounty updated');
	  	}

	  	fields = Object.keys(data.updateDescription.updatedFields);

	  	//console.log(59, "watch is working")
	  	var bDoLookup = false;
	  	var updatedDoc = { }
	  	for(var i = 0; i < fields.length; i++){

	  		var keys = fields[i].split(".");

	  		var docRoot = keys[0];
	  		var arrPos = keys[1];
	  		var field = keys[2];
	  		if(field == 'bStatus'){
	  			updatedDoc["bStatus"] = data.updateDescription.updatedFields[fields[i]]
	  			updatedDoc["completion_order"] = parseInt(arrPos) + 1;
	  			bDoLookup = true;
	  		}

	  		if(keys[0] == 'release_for_bounty'){
	  			bDoLookup = true;
	  		}
	  		if(field == 'pipeline'){
	  			updatedDoc["pipeline"] = data.updateDescription.updatedFields[fields[i]]
	  		}
	  		updatedDoc["_id"] = data.documentKey._id;
	  	}
	  	if(bDoLookup == true){
	  		// Flesh out
	  		//console.log(94, "Emitting Refresh");
	  		io.emit('my broadcast', updatedDoc);
	  	}

	  })

io.on('connection', function (socket) {

	  console.log(10, "We have a connection bounties");

	  var bounty_id = "12345"

	  socket.on('teleprompter_stop', function(data){
	  	socket.broadcast.emit('teleprompter_stop', data)
	  })

	  socket.on('teleprompter_start', function(data){
	  	socket.broadcast.emit('teleprompter_start', data)
	  })


	  socket.on('filename_override', function(data){
	  	socket.broadcast.emit('filename_override', data)
	  })

	  // Allow the control device to set the orientation
	  /// 1 == backCameraLowerRightLandscape
	  /// 2 == backCameraUpperLeftLandscape
	  /// 3 == backCameraUpperLeftPortrait

	  socket.on('orientation', function(data){
	  	socket.broadcast.emit('orientation', data)
	  })

	  socket.on('kill_recording', function(data){
	  	socket.broadcast.emit('kill_recording', data)
	  })

	  // Turning off the displays saves battery life
	  socket.on('godark', function(data){
	  	socket.broadcast.emit('godark', data)
	  })

	  socket.on('start_uploading', function(data){
	  	socket.broadcast.emit('start_uploading', data)
	  })

	  // Gets a list of the files in the backups folder on the ios device
	  socket.on('get_device_backup_files', function(data){
	  	socket.broadcast.emit('get_device_backup_files', data)
	  })

	  socket.on('receive_device_backup_files', function(data){
	  	socket.broadcast.emit('receive_device_backup_files', data)
	  })

	  // Starts a specific file on a specific device to start the compression and uploading process
	  socket.on('start_file_compression', function(data){
	  	socket.broadcast.emit('start_file_compression', data)
	  })

	  // Deletes a specific file on a specific device
	  socket.on('delete_file_from_backups', function(data){
	  	socket.broadcast.emit('delete_file_from_backups', data)
	  })

	  socket.on('clear_backups', function(data){
	  	socket.broadcast.emit('clear_backups', data)
	  })

	  socket.on('clean_files', function(data){
	  	socket.broadcast.emit('clean_files', data)
	  })


	  socket.on('send_device_is_charging', function (data) {
			socket.broadcast.emit('send_device_is_charging', data)
	  });

	  socket.on('send_device_not_charging', function (data) {
			socket.broadcast.emit('send_device_is_charging', data)
	  });

	  socket.on('request_device_is_charging', function (data) {
			socket.broadcast.emit('request_device_is_charging', data)
	  });

	  socket.on('send_device_file_list', function (data) {
			socket.broadcast.emit('send_device_file_list', data)
	  });

	  socket.on('request_device_file_list', function (data) {
			socket.broadcast.emit('request_device_file_list', data)
	  });

	  socket.on('request_device_restart', function (data) {
			socket.broadcast.emit('request_device_restart', data)
	  });

	  socket.on('request_device_lock', function (data) {
			socket.broadcast.emit('request_device_lock', data)
	  });

	  socket.on('request_device_unlock', function (data) {
			socket.broadcast.emit('request_device_unlock', data)
	  });

	  socket.on('request_device_change_camera', function (data) {
			socket.broadcast.emit('request_device_change_camera', data)
	  });

	  socket.on('request_device_current_view', function (data) {
			socket.broadcast.emit('request_device_current_view', data)
	  });

	  socket.on('request_device_preview_image', function (data) {
			socket.broadcast.emit('request_device_preview_image', data)
	  });

	  socket.on('send_device_preview_image', function (data, image) {
			socket.broadcast.emit('send_device_preview_image', data, image)
	  });
	  
	  socket.on("set_descriptive_filename", function(data){
	  	socket.broadcast.emit('set_descriptive_filename', data);
	  })

	  socket.on("broadcast_statusUpdate", function(data){
	  	socket.broadcast.emit('receive_statusUpdate', data);
	  })

	  //--- request_masterDevice_currentScript
	  socket.on('request_masterDevice_currentScript', function(data){
	  	socket.broadcast.emit('request_masterDevice_currentScript', data)
	  })

	  socket.on('response_masterDevice_currentScript', function(data){
	  	socket.broadcast.emit('response_masterDevice_currentScript', data)
	  })

	  socket.on('request_masterDevice_assertControl', function(data){
	  	socket.broadcast.emit('request_masterDevice_assertControl', data)
	  })

	  socket.on('request_masterDevice_accessToken', function(data){
	  	socket.broadcast.emit('request_masterDevice_accessToken', data)
	  })

	  socket.on('request_masterDevice_giveBountyId', function(data){
	  	socket.broadcast.emit('request_masterDevice_assertControl', data)
	  })

	  socket.on('request_masterDevice_giveCredentials', function(data){
	  	socket.broadcast.emit('request_masterDevice_giveCredentials', data)
	  })

	  socket.on('response_masterDevice_sendCredentials', function(data){
	  	socket.broadcast.emit('response_masterDevice_sendCredentials', data)
	  })

	  socket.on('request_masterDevice_giveFolderId', function(data){
	  	socket.broadcast.emit('request_masterDevice_assertControl', data)
	  })

	  //---
	  socket.on('response_masterDevice_assertsControl', function(data){
	  	socket.broadcast.emit('response_masterDevice_assertsControl', data)
	  })

	  socket.on('response_masterDevice_accessToken', function(data){
	  	socket.broadcast.emit('response_masterDevice_accessToken', data)
	  })

	  socket.on('response_masterDevice_givesBountyId', function(data){
	  	socket.broadcast.emit('response_masterDevice_assertsControl', data)
	  })

	  socket.on('response_masterDevice_givesFolderId', function(data){
	  	socket.broadcast.emit('response_masterDevice_assertsControl', data)
	  })

	  socket.on('pauseResumeTeleprompter', function(data){
	  	socket.broadcast.emit('pauseResumeTeleprompter', data)
	  })

	  //---

	  socket.on('masterDevice_releaseControl', function(data){
	  	socket.broadcast.emit('masterDevice_releaseControl', data)
	  })

	  socket.on('masterDevice_reportStatus', function(data){
	  	socket.broadcast.emit('masterDevice_reportStatus', data)
	  })

	  socket.on('server_open_document', function(data){
	  	socket.broadcast.emit('open_document', data)
	  })

	  socket.on('send_teleprompter_size', function(data){
	  	socket.broadcast.emit('receive_teleprompter_size', data)
	  })

	  socket.on('send_teleprompter_speed', function(data){
	  	socket.broadcast.emit('receive_teleprompter_speed', data)
	  })

	  socket.on('slaveDevice_reportStatus', function(data){
	  	socket.broadcast.emit('slaveDevice_reportStatus', data)
	  })
	  //--

	  socket.on('delete_last', function(data){
	  	socket.broadcast.emit('delete_last', data)
	  })

	  socket.on('commit_last', function(data){
	  	socket.broadcast.emit('commit_last', data)
	  })

	  socket.on('recording', function(data){
	  	socket.broadcast.emit('recording', data)
	  })

	  socket.on('stopped_recording', function(data){
	  	socket.broadcast.emit('stopped_recording', data)
	  })

	  socket.on('set_teleprompter_text', function(data){
	  	socket.broadcast.emit('set_teleprompter_text', data)
	  })

	  socket.on('get_latest_script', function(data){
	  	socket.broadcast.emit('get_latest_script', data)
	  })
	  
	  socket.on('set_teleprompter_speed', function(data){
	  	socket.broadcast.emit('set_teleprompter_speed', data)
	  })

	  socket.on('set_teleprompter_font', function(data){
	  	socket.broadcast.emit('set_teleprompter_font', data)
	  })

	  socket.on('set_teleprompter_size', function(data){
	  	socket.broadcast.emit('set_teleprompter_size', data)
	  })

	  socket.on('set_teleprompter_color', function(data){
	  	socket.broadcast.emit('set_teleprompter_color', data)
	  })

	  socket.on('set_teleprompter_mirror', function(data){
	  	socket.broadcast.emit('set_teleprompter_mirror', data)
	  })

	  socket.on('set_teleprompter_inverted', function(data){
	  	socket.broadcast.emit('set_teleprompter_inverted', data)
	  })

	  socket.on('set_teleprompter_landscape', function(data){
	  	socket.broadcast.emit('set_teleprompter_landscape', data)
	  })

	  socket.on('zoom', function(data){
	  	socket.broadcast.emit('zoom', data)
	  })

	  socket.on('delete_last', function(data){
	  	socket.broadcast.emit('delete_last', data)
	  })

        socket.on("builtInUltraWideCamera", function(data) { 
        	socket.broadcast.emit('builtInUltraWideCamera', data)
        })
        
        socket.on("builtInWideAngleCamera", function(data) { 
        	socket.broadcast.emit('builtInWideAngleCamera', data)
        })
        
        socket.on("builtInDualCamera", function(data) { 
        	socket.broadcast.emit('builtInDualCamera', data)
        })

        socket.on("builtInDualWideCamera", function(data) { 
        	socket.broadcast.emit('builtInDualWideCamera', data)
        })

        socket.on("builtInTelephotoCamera", function(data) { 
        	socket.broadcast.emit('builtInTelephotoCamerae', data)
        })
        
        socket.on("builtInTripleCamera", function(data) { 
        	socket.broadcast.emit('builtInTripleCamera', data)
        })
        
        socket.on("builtInTrueDepthCamera", function(data) { 
        	socket.broadcast.emit('builtInTrueDepthCamera', data)
        })
/*

*/

	  socket.on('set_bounty', function(data){
	  	socket.broadcast.emit('set_bounty', data)
	  })

	  socket.on('get_bounty', function(data){
	  	socket.broadcast.emit('get_bounty', data)
	  })

	  socket.on('zoom', function(data){
	  	socket.broadcast.emit('zoom', data)
	  })

	  socket.on('start_camera_view', function (data) {
	  	console.log(107, 'emitting start camera view')
	   	socket.broadcast.emit('start_camera_view')
	  });

	  socket.on('dismiss_camera_view', function (data) {
	  	console.log(112, 'emitting dismiss camera view')
	   	socket.broadcast.emit('dismiss_camera_view')
	  });

	  socket.on('start', function (data) {
	   	socket.broadcast.emit('start', data)
	  });

	  socket.on('stop', function (data) {
	   	socket.broadcast.emit('stop', data)
	  });

	  socket.on('login', function(data){
	  	socket.broadcast.emit('login', data)
	  })

	  socket.on('request_credentials', function(data){
	  	socket.broadcast.emit('request_credentials', data)
	  })

          socket.on('record', function (data) {
                socket.broadcast.emit('startrecord')
          });

          socket.on('recordstop', function (data) {
                socket.broadcast.emit('stoprecord')
          });
          
	  socket.on('register', function () {
	    // Sends the users _id so we can save the socket.id of their connection
	   	// to their user document

	  });

	  socket.on('watch', function () {
	    // Sends a list of document _id's that we want to be notified about when there
	    // is a change.
	  });

	  socket.on('disconnect', function () {
	    console.log("User Disconnected");
	    // Remove the user's socket.id connection and flag as _disconnected
	  });

	  socket.on('my other event', function (data) {

	  });
	});

}
