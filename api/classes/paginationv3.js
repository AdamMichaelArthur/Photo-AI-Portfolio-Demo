/*
    Created July 4th 2021
    by Adam Arthur
*/

var helpers = require("@classes/helpers.js");
var mongoose = require("mongoose");
var apiVersion = "";
var voca = require("voca");
const util = require('util');
var base64 = require('base-64');

// The purpose of paginationv.js is to support pagination for mongodb aggregate queries
// Right now -- we don't have that ability and it will just dump all the results out.
// Or we just cap the result set -- both are problematic, so with this file we'll
// implement functionality that allows us to paginate the results of a mongodb aggregate
// query.  Another thing is I'm going to try and move away from using Mongoose unless
// it offers genuine value.  I'm unhappy with the direction Mongoose has taken and I prefer
// at this point to use the native Node.js drivers.

exports.listByPage = async function(
  req,
  res,
  pageSize =10,
  aggregateQuery =[],
  _id =0
)
{

  // Count the result set
  // Calculate the number of pages based on the page size
  // get results forward
  // get results back
  // create pagination

}