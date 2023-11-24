
var app = require('express')();

module.exports = function(io){

io.on('connection', function (socket) {

	console.log(8, "connection")
	  var bounty_id = "12345"
	  // The bounty_id of the recordings being done

	  // Starts Simultaneous Recording on all connected devices
	  // When you press record on one device, all devices start recording

	  socket.on('start', function (data) {
	   	socket.broadcast.emit('start', data)
	  });

	  socket.on('stop', function (data) {
	   	socket.broadcast.emit('stop', data)
	  });

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

	  socket.on('send_device_preview_image', function (data) {
			socket.broadcast.emit('send_device_preview_image', data)
	  });

	  socket.on('request_device_status', function (data) {
			socket.broadcast.emit('request_device_status', data)
	  });

	  socket.on('send_device_status', function (data) {
			socket.broadcast.emit('send_device_status', data)
	  });

	  socket.on('kill', function (data) {
	   	socket.broadcast.emit('kill', data)
	  });

	  socket.on('connect', function () {
	    console.log("User Connected");
	    // Update the list of connected devices
	  });

	  socket.on('disconnect', function () {
	    console.log("User Disconnected");
	    // Update the list of connected devices
	  });

	  socket.on('setToWideCamera', function () {
	    console.log("Change to the Wide Angle Lens");
	    // Update the list of connected devices
	  });

	  socket.on('setToUltraWideCamera', function () {
	    console.log("Change to the Ultra Wide Angle Lens");
	    // Update the list of connected devices
	  });

	  socket.on('setToStandardCamera', function () {
	    console.log("Change to the Ultra Wide Angle Lens");
	    // Update the list of connected devices
	  });

	  socket.on('set_bounty', function(data){
	  	socket.broadcast.emit('set_bounty', data)
	  })

	  socket.on('get_latest_script', function(data){
	  	socket.broadcast.emit('get_latest_script', data)
	  })

	})

}