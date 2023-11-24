import 'dotenv/config'
global.version = process.env.VERSION;
import fs from 'fs';
import path from 'path'
import Voca from 'voca'
import axios from 'axios';

class FileWatcher {
  constructor(directoryToWatch, basedir, templateFile =null) {
    this.directoryToWatch = directoryToWatch;
    this.basedir = basedir;
    this.templateFile = templateFile;
    this.addToPostman = true;
  }

  startWatching() {
    if(this.templateFile !== null){
      this.template = fs.readFileSync(this.templateFile, 'utf-8');
      console.log(16, this.template);
     } else {
      this.template = null;
    }

    this.watcher = fs.watch(this.directoryToWatch, { recursive: true }, (eventType, filename) => {
      console.log(13, filename, eventType);

      if (eventType === 'rename') {
        var parsedFilename = path.parse(filename);

        this.watcher.close();
        // New file created, or deleted...  
        const filePath = path.resolve(this.directoryToWatch + "/" + filename);
        replaceWithTemplate(filePath, filename, this.basedir, this.template, this.addToPostman);

        // Give the filesystem a breather, then start watching again.
        setTimeout( () => {
          this.startWatching();
        }, 5000)
      }

      if(eventType === 'change') {
        this.watcher.close();

        // Look at the modified file
        // Determine what functions it has, if any
        // See if those functions exist in Postman
        // Add them if not
        const filePath = path.resolve(this.directoryToWatch + "/" + filename);
        console.log(46, "Inside a class");
        addNewFunctionToPostman(filePath, this.basedir);

        setTimeout( () => {
          this.startWatching();
        }, 5000)        
      }
    });
  }
}

// End of Class

async function addNewFunctionToPostman(filePath, basedir ="endpoints"){

    console.log(47, filePath);
    const listOfFunctions = extractFunctionsFromFile(filePath);


    var parsedPath = path.parse(filePath);
    var parsedParentPath = path.parse(parsedPath.dir);

    console.log(54, parsedPath);
    console.log(55, parsedParentPath);

    // Determine the route
    var endpointsPos = parsedPath.dir.indexOf(basedir);
    var route = Voca.substring(parsedPath.dir, endpointsPos + basedir.length + 1);

    if(basedir !== 'endpoints'){
      route = basedir + "/" + route;
      console.log(66, route);
    }
    var cwd = parsedParentPath.name;

    var parentId = await findParentIfExists(parsedPath.name, cwd);
    console.log(60, parentId, parsedPath.name, cwd);

    var folderRequests = [];
    if(parentId != ''){
      // We found a folder.  Let's get its items...
      var collection = await getCollection();
      console.log(64, collection);
      folderRequests = determineCollectionFolderItems(collection, parentId);
    }

    function getUniqueItems(array1, array2) {
      const combinedArray = array1.concat(array2);
      const uniqueArray = combinedArray.filter((item, index) => {
        return combinedArray.indexOf(item) === index;
      });
      return uniqueArray;
    }

    function getUniqueItems2(array1, array2) {
      const uniqueItems = array1.filter(item => !array2.includes(item));
      return uniqueItems;
    }

    var functionsToAdd = getUniqueItems2(listOfFunctions, folderRequests);
    console.log(77, functionsToAdd);

    for(var functionName of functionsToAdd){
      var params = await extractFunctionParameters(filePath, functionName);
      var httpVerb = "GET";
      if(params != null){
        httpVerb = "POST";
      }
      console.log(86, params);
      await createPostmanRequest(functionName, parentId, httpVerb, params, route);
    }

}



function extractFunctionsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const functionRegex = /(?:async\s+)?([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\([^)]*\)\s*{([^}]*)}/g;

  var functionDefinitions = [];
  let match;
  while ((match = functionRegex.exec(fileContent)) !== null) {
    const functionName = match[1];
    const functionBlock = match[2];
    //console.log(12, functionName);
    functionDefinitions.push(functionName);
  }

  functionDefinitions = [ ... new Set(functionDefinitions) ];
  const reservedKeywords = [
    'constructor',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield'
  ];

  functionDefinitions = functionDefinitions.filter(func => !reservedKeywords.includes(func));

  return functionDefinitions;
}

// Example usage

