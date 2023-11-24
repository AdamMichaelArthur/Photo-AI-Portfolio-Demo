var express = require('express');
var router = express.Router();
var has = require("@classes/permissions.js");
var validation = require("@classes/validation.js")
var helpers = require("@classes/helpers.js")
var voca = require("voca");
const fs = require('fs');
var mongo = require("@classes/mongo.js");
var Pagination = require("@classes/pagination.js");
var Paginationv2 = require("@classes/paginationv2.js");
var excel = require("@classes/excelimport.js");
var multer = require('multer');
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
var base64 = require('base-64');
var pluralize = require('pluralize')
var moment = require('moment');
const util = require('util');
var bounties = require("@classes/bounties");
var mongoose = require("mongoose");
var jsontoexcel = require("@classes/integrations/jsontoexcel/jsontoexcel.js")

class JsonToExcel {
  constructor(req, res, next) {
    this.className = "jsontoexcel";
    this.req = req;
    this.res = res;
    this.next = next;
    this.user = res.locals.user;
    this.jsontoexcel = new jsontoexcel()

	}

  import(){

    const Excel = require('exceljs');
    var workbook = new Excel.Workbook();

    var importData = this.req.body;
    if(Array.isArray(importData) == false){
      this.error({ "raw": { "message": "The request body should be an array" } } );
    }

    for(var sheet of importData){
      const sheetname = sheet.sheetname;
      const sheetdata = sheet.sheetdata;
      if(sheetdata.length == 0){
        continue;
      }
      const headers = this.getHeaders(sheetdata[0]);
      if(headers.length == 0){
        continue;
      }

      var keys = Object.keys(sheetdata[0])

      var sheet = workbook.addWorksheet(sheetname);
      sheet.columns = headers;
      sheet = this.insertRows(sheetdata, keys, sheet);
      
    }

    workbook.xlsx.writeBuffer()
      .then((buffer) => {
        // done
      this.res.header('content-type','application/vnd.ms-excel');
      this.res.header('content-disposition', `attachment; filename=export.xlsx`);
      this.res.status(200);
      this.res.send(buffer);
      });
  } 

  getHeaders(sheetdata){
    var headers = [];
    var keys = Object.keys(sheetdata)
    //console.log(76, keys);
    for(var i = 0; i < keys.length; i++){
      headers.push({
        header: keys[i],
        key: keys[i]
      })
    }   
    return headers;
  }

  insertRows(data, keys, sheet){
    console.log(80, keys);
    for(var i = 0; i < data.length; i++){
      var dbRow = data[i];
      var row = {}
      row['id'] = i;
      for(var y = 0; y < keys.length; y++){
        var value = dbRow[keys[y]];
        if(typeof value != "object"){
          row[keys[y]] = dbRow[keys[y]]

          console.log(101, row[keys[y]], isNumeric(row[keys[y]]));
          if(isNumeric(row[keys[y]])){
              row[keys[y]] = parseFloat(row[keys[y]]);
            }
            console.log(103, row[keys[y]]);
        }
        else
        {
          if(Array.isArray(value)){
            row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
            console.log(101, isNumeric(row[keys[y]]));
            if(isNumeric(row[keys[y]])){
              row[keys[y]] = parseFloat(row[keys[y]]);
            }
          }
        }
      }
      console.log(94, row);
      sheet.addRow(row);
    }
    return sheet;

  function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
  }

  }

  async exportExcel(jsonData ={}){

    var datasource = helpers.getParameter(req.params[0], "export");
    res.locals.datasource = datasource

    var modelName = checkDatasource(datasource)
    var model = mongoose.model(modelName);

    var data = jsonData;

    var headers = [];
    var keys = Object.keys(data[0])
    for(var i = 0; i < keys.length; i++){
      headers.push({
        header: keys[i],
        key: keys[i]
      })
    }

    const Excel = require('exceljs');
    var workbook = new Excel.Workbook();

    var sheet = workbook.addWorksheet(res.locals.datasource);
    sheet.columns = headers;

    for(var i = 0; i < data.length; i++){
      var dbRow = data[i];
      var row = {}
      row['id'] = i;
      for(var y = 0; y < keys.length; y++){
        var value = dbRow[keys[y]];
        if(typeof value != "object"){
          row[keys[y]] = dbRow[keys[y]]
        }
        else
        {
          if(Array.isArray(value)){
            row[keys[y]] = voca.replaceAll(value.toString(), ",", ", ");
          }
        }
      }
      sheet.addRow(row);
    }

    // write to a new buffer
    workbook.xlsx.writeBuffer()
      .then(function(buffer) {
        // done
        res.header('content-type','application/vnd.ms-excel');
      res.header('content-disposition', `attachment; filename=${modelName}.xlsx`);
              res.status(200);
              res.send(buffer);
      });
  }


  output(Obj) {
    var defaultResponse = helpers.defaultResponseObject(this.className);
    defaultResponse[this.className] = Obj;
    this.res.status(200);
    this.res.json(defaultResponse);
  }

  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    console.log(263, err);
    if (err.raw.message != null) {
      defaultErrorResponse.Error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }
    if(err.raw.extraInfo != null){
      defaultErrorResponse.ErrorDetails.extraInfo = { ... err.raw.extraInfo }
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

}


function next(req, res) {
  var defaultResponseObject = helpers.defaultResponseObject("jsontoexcel")
  defaultResponseObject["jsontoexcel"] = res.locals.response;
  res.status(200);
  res.json(defaultResponseObject);
}

function routeDataSource(req, res, next) {

  console.log(46)
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var endofurl = fullUrl.indexOf("?");
  if (endofurl != -1) {
    fullUrl = fullUrl.substring(0, endofurl);
  }

  var action = helpers.getParameter(fullUrl, "jsontoexcel");

  if (typeof action == 'undefined') {
    action = helpers.getParameter(fullUrl, "jsontoexcel");
  }

  var Action = new JsonToExcel(req, res, next);
  var evalCode = "Action." + action + "()";

  console.log(evalCode);

  try {
    eval(evalCode);
  } catch (err) {
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
    Action.error(desc);
  }
}

var methods = Object.getOwnPropertyNames(JsonToExcel.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

var routestr = `/authorize/`;
router.all(routestr, routeDataSource);

var authenticated = `/authenticated/`;
router.all(authenticated, routeDataSource);

routestr = `*`;
router.all(routestr, routeDataSource);

module.exports = router