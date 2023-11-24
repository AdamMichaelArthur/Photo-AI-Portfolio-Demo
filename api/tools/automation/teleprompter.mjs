import puppeteer from 'puppeteer'; // v13.0.0 or later
import fs from 'fs';
import axios from 'axios';
import { setTimeout } from 'timers/promises';
import { MongoClient, ObjectId } from 'mongodb';
import cp from 'child_process';
import path from 'path';
import { spawn } from 'child_process';
import OBSWebSocket from 'obs-websocket-js';
import util from 'util';
import robot from 'robotjs';
import readline from 'readline';
import exec from 'child_process';
import execSync from 'child_process';
import io from 'socket.io-client';
import FormData from 'form-data';


const dataCollection = "yourfullschools";
const apiBase = "https://app.contentbounty.com/v2.0/api/public/callbacks/bombomb"

class Input {

  constructor(){
    this.rl = readline.createInterface( { input: process.stdin, output: process.stdout } );
  }

  async promptUser(message) {
    return new Promise((resolve) => {
        this.rl.question(message, (answer) => {
          resolve(answer.trim().toUpperCase());
        });
      });
  }
}

class Records {
  
  collectionString = dataCollection;

  bDatabaseConnected = false;
  db;

  prevRecord;
  currRecord;
  lasrRecord;
  currDoc = { }

  connection_uri = 'mongodb://adam:dino@159.223.2.58:27017/contentbounty-prod?authSource=admin&socketTimeoutMS=360&connectTimeoutMS=3600&replicaSet=rs0&directConnection=true'
  
  constructor() {
    this.dbConnect();
  }

  async dbConnect(){
    this.currRecord = null;
    this.prevRecord = new ObjectId("000000000000000000000000");

    this.client = new MongoClient(this.connection_uri, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        let activeConnection = await this.client.connect();
        this.db = activeConnection.db();
        this.bDatabaseConnected = true;
        this.collection = this.db.collection(this.collectionString);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.log(21, "Unable to connect to database", err);
    }
  }

  async getNextRecord(query ={}){

    query["_id"] = { $gt: new ObjectId(this.prevRecord) };

    if(this.currRecord != null){
      this.lastRecord = this.prevRecord;
      this.prevRecord = new ObjectId(this.currRecord["_id"]);
    }

    const result = await this.collection.findOne( query );

    if(result == null){
      console.log("No more records available");
      return false;
    }

    if(result !== null){
      this.prevRecord = result["_id"];
    }
    
    this.currRecord = result["_id"];

    this.currDoc = result;

    return result["_id"].toString();
  }

  async markAsAccepted(){
    let update = { $set: { "bRecordingCompleted" : true, "bRejected": false, "bVideoUploaded": false } };
    let options = { "upsert" : true }
    const result = await this.collection.updateOne( { "_id": this.currRecord }, update, options );    
  }

  async markAsRejected(){
    let update = { $set: { "bRecordingCompleted" : true, "bRejected": true} };
    let options = { "upsert" : true }
    const result = await this.collection.updateOne( { "_id": this.currRecord }, update, options );    
  }

  async markAsSuccessfulUpload(docId, videoId){
    let update = { $set: { "bVideoUploaded" : true, "videoId": videoId } };
    const result = await this.collection.updateOne( { "_id": new ObjectId(docId) }, update );   
  }
}

class Puppeteer {

  browser;
  openPages = [];
  currentTab = 1;
  openedTabs = 1;
  promises = [];

  constructor() {
    this.robot = new Terminal();
    this.browser = puppeteer.launch(
      { headless: false, defaultViewport: null, ignoreDefaultArgs: ['--enable-automation'], 
      args: ['--disable-infobars', 
      '--disable-features=PopupsShouldNotStealFocus',
      '--autoplay-policy=user-gesture-required', '--window-position=330,160', '--window-size=1400,900'] 
    }).then(browser => {
        // Browser is initialized, perform actions with the browser instance
        // For example:
        this.browser = browser;
         // Create a new page
         return browser;
      });
  }