// Usage example
console.log("Watching");

const watcher = new FileWatcher(process.env.VERSION + '/endpoints', "endpoints");
watcher.startWatching();

const publicroutes = new FileWatcher(process.env.VERSION + '/public', "public");
publicroutes.startWatching();

const integrations = new FileWatcher(process.env.VERSION + '/integrations', "integrations", process.env.VERSION + "/integrations/template.md");
integrations.addToPostman = false;
integrations.startWatching();

async function createPostmanFolder(name, parentFolder){

  var parentId = await findParentIfExists(name, parentFolder);
  var result = await createFolder(name, parentId);

}

async function createFolder(name, parentFolder =null){

    let obj = {
      "name": Voca.titleCase(name),
      "folder": parentFolder
    }

    if(parentFolder == ''){
      delete obj["folder"];
    }

    let data = JSON.stringify(obj);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.getpostman.com/collections/4af0bba4-e26d-4ac9-99bd-eab2ea97f3ff/folders',
      headers: { 
        'Accept': 'application/vnd.postman.v2+json', 
        'Content-Type': 'application/json', 
        'x-api-key': 'PMAK-645b67b6cd14622371fde547-e026784e6db81ed5aea828402230ed5c7e'
      },
      data : data
    };

    return await axios.request(config);

}

async function findParentIfExists(name, parentFolder){

  try {
    var collection = await getCollection();
  } catch(err){
    console.log(198, "Unable to get collection",err);
    return '';
  }

  var collectionFolders = determineCollectionFolders(collection);

  for (let key in collectionFolders) {
  if (collectionFolders.hasOwnProperty(key)) {
    console.log(215, key);
    var foldername = Voca.lowerCase(key);
    if(foldername == parentFolder){
      console.log(217, collectionFolders[key])
      return collectionFolders[key]["id"];
    }
  }
  }
  console.log(221, name, parentFolder);
  return '';
}

async function getCollection(){
    let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://api.getpostman.com/collections/4af0bba4-e26d-4ac9-99bd-eab2ea97f3ff',
    headers: { 
      'X-API-Key': 'PMAK-645b67b6cd14622371fde547-e026784e6db81ed5aea828402230ed5c7e'
    }
    };

    var response = await axios.request(config);
    return response.data;
}

function determineCollectionFolders(collectionInfo){

  var folders = {};

  function deepIterate(obj) {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively iterate nested objects
        deepIterate(obj[key]);
      } else {
        // Access the property
        if(typeof obj["name"] !== 'undefined'){
          //console.log(219, )
          if(typeof obj["request"] === 'undefined'){
            if(typeof obj["item"] !== 'undefined'){

              for(var item of obj["item"]){
                
                if(typeof item["request"] === 'undefined'){
                  if(Array.isArray(item["item"])){
                    if(typeof item["item"][0] === 'object'){
                      for(let i of item["item"]){
                        deepIterate(i);
                      }
                    }
                  }

                  folders[item["name"]] = 
                    {
                       "name": item["name"],
                       "id": item["id"]
                    }      
                }
              }

              delete obj["item"];
            }
            //console.log(218, obj);
            if(typeof obj["id"] !== 'undefined'){
            folders[obj["name"]] = 
              {
                 "name": obj["name"],
                 "id": obj["id"]
              }
          }}
        }
      }
    }
  }

  deepIterate(collectionInfo);

  return folders;
}

function determineCollectionFolderItems(collectionInfo, folderId){

  var folderRequests = [];

  function deepIterate(obj) {
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively iterate nested objects
        deepIterate(obj[key]);
      } else {
        // Access the property
        
        if(obj["id"] == folderId){
          if(typeof obj["item"] !== 'undefined'){
            for(var item of obj["item"]){
              if(typeof item["request"] !== 'undefined'){
                folderRequests.push(item["name"]);
              }
            }
          }
        }
      }
    }
  }

  deepIterate(collectionInfo);

  folderRequests = [ ... new Set(folderRequests) ];
  return folderRequests;
}

