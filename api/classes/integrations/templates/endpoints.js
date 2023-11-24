var express = require("express");
var router = express.Router();
var Mongo = require("@classes/mongo");
var mongoose = require("mongoose");
var Model = mongoose.model("Stripe");
var helpers = require("@classes/helpers");
var validation = require("@classes/validation");
var voca = require("voca");
var bounties = require("@classes/bounties");
var btoa = require('btoa');
const util = require('util');
var Box = require('@classes/integrations/box/box.js');
var fs = require("fs")
var multer = require('multer');
var storage = multer.memoryStorage()
var axios = require('axios');
var upload = multer({ storage: storage })
const uuidv4 = require('uuid/v4')
var childProcess = require('child_process');
const FormData = require('form-data');
var base64 = require('base-64');
const {google} = require('googleapis');

var post_id_column = ''
var sheetObjs = null;
var post_id, primary_key, sheetname, sheet_id;

// The first step is to download the spreadsheet
  // const options = {
  //     spreadsheetId:process.env.GOOGLE_SPREADSHEET_KEY,
  //     range:`${sheetname}!A1:AA1`
  // }

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

const fetchCredentials = async (key, id, name, s_id) => {

   primary_key = key;

   sheetname = name;
   sheet_id = s_id

  try {
    var content = fs.readFileSync('credentials.json');
  } catch(err){
    return console.log('Error loading client secret file:', err);
  }

  try{ 
  var oAuthClient = await authorize(JSON.parse(content))
 } catch(err){
   console.log(56, err);
 }

  const sheets = google.sheets({version: 'v4', auth: oAuthClient});

  const options = {
      spreadsheetId:sheet_id,
      range:`${sheetname}!A1:AA1`
  }

  sheetsObjs = sheets;


  return sheets;

}

fetchCredentials("Keyword", "12345", "english-speaking-doctors.html", "19AnFWIKnIXc6fWjvVbgiD7x03_nZnDXYL0RYq8p0wls")

async function authorize(credentials, callback) {

  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.

  try {
    var token = fs.readFileSync(TOKEN_PATH);
  } catch(err){
    console.log(113, err);
    //return getNewToken(oAuth2Client, callback);
  }

  oAuth2Client.setCredentials(JSON.parse(token));

  return oAuth2Client

}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

var sheetsAuth;


async function getPrimaryKeyCell(auth, sheet_id) {

  const sheets = google.sheets({version: 'v4', auth});
  sheetsObjs = sheets;
  const options = {
      spreadsheetId:sheet_id,
      range:`${sheetname}!A1:AA1`
  }

  try {
    var headerRow = await sheets.spreadsheets.values.get(options)
  } catch(err){
    console.log(185, "put-post-id.js", err);
  }

  headerRow = headerRow.data.values[0];
  var column = getPostIdColumn(headerRow, sheetsObj)

  function getPostIdColumn(headerRow, sheetsObj){
    var columnChar = 'A'
        headerRow.map((column) => {
          if(voca.snakeCase(column) == 'post_id'){
              post_id_column = columnChar;
              return columnChar
          }
          columnChar = String.fromCharCode(columnChar.charCodeAt() + 1)
        });
    return columnChar;
  }

  var rowPos = await listPrimaryKeyColumnContents(primary_key, sheetsObj);


  var postIdCellPosition = `${column}${rowPos}`;

  await updateSpreadsheetCell(postIdCellPosition, post_id, sheetsObj)
}

async function listPrimaryKeyColumnContents(primaryKey, sheetsObj) {

  const options = {
      spreadsheetId:sheet_id,
      range:`${sheetname}!A1:A100000`
  }

  try {
    var primaryKeyColumn = await sheetsObjs.spreadsheets.values.get(options)
    primaryKeyColumn = primaryKeyColumn.data.values;
  } catch(err){
    console.log(198, err);
  }

  var rowPos = 1;
  var primaryKeyRow = 0;
  for(var rows of primaryKeyColumn){
    for(var cell of rows){
      if(cell == primaryKey){
        primaryKeyRow = rowPos;
        return primaryKeyRow
      }
    }
    rowPos++;
  }

  return primaryKeyRow
}