  async bringBrowserWindowToFront() {
    try {
      const context = await this.browser.defaultBrowserContext();
      await context.bringToFront();
    } catch(err){
      console.log(344);
    }
  }

  async closeFirstTab() {
    const browser = await puppeteer.launch();
    const pages = await browser.pages();

    if (pages.length > 0) {
      const firstPage = pages[0];
      await firstPage.close();
    }
    await browser.close();
  }

  nextTab(){
    this.currentTab++;
    if(this.currentTab > this.openedTabs){
      this.currentTab = 1;
    }
    this.robot.focusTab(this.currentTab);
  }

  focusTab(pos){
    this.currentTab = pos;
    this.robot.focusTab(pos);
  }

  async openTabs(tabsAr = [], bOpenRandomLinks = true, autoReject =null){

    this.index = 0;
    this.totalPages = 1;

    for(var i = 0; i < tabsAr.length; i++){
      const page = await this.browser.newPage();
      this.openPages.push(page);
    }

    if(bOpenRandomLinks == true){
      this.currentTab = 1;
      this.openedTabs = 1;
    }

    this.totalPages = this.totalPages + tabsAr.length + 1;

    this.pagesIdle = false;

    for(let tab of tabsAr){
      const page = this.openPages[this.currentTab - 1];
      this.currentTab++;
      this.openedTabs++;

      const inputString = tab;
      const trimmedString = inputString.trim(); // 'example.com'
      let formattedURL = trimmedString;
      if (!/^https?:\/\//i.test(trimmedString)) {
        formattedURL = 'http://' + trimmedString;
      }
      try {
        let isPromise = null;
        isPromise = page.goto(formattedURL)
        .then(() => {
            // Code to execute when the page navigation is successful
            this.promises.push(isPromise);
          })
          .catch((error) => {
            if(autoReject !== null)
              autoReject(true);
            // Code to handle the promise rejection
            // If this fails, we want to automatically reject...  Which is why we have this "autoReject" callback
          });
        
      } catch(err){
        console.log(207, "unable to launch website");
      }
    }

    try {

      var timeoutPromise = setTimeout(5000);
      Promise.race([Promise.all(this.promises), timeoutPromise]);
      
      this.promises = [];
      this.robot.tab();
    } catch (error) {
      console.error('One or more promises rejected:', error);
    }
  }

/* 
      try {
        await page.goto(formattedURL);
        // const htmlContent = await page.content();
        // console.log(164, htmlContent);

        // const linksRaw = htmlContent.match(/href=["'](.*?)["']/g);
        var linksRaw = [];

        await page.waitForSelector('a');
          linksRaw = await page.$$eval('a', (anchors) => {
            return anchors.map((anchor) => anchor.href);
        });

        var links = [];
        for(let link of linksRaw){
          if(link.includes(tab)){
            links.push(link);
          }
        }

        

        if(bOpenRandomLinks == false){
          if(this.pagesIdle == false){
            ;//await this.checkAllTabsIdle();
        }
        return;
        }

        var randomLinks = [];

        var randomLink = links[Math.floor(Math.random() * links.length)];
          for(var link of links){
            if(randomLinks.length > 3){
              continue;
            }
            if (link.includes("contact") || link.includes("about")) {
              randomLink = link;
              randomLinks.push(link);
            } else {
              if (link.includes("admissions") || link.includes("apply")) {
                randomLink = link;
                randomLinks.push(link);
              } else {
               if (link.includes("tour") || link.includes("schedule")) {
                randomLink = link;
                randomLinks.push(link);
              } 
              }
            }
          }

        randomLinks = [ ... new Set(randomLinks) ];
        this.totalPages += randomLinks.length;
        try {
          await this.openTabs(randomLinks, false);
        } catch(err){
          console.log(266, err);
        }
        //this.browseNextPage();
      } catch(err) {  }
*/