function replaceWithTemplate(filepath, filename, basedir, templateOverride =null, bCreatePostmanRequest =true){

  var currentFilePath = path.parse(filepath);
  var parentFilePath = path.parse(path.dirname(path.resolve(filepath, '..')));
  var currentFilename = currentFilePath.name;

  // console.log(33, filename);
  // console.log(33, currentFilePath);
  // console.log(34, parentFilePath);

  // Step 1 -- determine if the filename is the same as the directory name
  var currentFilePathComponents = currentFilePath.dir.split("/");
  var parentFilePathComponents = parentFilePath.dir.split("/");
  parentFilePathComponents.push(parentFilePath.name);

  var currentFilePathRelativeDirectory = currentFilePathComponents[currentFilePathComponents.length - 1];
  var parentFilePathRelativeDirectory = parentFilePathComponents[parentFilePathComponents.length - 1];

  // Step 2 -- determine if the current file name is the same as the currentFilePathRelativeDirectory
  let bFilenameSameAsCwd = false;
  if(currentFilePathRelativeDirectory == currentFilename){
    bFilenameSameAsCwd = true;
  }

  // Step 3 -- if bFilenameSameAsCwd == false, determine if it exists
  var cwdParentClassExists = false;
  var cwdParentClassFile = currentFilePath.dir + "/" + currentFilePathRelativeDirectory + ".js";
  if(fs.existsSync(cwdParentClassFile)){
    cwdParentClassExists = true;
  }

  // Step 4 -- determine if the pwd parent class exists
  var pwdParentClassExists = false;
  var pwdParentClassFile = parentFilePath.dir + "/" + parentFilePath.name + "/" + parentFilePathRelativeDirectory + ".js";
  if(fs.existsSync(pwdParentClassFile)){
    pwdParentClassExists = true;
  }

  // Step 5 -- define our default scenario
  var parentClassname = "Base";
  var className = Voca.titleCase(Voca.camelCase(currentFilename));
  var importString = '';

  //console.log(53, parentClassname, className, importString);

  // Step 6 -- define our first conditional -- if the parent class exists
  if(pwdParentClassExists){
    parentClassname = Voca.titleCase(Voca.camelCase(parentFilePath.name));
    importString = `import ${parentClassname} from ../${parentFilePath.name}.js`;
  }

  // Step 7 -- define our second conditional
  //console.log(80, bFilenameSameAsCwd, cwd)
  if(!bFilenameSameAsCwd){
    if(pwdParentClassExists){
      parentClassname = Voca.titleCase(Voca.camelCase(currentFilePathRelativeDirectory));
      importString = `import ${parentClassname} from ./${currentFilePathRelativeDirectory}.js`;
    }
  }

  // Step 7 -- define our second conditional
  //console.log(80, bFilenameSameAsCwd, cwd)
  if(!bFilenameSameAsCwd){
    if(cwdParentClassExists){
      parentClassname = Voca.titleCase(Voca.camelCase(currentFilePathRelativeDirectory));
      importString = `
import ${parentClassname} from './${currentFilePathRelativeDirectory}.js'`;
    }
  }  

  // Stepp 9 -- 
  if(bFilenameSameAsCwd){
    if(pwdParentClassExists){
      parentClassname = Voca.titleCase(Voca.camelCase(parentFilePathRelativeDirectory));
      importString = `
import ${parentClassname} from '../${parentFilePathRelativeDirectory}.js'

`;      
    }
  }
  // Step 8 -- define our next conditional  

var classTemplate = `import { Base, ResponseError } from '@base'${importString}

export default class ${className} extends ${parentClassname} {

  constructor(){
    super();
  }

  async test(str ='', num =0, bVar =false, opt =0){
    this.response.reply("works");
    return true;
  }

}`;

if(templateOverride != null){
  classTemplate = '';
  importString = importString.substring(1);
  classTemplate = importString + '\n\n' + eval('`' + templateOverride + '`');
}

  fs.writeFile(filepath, classTemplate, (err) => {
    if (err) {
      if(err.errno == -21){
        // We created a directory...
        var parsedPath = path.parse(err.path);
        var parsedParentPath = path.parse(parsedPath.dir);
        var filename = parsedPath.dir + "/" + parsedPath.name + "/" + parsedPath.name + ".js";
        createPostmanFolder(parsedPath.name, parsedParentPath.name);
        fs.writeFile(filename, '', (err) => {
          console.log(437, filename);
          if (err) {
            console.error('Error creating file:', err);
          } else {
            console.log('File created successfully.');
            replaceWithTemplate(filename, parsedPath.name + ".js", basedir, templateOverride, bCreatePostmanRequest);
            setTimeout( (filename, bCreatePostmanRequest) => {
              console.log(471, "Outside a class", bCreatePostmanRequest)
              if(bCreatePostmanRequest == true){
                addNewFunctionToPostman(filename, basedir);
              }
            }, 5000, filename, bCreatePostmanRequest)
            
          }
        });
      }
    } else {
      console.log('String successfully written to file.');
    }
  });

const apiKey = "PMAK-645b67b6cd14622371fde547-e026784e6db81ed5aea828402230ed5c7e";
const collectionId = "4af0bba4-e26d-4ac9-99bd-eab2ea97f3ff";

}