async function appendToLastRow(startingRow, endingRow, value, sheetsObj, sheet_id, sheetname){

      console.log(196, sheetsObj);
      //var sheets = sheetsObjs
      let values = [ value ];

      const requestBody = {
        values,
      };

      const options = {
        spreadsheetId: sheet_id,
        range: `${sheetname}!${startingRow}:${endingRow}`,
        valueInputOption: "USER_ENTERED",
        requestBody
      }

      console.log(236, options);

      // try {
      //   var result = await sheetsObjs.spreadsheets.values.update(options)
      // } catch(err){
      //   return console.log('The API returned an error: ' + err);
      //}

      await sheetsObjs.spreadsheets.values.append(options)

}

async function updateSpreadsheetCell(cell, value, sheetsObj){

      //var sheets = sheetsObjs
      let values = [ [ value, "a", "b", "c" ] ];

      const requestBody = {
        values,
      };

      const options = {
        spreadsheetId: sheet_id,
        range: `${sheetname}!${cell}:G`,
        valueInputOption: "RAW",
        requestBody
      }

      console.log(236, options);

      // try {
      //   var result = await sheetsObjs.spreadsheets.values.update(options)
      // } catch(err){
      //   return console.log('The API returned an error: ' + err);
      //}

      await sheetsObjs.spreadsheets.values.append(options)

}

function runScript(scriptPath, argvs, callback) {

    // Think about putting this in an environment variable...

    // Local
    scriptPath = scriptPath + 'page_generator.js';

    console.log(258, scriptPath);

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var forkedProcess = childProcess.fork(scriptPath, argvs);

    // listen for errors as they may prevent the exit event from firing
    forkedProcess.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // Message Event
    forkedProcess.on('message', (m) => {
        //console.log('CHILD got message:', m);
        callback(m);
    });

    // execute the callback once the process has finished running
    forkedProcess.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
    });

}

class Templates {
  /* HTTP Functions 
     Can use this.req, this.res, this.user
  */

  constructor(req, res, next, email) {
    this.className = "Templates";
    this.req = req;
    this.res = res;
    this.next = next;
    this.email = email;
    //this.user = res.locals.user;
    var defaultAcct = true;
  }


  error(err) {
    var defaultErrorResponse = helpers.defaultErrorResponseObject();
    console.log(36, err);
    if (err.raw.message != null) {
      defaultErrorResponse.error = 33000;
      defaultErrorResponse.ErrorDetails.Error = 33000;
      defaultErrorResponse.ErrorDetails.Description = err.raw.message;
    }

    this.res.status(500);
    this.res.json(defaultErrorResponse);
  }

  async test(){

    console.log(90, 'test() called')
    var excelBuffer, wordBuffer, asset_directory, band_name;

    var errors = 0;

    // for(var file of this.req.files){
    //   var fileBuffer = file.buffer;
    //   if(file.fieldname == "excel"){
    //     excelBuffer = fileBuffer
    //   }
    //   if(file.fieldname == "word"){
    //     wordBuffer = fileBuffer
    //   }
    // }

    try {
        var response = await axios.get(this.req.body.excel, {responseType: 'arraybuffer'});
      } catch(err){
        console.log(24, err, "Unable to download excel file.  Try changing the permissions inside of Google Sheets");
        
      }

      excelBuffer = response.data;

    try {
        var response = await axios.get(this.req.body.word, {responseType: 'arraybuffer'});
      } catch(err){
        console.log(24, err, "Unable to download excel file.  Try changing the permissions inside of Google Sheets");
        
      }

      wordBuffer = response.data;

    var excelFilePath = process.cwd() + "/" + uuidv4() + ".xlsx"
    var wordFilePath = process.cwd() + "/" + uuidv4() + ".docx" 

    band_name = this.req.body.band_name
    asset_directory = this.req.body.asset_directory
    // We need to get the excel json data.  

    var excelFilePath = process.cwd() + "/" + uuidv4() + ".xlsx"
    var wordFilePath = process.cwd() + "/" + uuidv4() + ".docx" 
    fs.writeFileSync(excelFilePath, excelBuffer, { mode: 0o755 })
    fs.writeFileSync(wordFilePath, wordBuffer, { mode: 0o755 })

    console.log(361, excelFilePath, wordFilePath);

    setTimeout( async () => {

      //console.log(117, "calling spreadsheettojson");

    var jsonFromSpreadsheet = await this.spreadsheetToJson(excelFilePath);

    if(jsonFromSpreadsheet.Result == 'Failure'){
      this.res.json(jsonFromSpreadsheet);
      return;
    }
      var jsonFile = fs.writeFileSync(excelFilePath + ".json", JSON.stringify(jsonFromSpreadsheet, null, 4));

      console.log(349, jsonFromSpreadsheet);

    runScript(process.env.TOP40FILEPATH, [excelFilePath + ".json", wordFilePath, `band_name=${band_name}`, `asset_directory=${asset_directory}`], async (m) => {
        this.res.locals.response = {"OK":m}
        this.res.status(200);
        this.res.set('Content-Type', 'text/plain');

        //var replacedText = await this.cloudflare(m);
        if(process.env.LOCAL == "true"){
          this.res.send(m)
        } else {
          var replacedText = await this.cloudflare(m);
          if(replacedText == false){
            return false;
          }
          this.res.send(replacedText)
        }
        //next(this.req, this.res)   

        console.log(396, excelFilePath, wordFilePath, excelFilePath + ".json")

        fs.unlinkSync(excelFilePath)
        fs.unlinkSync(wordFilePath)
        fs.unlinkSync(excelFilePath + ".json")     
    })

    }, 2000)

  }