  async browseNextPage(){
    if(this.index > this.openPages.length){
      return true;
    }

    var page = this.openPages[this.index];
    page.bringToFront();
    this.index++;
    await setTimeout(10000);
    this.browseNextPage();
  }

  async checkAllTabsIdle() {

    const pages = this.openPages;
    console.log(243, this.totalPages+1, pages.length);
    if((this.totalPages+1) < pages.length)
      return;

    const idlePromises = pages.map(page => page.waitForIdle());
    console.log(243, idlePromises.length);
    await Promise.all(idlePromises);
    console.log('All tabs are idle.');
    this.pagesIdle = true;
  }

  async closeTabs(){
        for (const page of this.openPages) {
          await page.close();
        }
        this.openPages = [];
  }

}

class Recording {
  
  obs;

  constructor(){
    this.obs = new OBSWebSocket();
    this.connect();
  }

  async connect(){
    try {
      await this.obs.connect('ws://127.0.0.1:4455', 'password', { rpcVersion: 1 });
    } catch(err){
      console.error("Unable to connect to OBS Studio.  Fatal Error -- will exit process");
      process.exit(1);
    }
    console.log("Connected to OBS Studio");
  }

  async startRecording(){
    // Just in case -- sockets aren't the most reliable
    await this.stopRecording();
    for(var i = 0; i < 10; i++){
      try {
        setTimeout(500);
        var result = await this.obs.call('StartRecord');
      } catch(err){
        //console.log(141, i, "Unable to start record -- waiting 500ms then trying again");
        await setTimeout(500);
        continue;
      }
      return true;
    }
    console.log(147, "Fatal Error: Unable to start recording with OBS");
    process.exit(1);
    return false;
  }

  async stopRecording(){
    try {
      var { outputPath } = await this.obs.call('StopRecord');
      setTimeout(500);
      process.stdout.write('\x07');
    } catch(err){
      return false;
      //console.log(err)
    }
    return outputPath;
  }
}

class Request {
  constructor(){

  }

  authorization = '';

  setConfig(url ="", method ="get", headers =[], data =null, contentType ='application/json'){
    this.config = {
      method: method,
      maxBodyLength: Infinity,
      url: url,
      headers: { "Content-Type": 'application/json' }
    }

    if(headers !== null){
      this.config["headers"] = headers;
    }

    if(this.authorization != ''){
      this.config["headers"]["Authorization"] = this.authorization
    }

    if(data !== null){
      if(contentType == 'application/json'){
        data = JSON.stringify(data);
      }
      if(contentType == 'multipart/form-data'){

      }
      if(data !== null){
        this.config["data"] = data;
      } else {
        this.config["data"] = '';
      }
    }
  }

  setAuthorization(headerValue =''){
    this.authorization = headerValue;
  }

  setBearerToken(token){
    this.setAuthorization('Bearer ' + token);
  }

  setBasicAuth(key){
    this.setAuthorization('Basic ' + key);
  }

  async getRequest(url, headers =null){
    this.setConfig(url);
    return await this.request();
  }

  async request(){
    try {
      var response = await axios.request(this.config);
    } catch(err){
      return err.data;
    }
    return response.data;
  }

  async postRequest(url, headers =null, data =null, contentType ='application/json'){
    this.setConfig(url, "post", data, contentType);
    return await this.request();
  }
}

class Devices {

  lockGroup = '79417';
  device = '1138778'
  request;

  constructor(){
    this.request = new Request();
    this.request.setBasicAuth('bFI3emhZdFNLRlhIM2FKZXpmajRGNXNXMzdRNDRCeFZnQ3pzV2c2VFNyV20ycUpJSzJQYjhSaEZ0b3pzMEN2VTo=');
    this.lockDevices();
  }

