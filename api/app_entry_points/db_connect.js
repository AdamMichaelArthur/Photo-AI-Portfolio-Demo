var mongoose = require('mongoose');
var gracefulShutdown;

module.exports = function(dbURI)
{
	mongoose.connect(dbURI, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });

	mongoose.connection.on('connected', function (){
		
	});

	mongoose.connection.on('error', function (err){
		console.log("There was an error connecting to mongo", err)
	});

	mongoose.connection.on('disconnected', function (){
		console.log("Mongo disconnected")
	});

	gracefulShutdown = function(msg, callback) {
		mongoose.connection.close(function() {
			callback();
		});
	};

	process.once('SIGUSR2', function() {
		gracefulShutdown('nodemon restart', function() {
			process.kill(process.pid, 'SIGUSR2');
		});
	});

	process.once('SIGINT', function() {
		gracefulShutdown('nodemon restart', function() {
			process.exit(0);
		});
	});

	process.once('SIGTERM', function() {
		gracefulShutdown('nodemon restart', function() {
			process.exit(0);
		});
	});
}