  async top40weekly_artistpage(){

    console.log(90, 'test() called')
    var excelBuffer, wordBuffer, asset_directory, band_name;

    var errors = 0;

    // for(var file of this.req.files){
    //   var fileBuffer = file.buffer;
    //   if(file.fieldname == "excel"){
    //     excelBuffer = fileBuffer
    //   }
    //   if(file.fieldname == "word"){
    //     wordBuffer = fileBuffer
    //   }
    // }

    try {
        var response = await axios.get(this.req.body.excel, {responseType: 'arraybuffer'});
      } catch(err){
        console.log(24, err, "Unable to download excel file.  Try changing the permissions inside of Google Sheets");
        
      }

      excelBuffer = response.data;

    try {
        var response = await axios.get(this.req.body.word, {responseType: 'arraybuffer'});
      } catch(err){
        console.log(24, err, "Unable to download excel file.  Try changing the permissions inside of Google Sheets");
        
      }

      wordBuffer = response.data;

    var excelFilePath = process.cwd() + "/" + uuidv4() + ".xlsx"
    var wordFilePath = process.cwd() + "/" + uuidv4() + ".docx" 

    band_name = this.req.body.band_name
    asset_directory = this.req.body.asset_directory
    // We need to get the excel json data.  

    var excelFilePath = process.cwd() + "/" + uuidv4() + ".xlsx"
    var wordFilePath = process.cwd() + "/" + uuidv4() + ".docx" 
    fs.writeFileSync(excelFilePath, excelBuffer, { mode: 0o755 })
    fs.writeFileSync(wordFilePath, wordBuffer, { mode: 0o755 })

    console.log(361, excelFilePath, wordFilePath);

    setTimeout( async () => {

      //console.log(117, "calling spreadsheettojson");

    var jsonFromSpreadsheet = await this.spreadsheetToJson(excelFilePath);

    if(jsonFromSpreadsheet.Result == 'Failure'){
      this.res.json(jsonFromSpreadsheet);
      return;
    }
      var jsonFile = fs.writeFileSync(excelFilePath + ".json", JSON.stringify(jsonFromSpreadsheet, null, 4));

      console.log(349, jsonFromSpreadsheet);

    runScript(process.env.TOP40FILEPATH, [excelFilePath + ".json", wordFilePath, `band_name=${band_name}`, `asset_directory=${asset_directory}`], async (m) => {
        this.res.locals.response = {"OK":m}
        this.res.status(200);
        this.res.set('Content-Type', 'text/plain');

        //var replacedText = await this.cloudflare(m);
        if(process.env.LOCAL == "true"){
          this.res.send(m)
        } else {
          var replacedText = await this.cloudflare(m);
          if(replacedText == false){
            return false;
          }
          this.res.send(replacedText)
        }
        //next(this.req, this.res)   
        fs.unlinkSync(excelFilePath)
        fs.unlinkSync(wordFilePath)
        fs.unlinkSync(excelFilePath + ".json")     
    })

    }, 2000)

  }