  async lockDevices(){
    const lockDeviceURL = `https://a.simplemdm.com/api/v1/device_groups/${this.lockGroup}/devices/${this.device}`
    var result = await this.request.postRequest(lockDeviceURL);
  }
}

class BombBombIntegration{

  access_token = '';

  constructor(){

  }

  async getToken(){
    let config = { method: 'get', url: apiBase + '/getToken', maxBodyLength: Infinity, 
                    headers: { 'Content-Type': 'application/json' } };  
      try {
        var token = await axios.request(config);
      } catch(err){
        if(err.response.status == 401){
                return await this.getFreshToken();
              } else {
                return false;
              }
          return false;      
        }
        
      token = token.data;
      this.access_token = token.token.access_token;
      return this.access_token;
  }

  async getFreshToken(){
    let config = { method: 'get', url: apiBase+ '/getFreshToken', maxBodyLength: Infinity, 
                    headers: { 'Content-Type': 'application/json' } };  

      try {
        var token = await axios.request(config);
      } catch(err){
        console.log(289, err);
        return false;
      }
      token = token.data;
      this.access_token = token.access_token;
      return this.access_token
    }

  async uploadVideo(filePath, filename ='', description ='', callback =(filePath, response) => {
      if(typeof response["videoId"] !== 'undefined'){
        var fileParts = path.parse(filePath);
        var docId = fileParts.name;
        console.log(fileParts, fileParts, docId);
      }
    }){
    var currentToken = await this.getToken();

    const curlCommand = 'curl';
    const url = 'https://api.bombbomb.com/v2/videos/';
    const file = filePath;
    const token = currentToken

    // Create the curl command arguments
    const curlArgs = [
      '--location',
      url,
      '--header',
      `Authorization: Bearer ${token}`,
      '--form',
      `file=@${file}`,
      '--form',
      `name="${filename}"`,
      '--form',
      `description="${description}"`,
    ];

    // Spawn the curl command
    const curlProcess = spawn(curlCommand, curlArgs);

    let responseData = '';
    // Listen for output
    curlProcess.stdout.on('data', (data) => {
      responseData += data;
    });

    curlProcess.stderr.on('data', (data) => {
      //console.error(`stderr: ${data}`);

    });

    curlProcess.on('close', (code) => {
      //console.log(`child process exited with code ${code}`);
      //console.log('Response:', responseData);
      try {
        var response = JSON.parse(responseData);
        callback(filePath, response);
      } catch(err){
        console.log(err);
        this.getFreshToken();
        // Unable to parse response data -- means we probably got an error
      }
      
    });
  }
}

class Uploads {
  constructor(){

  }

  async start(filePath ='', filename ='', description ='', callback){
    var bombomb = new BombBombIntegration();
    let uploadResult = await bombomb.uploadVideo(filePath, filename, description, callback);
  }
}

class Terminal {

  constructor(){

  }

  bringTerminalToFront() {

  }

  tab() {
    robot.keyTap('tab', 'command')
    robot.keyTap('escape')    
  }

  async focusTab(tabNum){
    try {
      //robot.keyTap('3', 'command');
    } catch(err) { }

    try {
      robot.keyToggle(String(tabNum), 'down', 'command');
      await setTimeout(25);
      robot.keyToggle(String(tabNum), 'up', 'command');
    } catch(err) { 
      console.log(556, err);
    }
   }


   async scrollDown(){
     var interval = 0;
     var counter = 0;
     var t = -40
     const min = -55;
      const max = -35;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      t = randomNumber
     var timeout = setInterval( () => {
       robot.scrollMouse(0, t);
       if(counter >= 5){
         t = t + counter;
       }
       //console.log(565, interval)
       if(counter > 10){
         clearInterval(timeout)
       }
       interval = interval + 3;
       counter++;
     }, 1 )
   }