/*
let data = JSON.stringify({
  "folder": "17843032-e56f71c2-199b-4a5f-974a-6fa86ff0b67a",
  "name": "Loginxx",
  "dataMode": "raw",
  "rawModeData": "{\n    \"userId\": \"adam@contentbounty.com\",\n    \"pwd\": \"Amos3rowe@\"\n}",
  "method": "POST",
  "url": "http://localhost:3002/authorize",
  "protocolProfileBehavior": {
    "disableBodyPruning": true
  },
  "dataDisabled": false,
  "dataOptions": {
    "raw": {
      "language": "json"
    }
  }
});
*/

async function createPostmanRequest(name, folder, httpVerb, params, route =''){

  let data = JSON.stringify({
    "name": name,
    "folder": folder
  });

  route = route + "/" + name;

  console.log(482, route);

  if(httpVerb == "POST"){
    data = JSON.stringify({
      "folder": folder,
      "name": name,
      "dataMode": "raw",
      "rawModeData": JSON.stringify(params),
      "method": "POST",
      "url": `{{apiv2}}/${route}`,
      "protocolProfileBehavior": {
        "disableBodyPruning": true
      },
      "dataDisabled": false,
      "dataOptions": {
        "raw": {
          "language": "json"
        }
      }
    });    
  }

  console.log(472, data);

  let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.getpostman.com/collections/4af0bba4-e26d-4ac9-99bd-eab2ea97f3ff/requests',
  headers: { 
    'Accept': 'application/vnd.postman.v2+json', 
    'Content-Type': 'application/json', 
    'x-api-key': 'PMAK-645b67b6cd14622371fde547-e026784e6db81ed5aea828402230ed5c7e'
  },
  data : data
};
  try {
    var result = await axios.request(config);
  }
    catch(err){
      console.log(551, err);
    }
  console.log(554, result)
  return result.data;

}

async function extractFunctionParameters(pathName, functionName){

    console.log(532, functionName, pathName);

    function searchFileForString(filePath, searchString) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const lines = fileContents.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("export")){
          continue;
        }
        if (lines[i].includes(searchString)) {
          return lines[i];
        }
      }

      return null; // String not found
    }

    var funcDef = searchFileForString(pathName, functionName);
    if(funcDef == null){
      return false;
    }



    funcDef = Voca.replaceAll(funcDef, `'`, `"`);
    var funcArgs;
    const regex = /\(([^)]+)\)/;
    const matches = funcDef.match(regex);

    if (matches && matches.length > 1) {
      const elements = matches[1].split(',');
      funcArgs = elements;
    } else {
      return null;
    }

    const obj = {};
    if(typeof funcArgs === 'undefined'){
       return null; 
    }


    funcArgs.forEach(item => {
  const [key, value] = item.split('=');
  const trimmedKey = key.trim();
    let trimmedValue = value.trim().replace(/"/g, ''); // Remove double quotes if present

    if (trimmedValue === '') {
      trimmedValue = '';
    } else if (trimmedValue === "[]") {
      trimmedValue = [];
    } else {
      trimmedValue = isNaN(trimmedValue) ? trimmedValue : Number(trimmedValue);
    }

    if(trimmedValue == "true"){
      trimmedValue = true;
    }

    if(trimmedValue == "false"){
      trimmedValue = false;
    }

    obj[trimmedKey] = trimmedValue;
  });

    console.log(592, obj);

    return obj;

}