  async cloudflare(text =''){
    // curl -X POST -F file=@./apple.png -H "Authorization: Bearer nS2sC5vnbLlfEyeFk-s2LDoFiPPBmdoEYRf9Foa-" https://api.cloudflare.com/client/v4/accounts/2f5ce5745d39affe70b08d2e64f8d4f4/images/v1

    if(text == ''){
      text = this.req.body;
    }

    // Iterate through the text and identify and image src
    var pos = 0;
    var srcIndex = voca.search(text, `src=`, pos);
    var imagesToOffload = [];
    while(srcIndex != -1){
      srcIndex = voca.search(text, `src=`, pos);
      if(srcIndex != -1){
        pos = srcIndex + 4
      
      // Find next quote symbol
      var quoteSymbol = text[srcIndex+4];
      // This should be " or '

      var firstQuotePos = voca.search(text, quoteSymbol, srcIndex)
      var secondQuotePos = voca.search(text, quoteSymbol, firstQuotePos + 1);
      var href = voca.substring(text, firstQuotePos + 1, secondQuotePos);

      // We expect our cloudflare images to have 'imagedelivery.net' in them.  This functionality will break
      // if cloudflare decides to change that pattern

      if(voca.indexOf(href, "imagedelivery") == -1){
        // We likely have a non-cloudflare hosted image

        // Upload Image to Cloudflare and get the result...
        var imgToReplace = {
          "originalSrc": href,
          "offloadedSrc": ""
        }
         //console.log(149, href);
         var offloadedSrc = await this.uploadToCloudflare(href);
         if(offloadedSrc == false){
           return false;
         }
         imgToReplace.offloadedSrc = offloadedSrc;
         imagesToOffload.push(imgToReplace);
      }
     }
    }

    for(var img of imagesToOffload){
      text = voca.replaceAll(text, img.originalSrc, img.offloadedSrc)
    }

    this.res.status(200);
    this.res.set('Content-Type', 'text/plain');
    this.res.send(text)
  }

  async uploadToCloudflare(fileUrl){
    // Cloudflare doesn't seem to support uploading from a url.  Maybe they do.  But it seems we need a local file
    // https://www.contentbounty.com/static/brands/5f02e916088543053e9f2ee7/top_40_weekly/top_40_weekly_-_27-01-22_9_09_28_pm/top_40_artist_page_-_2022-01-03.2/video1.png
    var urlToLocalPath = voca.replace(fileUrl, "https://www.contentbounty.com/static/", "/var/www/static/")

    // Let's see if this file exists
    var urlPathExists = fs.existsSync(urlToLocalPath)

    // Let's see if they uploaded a different file type instead.
    if(urlPathExists == false){
      var checkIfOtherFormatExists = voca.replace(urlToLocalPath, ".png", ".jpg")
      if(fs.existsSync(checkIfOtherFormatExists)){
        urlToLocalPath = checkIfOtherFormatExists;
      } else {

      }
    }

    if(fs.existsSync(urlToLocalPath) == false){
      return fileUrl;
    }

    var buff = fs.readFileSync(urlToLocalPath)
    // Create a form and append image with additional fields
    const form = new FormData();
    form.append('file', buff, urlToLocalPath);

    // Send form data with axios
    var response;

    try {
      response = await axios.post('https://api.cloudflare.com/client/v4/accounts/2f5ce5745d39affe70b08d2e64f8d4f4/images/v1',
      form,
      {
      headers: {
        "Authorization": "Bearer nS2sC5vnbLlfEyeFk-s2LDoFiPPBmdoEYRf9Foa-",
        ...form.getHeaders()
      }
    });
    } catch(err){

      this.res.send(`There was an error with the file ${fileUrl}, Check this file and then try again`);
      return false;
    }

    return response.data.result.variants[0];

    // curl -X POST -F file=@./apple.png -H "Authorization: Bearer nS2sC5vnbLlfEyeFk-s2LDoFiPPBmdoEYRf9Foa-" https://api.cloudflare.com/client/v4/accounts/2f5ce5745d39affe70b08d2e64f8d4f4/images/v1

  }