   async scrollUp(){
     var interval = 0;
     var counter = 0;
     var t = -40
     const min = -55;
      const max = -35;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      t = randomNumber
     var timeout = setInterval( () => {
       robot.scrollMouse(0, t*-1);
       if(counter >= 5){
         t = t + counter;
       }
       //console.log(565, interval)
       if(counter > 10){
         clearInterval(timeout)
       }
       interval = interval + 3;
       counter++;
     }, 1 )
   }

  sendTerminalToBack() {
    //robot.keyToggle('h', 'down', 'command');
    //robot.keyTap('tab', 'command')
    //robot.keyTap('escape')
  }
}

class FileManagement {
  constructor(){

  }

  renameFile(filename, name){
    const filenameParts = path.parse(filename);
    const nameParts = path.parse(name);
    fs.renameSync(filename, nameParts.base + filenameParts.ext);
    
    const updatedPath = filenameParts.dir + "/" + nameParts.base + filenameParts.ext
    return updatedPath;
  }
}

class Script {
  script = '';

  spellOutDigits(number) {
  const digitNames = [
    "zero", "one", "two", "three", "four",
    "five", "six", "seven", "eight", "nine"
  ];

  const digits = Array.from(String(number), Number);
  const spelledOutDigits = digits.map(digit => digitNames[digit]);

  return spelledOutDigits.join("\n");
}

  getScript(currRecord, remaining){
    let school = currRecord["company_name"];
    let email = currRecord["email"];
    let name = currRecord["first_name"];
    let subdivision = currRecord["Subdivision"];
    let friendlyName = currRecord["Friendly Name"];
    let zip = currRecord["Zip"];
      var script = `Hi ${name}, my is Adam.

I'm going to make this really short, I was searching private schools in ${subdivision}, saw your website.  We're a marketing agency that specializes in getting private schools new enrollments. 

I'm fairly confident we can get ${friendlyName} anywhere from twenty to forty new students that otherwise wouldn't have enrolled, based on the the results we're getting with our other private school customers.  

I reached out to you specifically because looking the Google search results for the 

${zip} 

zip code, there are hidden opportunities that other schools are not taking advantage of, and there's a good chance there's room for you to grow, if that's something you want to do.

One of the nice things about my job is that I sell a product that generates significantly more revenue for my customers than it costs, which makes the sales process kind of easy.  I'd love to have a chat with you if getting more students is aligned with your goals as a school.  

There's a calendy link in the email or I'm happy to send over pricing or answer any questions you might have.

Either way, thanks for watching.  Hope to talk soon.

---
There are ${remaining} videos left in this loo. 
---





end





end
`;

  return script;
  }
}

class SimulateBrowser {
  constructor(){
    this.robot = new Terminal();
  }

  async simulate(totalTabs, totalTime =60, lastFocus =20){

    const startingTimestampInSeconds = Math.floor(Date.now() / 1000);

    var bSplitTabsTime = Math.ceil((totalTime - lastFocus) / totalTabs) * 1000;

    this.puppeteer.focusTab(2);

    for(let i = 0; i < totalTabs; i++){      
      let r = Math.ceil((bSplitTabsTime / 3))
      var timeAdd = 0;
      for(var y = 0; y < 3; y++){
        const min = r - 1000;
        const max = r + 1000;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        timeAdd += r - randomNumber;
        await setTimeout(r);  
        const randomBoolean = Math.random() < 0.5;

        if(randomBoolean){
          this.robot.scrollDown();
        } else {
          this.robot.scrollUp();
        }
      }

      if(timeAdd < 0){
        timeAdd = timeAdd * -1;
      }
      await setTimeout(timeAdd);
      this.puppeteer.nextTab();
    }
    setTimeout(1000);
    await this.puppeteer.focusTab(1);

    this.robot.scrollDown();
    await setTimeout(5000);


    this.robot.scrollDown();
    await setTimeout(5000);


    this.robot.scrollDown();
    await setTimeout(5000);

    this.robot.scrollUp();

    const endingTimestampInSeconds = Math.floor(Date.now() / 1000);

    var diff = endingTimestampInSeconds - startingTimestampInSeconds;
    var timeToWait = totalTime - diff;
    await setTimeout(timeToWait*1000);
  }
}

