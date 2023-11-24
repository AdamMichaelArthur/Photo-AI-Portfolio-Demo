var mongoose = require( 'mongoose');
const Schema = mongoose.Schema;

var routesSchema = new mongoose.Schema({
	routes: { type: [String], required: true, unique: true }
}, { strict: true });

var appStartupSchema = new mongoose.Schema({
	startupTime: String
}, { strict: false });

mongoose.model("Routes", routesSchema);