  async spreadsheetToJson(excelFilePath){

    const excelFileBuff = fs.readFileSync(excelFilePath);
    //const wordFileBuff = fs.readFileSync(wordFilePath);

    console.log(excelFilePath);
    // Create a form and append image with additional fields
    const form = new FormData();
    form.append('spreadsheet', excelFileBuff, 'excelFile.xlsx');

    //fs.writeFileSync("excelFile.xlsx", excelFileBuff, { mode: 0o755} );

    var baseUrl = 'https://app.contentbounty.com/v1.0/api/'

    if(process.env.LOCAL == "true"){
      var baseUrl = 'http://localhost:3000/api/'
    }

    console.log(258, baseUrl)

    //send form data with axios.  Is this top40 specific?  Probably...
    var response;
    try {
      response = await axios.post(baseUrl + 'exceltojson/upload?params=ewogICAgImJyYW5kX2lkIjogIjYyMzM0OWUxNzFkODRkYzk0NDA3ODVmMyIsCiAgICAidmFsaWRhdGlvbiI6IHsKICAgICAgICAic2hlZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAicHJpbWFyeV9rZXkiOiAiU29uZ3MiLAogICAgICAgICAgICAgICAgIm1ldGhvZCI6ICJ1cGRhdGUiLAogICAgICAgICAgICAgICAgImRlZmF1bHQiOiB0cnVlLAogICAgICAgICAgICAgICAgInNoZWV0bmFtZSI6ICJUb3AgVmlkZW9zIgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAicHJpbWFyeV9rZXkiOiAiQWxidW0gTmFtZSIsCiAgICAgICAgICAgICAgICAibWV0aG9kIjogInVwZGF0ZSIsCiAgICAgICAgICAgICAgICAiZGVmYXVsdCI6IHRydWUsCiAgICAgICAgICAgICAgICAic2hlZXRuYW1lIjogIkRpc2NvZ3JhcGh5IgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAicHJpbWFyeV9rZXkiOiAiUXVlc3Rpb24iLAogICAgICAgICAgICAgICAgIm1ldGhvZCI6ICJ1cGRhdGUiLAogICAgICAgICAgICAgICAgImRlZmF1bHQiOiB0cnVlLAogICAgICAgICAgICAgICAgInNoZWV0bmFtZSI6ICJNb3N0IFNlYXJjaGVkIEZvciBRdWVzdGlvbnMiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJwcmltYXJ5X2tleSI6ICJTb25nIFRpdGxlIiwKICAgICAgICAgICAgICAgICJtZXRob2QiOiAidXBkYXRlIiwKICAgICAgICAgICAgICAgICJkZWZhdWx0IjogdHJ1ZSwKICAgICAgICAgICAgICAgICJzaGVldG5hbWUiOiAiTW9zdCBTZWFyY2hlZCBGb3IgU29uZ3MiCiAgICAgICAgICAgIH0KXSB9Cn0=',
        form, {
        headers: {
          ...form.getHeaders()
        }
      });
    } catch(err){
      return err
    }


    console.log(628, baseUrl + 'exceltojson/upload?params=ewogICAgImJyYW5kX2lkIjogIjYyMzM0OWUxNzFkODRkYzk0NDA3ODVmMyIsCiAgICAidmFsaWRhdGlvbiI6IHsKICAgICAgICAic2hlZXRzIjogWwogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAicHJpbWFyeV9rZXkiOiAiU29uZ3MiLAogICAgICAgICAgICAgICAgIm1ldGhvZCI6ICJ1cGRhdGUiLAogICAgICAgICAgICAgICAgImRlZmF1bHQiOiB0cnVlLAogICAgICAgICAgICAgICAgInNoZWV0bmFtZSI6ICJUb3AgVmlkZW9zIgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAicHJpbWFyeV9rZXkiOiAiQWxidW0gTmFtZSIsCiAgICAgICAgICAgICAgICAibWV0aG9kIjogInVwZGF0ZSIsCiAgICAgICAgICAgICAgICAiZGVmYXVsdCI6IHRydWUsCiAgICAgICAgICAgICAgICAic2hlZXRuYW1lIjogIkRpc2NvZ3JhcGh5IgogICAgICAgICAgICB9LAogICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAicHJpbWFyeV9rZXkiOiAiUXVlc3Rpb24iLAogICAgICAgICAgICAgICAgIm1ldGhvZCI6ICJ1cGRhdGUiLAogICAgICAgICAgICAgICAgImRlZmF1bHQiOiB0cnVlLAogICAgICAgICAgICAgICAgInNoZWV0bmFtZSI6ICJNb3N0IFNlYXJjaGVkIEZvciBRdWVzdGlvbnMiCiAgICAgICAgICAgIH0sCiAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICJwcmltYXJ5X2tleSI6ICJTb25nIFRpdGxlIiwKICAgICAgICAgICAgICAgICJtZXRob2QiOiAidXBkYXRlIiwKICAgICAgICAgICAgICAgICJkZWZhdWx0IjogdHJ1ZSwKICAgICAgICAgICAgICAgICJzaGVldG5hbWUiOiAiTW9zdCBTZWFyY2hlZCBGb3IgU29uZ3MiCiAgICAgICAgICAgIH0KXSB9Cn0=')

    return response.data
  }