class Teleprompter {
  constructor() {
    // Constructor code here    
    this.records = new Records()
    this.uploads = new Uploads();
    this.devices = new Devices();
    this.files = new FileManagement();
    this.terminal = new Terminal();
    this.puppeteer = new Puppeteer();
    this.recording = new Recording();
    this.input = new Input();
    this.connect();
    this.startPrompting();
    this.bombbomb = new BombBombIntegration();
    this.bombbomb.getToken();
    this.simulate = new SimulateBrowser();
    this.script = new Script();
  }

  async connect(){
    this.socket = io("https://app.contentbounty.com", { path: '/ws/socket.io' });

    // Connect to the server
    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });
  }

  async setTeleprompterText(text){
      this.socket.emit("set_teleprompter_text", text);
      this.socket.emit("set_teleprompter_speed", 200);
  }

  stopTeleprompter(){
      this.socket.emit("teleprompter_stop", 100);
  }

  startTeleprompter(){
    this.socket.emit("teleprompter_start", 100);
  }

  // Start the teleprompting process
  async startPrompting(){

    console.log("Initializing");
    await setTimeout(5000);

    var [page] = await this.puppeteer.browser.pages();
    //await page.close();
    var newPage = await this.puppeteer.browser.newPage();
    newPage.goto("https://www.google.com/setprefs?sig=0_OroWpJJjlj-z8Rta3XkpJYv6N-8%3D&source=en_ignored_notification&prev=https://www.google.com/search?q%3Dgoogle%26oq%3Dgoogle%26gs_lcrp%3DEgZjaHJvbWUqEAgAEAAYgwEY4wIYsQMYgAQyEAgAEAAYgwEY4wIYsQMYgAQyEwgBEC4YgwEYxwEYsQMY0QMYgAQyDQgCEAAYgwEYsQMYgAQyDQgDEAAYgwEYsQMYgAQyDQgEEAAYgwEYsQMYgAQyDQgFEAAYgwEYsQMYgAQyCggGEAAYsQMYgAQyDQgHEAAYgwEYsQMYgAQyDQgIEAAYgwEYsQMYgAQyDQgJEAAYgwEYsQMYgATSAQc4OTZqMGoyqAIAsAIA%26sourceid%3Dchrome%26ie%3DUTF-8&hl=en&sa=X&ved=2ahUKEwj-nvX7sZX_AhUUR_EDHehBD44QhoQCKAF6BAgDEAM");
    page.close();
    page = newPage;
    let practiceMode = true;
    var answer;
    this.terminal.tab();
    answer = await this.input.promptUser('Mode: Practice (P) or Live (L): ');
    if(answer == "Q") { process.exit(1) }
    if((answer !== "P") && (answer !== "L")){
      console.log("Invalid response");
      this.startPrompting();
      return;
    }
    if(answer == "L"){
      practiceMode = false;
    }
    this.practiceMode = practiceMode;
    let bAutomatic = false;
    
    //while(answer !== 'S'){
    //await setTimeout(2250);
      //this.terminal.tab();
       answer = await this.input.promptUser('How many videos would you like to do?: ');
       if(answer == "Q"){
         process.exit(1);
       }
    //}
    let numVideos = 0;

    try {
      numVideos = parseInt(answer);
    } catch(err){
      return this.startPrompting();
    }
    
    for(var i = 0; i < numVideos; i++){
        
        const nextRecordId = await this.records.getNextRecord({ "bRecordingCompleted" : { $ne: true }, "bRejected": { $ne: false } } );
        var websites = this.extractWebsitesFromRecord(this.records.currDoc);
        try {
          page.goto(websites[0]);
        } catch(err){

        }

        websites.shift();
        let script = this.script.getScript(this.records.currDoc, numVideos - i - 1);
        this.setTeleprompterText(script);

        // "A" is the default -- it assumes everything went good
        let autoReject = "A"

        await this.puppeteer.openTabs(websites, true, (reject) => {
          if(reject === true){
            autoReject = "R"
          }
        });
        await setTimeout(1000);

        this.startTeleprompter();
        await await setTimeout(3000);

        this.simulate.puppeteer = this.puppeteer;
        
        
        
        //await setTimeout(5000);
        //this.terminal.tab();
        //await this.input.promptUser('Press Enter to Start Recording');
        this.terminal.tab(); 
        process.stdout.write('\x07');
        await setTimeout(1500);
        var outputPath = await this.recording.startRecording();

        await this.simulate.simulate(websites.length, 60, 20);
        
        var outputPath = await this.recording.stopRecording();      
        await setTimeout(1000);

        //this.terminal.tab();
        this.puppeteer.closeTabs();
        page.goto("about:blank");
        
        var updatedPath = null;
        if(outputPath !== false){
           updatedPath = this.files.renameFile(outputPath, nextRecordId);
        }

        var filename = this.records.currDoc["company_name"];
        var description = filename + " " + this.records.currDoc["website"];
        
        if(autoReject == "R"){
          i--;
        }

        console.log(filename, description);
        await this.waitForAnswer(updatedPath, filename, description, autoReject)

    }

    return this.startPrompting();
  }

  extractWebsitesFromRecord(dbRecord ={}){
    var obj = { ... dbRecord }
    var websitesAr = [];
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if(key.indexOf("website") != -1){
          websitesAr.push(obj[key])
        }
      }
    }
    var search = dbRecord["Search"];
    websitesAr = [ ... new Set(websitesAr) ];
    websitesAr.unshift(search);
    return websitesAr;
  }

  async waitForAnswer(updatedPath, filename, description, answerOverride =null){
        let answer = '';
        let bWaitForAnswer = true;
        
        while (answer !== 'A' && answer !== 'R' && answer !== 'D' && answer !== 'Q' && answer !== 'M'){
            
            if(answerOverride !== null){
              answer = answerOverride;
              bWaitForAnswer = false;
            }

            await setTimeout(250);
            if(bWaitForAnswer){
              answer = await this.input.promptUser('Accept (A), Reject (R), or Redo (D): ');
            }
            if(answer == "Q"){
              process.exit(1);
            }
            if(answer == "D"){
              this.records.prevRecord = this.records.lastRecord;
              // Delete the file, and go to the top of the loop without going to the next record
            }
            if(answer == "A"){
              if(this.practiceMode == false){
              await this.records.markAsAccepted();
              this.uploads.start(updatedPath, filename, description, async (filePath, response) => {
                if(typeof response["videoId"] !== 'undefined'){
                      var fileParts = path.parse(filePath);
                      var docId = fileParts.name;
                      var videoId = response["videoId"];
                      await this.records.markAsSuccessfulUpload(docId, videoId);
                }
              });
              }
            }
            if(answer == "R"){
              console.log(997, "This video was rejected due to a problem")
              if(this.practiceMode == false){
                await this.records.markAsRejected();
              }
              // Mark this as rejected, don't redo. 
            }
            if(answer == "M"){
              bAutomatic = true;
            }
          }
          this.stopTeleprompter();
  }

  // Methods and properties here
}

// function startOBS() {
//   const obsCommand = '/Applications/OBS.app/Contents/MacOS/OBS';

//   const child = spawn(obsCommand, {
//     detached: true,
//     stdio: 'ignore',
//   });

//   // Unref the child process so it can run independently
//   child.unref();

//   console.log('OBS Studio started successfully.');
// }

// // Start OBS Studio
// startOBS();

const teleprompter = new Teleprompter();