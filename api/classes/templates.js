var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");
var bounties = require("@classes/bounties");
var btoa = require("btoa");
const util = require("util");
var Box = require("@classes/integrations/box/box.js");
var moment = require('moment');
var actions = ["box", "claim", "submit", "reject", "redo"];
var Communication = require("@classes/communication.js")
var Financials = require("@classes/financials.js")
var fs = require('fs');

var PizZip = require('pizzip');
var Docxtemplater = require('docxtemplater');
var path = require('path');
var mammoth = require("mammoth");


module.exports = class Templates {

    constructor(){

    }

    async postProcessing(buffer, filename, path){
        var fileText = await mammoth.extractRawText({buffer: buffer})

        console.log(34, fileText);

        if(filename.indexOf(".docx") != -1){
            var fileNameParts = filename.split(".");
            var newFileName = fileNameParts[0] + ".txt";
            var newFilePath = path + "/" + newFileName;
            fs.writeFileSync(path + "/" + newFileName, fileText.value);
            console.log(38, newFileName);
            return newFilePath;
        }

        return null;
    }

    /*  Looks at the keywords collections for a given brand and creates a suggestion
        of valid merge fields for that brand 
    */   
    determineTemplateMergeFields(){
      
    }

    /* Iterates through the templates for the master account and updates them */
    updateAccountTemplates(){

    }

    /* Iterates through the templates for the brand account and updates them */
    updateBrandTemplates(){

    }

    /* Iterates through the templates for any bounties and updates them */
    updateBountyTemplates(){

    }
}