  async exceltojson(req, res){
    var datasource = req.params[0]
    res.locals.datasource = datasource
    var user = res.locals.user;
    var filter = getExcelImportParameters(req, res, req.query.params);

    if(!filter)
      return false;

    var writeResultsAr = [];

    var errors = 0;
    for(var i = 0; i < req.files.length; i++){
      var fileBuffer = req.files[i];
    
    var entireWorkbook = await getWorkbookData(req, res, filter, fileBuffer, i);

    if(entireWorkbook == false){
      errors++;
      continue;
    }
    }

    console.log(1507, util.inspect(entireWorkbook, false, null, true /* enable colors */))
    if(errors == 0){
      res.locals.response = entireWorkbook;
      next(req, res);
    }

  }

  async uploadFileFromDataUrl(){

    // var http = new XMLHttpRequest();
    // var url = 'localhost:3000/api/';
    // var params = 'orem=ipsum&name=binny';
    // http.open('POST', url, true);

    // //Send the proper header information along with the request
    // http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    // http.onreadystatechange = function() {//Call a function when the state changes.
    //     if(http.readyState == 4 && http.status == 200) {
    //         alert(http.responseText);
    //     }
    // }
    // http.send(params);

    var photoData = this.req.body;
    var photoDataAr = photoData.split(",");
    photoData = photoDataAr[1];

    var buf = new Buffer(photoData, 'base64'); 


    var imagePath = process.env.INVESTINBUL_SITEHOME; // "/var/www/investinbul/site-generator/"
    var logoFilePath = "/images/uploads/" + uuidv4() + ".png"
    var profileFilePath = "/images/uploads/" + uuidv4() + ".png"

    var urlPath = "https://www.investinbul.com"

    var filePath = "/images/uploads/" + uuidv4() + ".png"

    fs.writeFileSync(imagePath + filePath, buf);

    this.res.locals.response = { "fileUrl": urlPath + filePath }
    next(this.req, this.res);
  }

  /// Investinbul
  async outputspreadsheetline(){

    var logoBuffer, profileBuffer, logoName, profileName;

    var errors = 0;

    var sheet_id = "19AnFWIKnIXc6fWjvVbgiD7x03_nZnDXYL0RYq8p0wls";
    var template = "english-speaking-doctors.html";

    var sheets = await fetchCredentials(template, sheet_id)

    var val = Math.floor(1000 + Math.random() * 9000);

    var keywordCell = `=CONCAT(LOWER(SUBSTITUTE(INDIRECT(CONCAT("C", ROW())), " ", "-")), ${val})`

    var spreadsheetLine = `${keywordCell}\t\t${this.req.body["dr-name"]}\t${this.req.body["header"]}\t${this.req.body["email"]}\t${this.req.body["whats-app"]}\t${this.req.body["website"]}\t${this.req.body["google-maps"]}\t${this.req.body["distance-from-taksim"]}\t${this.req.body["neighborhood"]}\t${this.req.body["continent"]}\tEnglish Speaking Doctors\t${this.req.body["type-of-doctor"]}\t\t`

    var bodyKeys = Object.keys(this.req.body);

    console.log(392, this.req.body);

    var values = []
    values.push(keywordCell)
    values.push("")

    for(var key of bodyKeys){
      if((key.indexOf("template") != -1)||(key.indexOf("spreadsheet") != -1))
      { 
          console.log(597, key);
          continue;
      }

      if(key.indexOf("Photo") != -1){
        var photoField = this.req.body[key];
        console.log(397, photoField)
        spreadsheetLine += "\t" + photoField;
      }
      values.push(this.req.body[key])
    }

    //values.splice(14, 0, "", "")

    console.log(610, values);

    await appendToLastRow("A", "ZZ", values, sheets, sheet_id, template);

    //console.log(402, values)

    //this.res.status(200);
    this.res.redirect('https://www.investinbul.com/mobile');
    //this.res.send(spreadsheetLine);
    // Save the filees to list

  }

  /// Custom Code Generator For Authentic Food Quest
  /// 

  async authentic_food_quest_winetour(){
    authentic_food_quest_foodtour(directory ='winetour/')
  }

  async authentic_food_quest_foodtour(directory ='foodtour/'){

    var excelBuffer, wordBuffer, asset_directory, band_name;

    var errors = 0;

    try {
        var response = await axios.get(this.req.body.excel, {responseType: 'arraybuffer'});
      } catch(err){
        console.log(24, err, "Unable to download excel file.  Try changing the permissions inside of Google Sheets");
        
      }

      excelBuffer = response.data;

    try {
        var response = await axios.get(this.req.body.word, {responseType: 'arraybuffer'});
        wordBuffer = response.data;
      } catch(err){
        console.log(24, err, "Unable to download word file.  Try changing the permissions inside of Google Sheets");
        
      }

      console.log(692, wordBuffer);

    //var excelFilePath = process.cwd() + "/" + uuidv4() + ".xlsx"
    //var wordFilePath = process.cwd() + "/" + uuidv4() + ".docx" 

    var article_title = this.req.body.article_title
    asset_directory = this.req.body.asset_directory
    // We need to get the excel json data.  

    var excelFilePath = process.cwd() + "/" + uuidv4() + ".xlsx"
    var wordFilePath = process.cwd() + "/" + uuidv4() + ".docx" 

    try {
      fs.writeFileSync(wordFilePath, wordBuffer, { mode: 0o755 })  
    } catch(err){
      console.log(711, err);
    }

    try {
      fs.writeFileSync(excelFilePath, excelBuffer, { mode: 0o755 })
    } catch(err){
      console.log(705, err);
    }

    console.log(361, excelFilePath, wordFilePath);

    setTimeout( async () => {

    var jsonFromSpreadsheet = await this.spreadsheetToJson(excelFilePath);

    if(jsonFromSpreadsheet.Result == 'Failure'){
      this.res.json(jsonFromSpreadsheet);
      return;
    }
      var jsonFile = fs.writeFileSync(excelFilePath + ".json", JSON.stringify(jsonFromSpreadsheet, null, 4));

    runScript(process.env.AUTHENTICFOODQUESTFILEPATH + directory, [excelFilePath + ".json", wordFilePath, `article_title=${article_title}`, `asset_directory=${asset_directory}`], async (m) => {
      
        this.res.status(200);
        this.res.set('Content-Type', 'text/plain');

        //var replacedText = await this.cloudflare(m);
        //if(process.env.LOCAL == "true"){
          this.res.send(m)
        //} else {
        //  var replacedText = await this.cloudflare(m);
        //  if(replacedText == false){
        //    return false;
        //  }
        //  this.res.send(replacedText)
        //}

        //next(this.req, this.res)   
        //fs.unlinkSync(excelFilePath)
        //fs.unlinkSync(wordFilePath)
        //fs.unlinkSync(excelFilePath + ".json")     
    })

    }, 2000)

  }
  // End of Class
}

function next(req, res) {
  console.log(37);
  var defaultResponseObject = helpers.defaultResponseObject("Templates")
  defaultResponseObject["Templates"] = res.locals.response;
  res.status(200);
  res.json(defaultResponseObject);
}

function routeDataSource(req, res, next) {

  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  var endofurl = fullUrl.indexOf("?");
  if (endofurl != -1) {
    fullUrl = fullUrl.substring(0, endofurl);
  }

  var action = helpers.getParameter(fullUrl, "action");

  var user = decodeURIComponent(helpers.getParameter(fullUrl, "user"));
  var Action = new Templates(req, res, next, user);

  if (typeof user == 'undefined') {
      var desc = {
        raw: {
          message: "user is a requied parameter"
        }
      }
      Action.error(desc);
      return;    
  }

  if (typeof action == 'undefined') {
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
     return Action.error(desc);
  }

  var evalCode = "Action." + action + "()";

  try {
    eval(evalCode);

  } catch (err) {
    console.log(71, err);
    var desc = {
      raw: {
        message: "This method is not defined"
      }
    }
     Action.error(desc);
  }
}

// boxredirect is without auth
// box is with auth

var methods = Object.getOwnPropertyNames(Templates.prototype);
var excludes = ['constructor', 'output', 'error']

const filteredArray = methods.filter(function (x) {
  return excludes.indexOf(x) < 0;
});

//var routestr = `/test/`;
//router.all(routestr, upload.any(), routeDataSource);

router.post("/action", upload.any(), routeDataSource);

routestr = `*`;
router.all(routestr, upload.any(), routeDataSource);

module.exports = router;