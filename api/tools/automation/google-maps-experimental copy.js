const puppeteer = require('puppeteer'); // v13.0.0 or later
const fs = require("fs");
const axios = require("axios");
const tp = require('timers/promises');
const { MongoClient, ObjectId } = require('mongodb');
var cp = require('child_process'); 
const path = require('path');
const { spawn } = require('child_process');

const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

const connection_uri = 'mongodb://adam:dino@127.0.0.1:27017/contentbounty-prod?authSource=admin&socketTimeoutMS=3600000&connectTimeoutMS=3600000'
const client = new MongoClient(connection_uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     let manager = SocketManager(socketURL: URL(string: "https://app.contentbounty.com/v1.0/api")!, config: [.log(false), .path(String("/ws/socket.io/")), .compress])
let db, activeConnection;

const io = require('socket.io-client');

const socket = io("https://app.contentbounty.com", {
  path: '/ws/socket.io'
});

// Connect to the server
socket.on('connect', () => {
  console.log('Connected to server');
});

function makeUrlFullyQualified(url) {
  if (!url.includes('://')) {
    // Add 'http://' to the beginning of the URL
    url = 'http://' + url;
  }
  
  // Return the modified URL
  return url;
}

function getDomain(link) {
    try {
        const url = new URL(link);
        return url.hostname;
    } catch (error) {
        console.error('Invalid URL');
        return null;
    }
}

(async () => {
  await iterateThroughRecords();
})();

async function iterateThroughRecords() {
  activeConnection = await client.connect();
  db = activeConnection.db();
  const collection = db.collection('delete_trashes');
  const result = await collection.findOne({ "Website Capture":false });
  var status = await captureUrl(result["Website"], result["Search"], result["_id"]);
  const query = { _id: result["_id"] };
  const update = { $set: { "Website Capture": true, "bCaptureSuccess": status } };
  // Perform the update operation
  const updateResult = await collection.updateOne(query, update);
  console.log(63, result);
  
  var script = `
${result["School"]},${result["Email Address"]}

Hi ${result['First Name']}, my is Adam.

I'm going to make this really short, I was searching private schools in ${result["Subdivision"]}, saw your website.  I just want to let you know we specialize in helping private schools get new enrollments.

I'm fairly confident we can get ${result["Friendly Name"]} anywhere from twenty to forty new students that otherwise wouldn't have enrolled, based on the the results we're getting with our other private school customers.



end`

socket.emit("teleprompter_stop");

setTimeout( ()=> {
  socket.emit("set_teleprompter_text", script);
}, 1000);

setTimeout( ()=> {
  socket.emit("set_teleprompter_speed", 200);

}, 2000);

setTimeout( ()=> {
  socket.emit("teleprompter_start");

  setTimeout( ()=> {
    //iterateThroughRecords();
    socket.emit("teleprompter_stop");
  }, 50000)

  setTimeout( ()=> {
    iterateThroughRecords();
    
  }, 60000)

}, 3000);

}

//setTimeout( ()=> {
  //socket.emit("teleprompter_start", 100);}, 3000);


  //setTimeout( ()=> {
    //socket.emit("teleprompter_stop")
    //socket.emit("teleprompter_start");
    //iterateThroughRecords();
    
  //}, 42000)

  // setTimeout( ()=> {
  //   socket.emit("set_teleprompter_stop")
  //   socket.emit("teleprompter_start");
  //   iterateThroughRecords();
    
  // }, 42000)

  

  //console.log(72, result);

  //console.log(42, updateResult);

//}

async function captureUrl(url, googleSearch, fileId) {

    // Connect to Mongo
    try {
        activeConnection = await client.connect();
        db = activeConnection.db();
        console.log("Connected successfully to MongoDB");
    } catch (err) {
        console.log(21, "Unable to connect to database", err);
    }

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--no-sandbox', '--autoplay-policy=user-gesture-required', '--start-maximized'] });
  const [page] = await browser.pages();

  async function gotoPage(url, timeout){
    try {
      await page.goto(makeUrlFullyQualified(url), {timeout: timeout});      
      return true;
    } catch(err){
      console.log(69, "Navigation timed out");
      return false;
    }
  }

  async function evaluatePage(){

  }

  const recorder = new PuppeteerScreenRecorder(page);
  await recorder.start(`${fileId}.mp4`); // supports extension - mp4, avi, webm and mov
  
  var bPageLoaded = await gotoPage(url, 10000)

  const linksRaw = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map(link => link.href)
  );

  const domain = getDomain(makeUrlFullyQualified(url))
  var links = [];
  for(let link of linksRaw){
    if(link.includes(domain)){
      links.push(link);
    }
  }

  if(bPageLoaded){
  await tp.setTimeout(5000);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (i*0.05));
      }, i*35, i)
    }
  });

  await tp.setTimeout(5000);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (i*0.04*-1));
      }, i*35, i)
    }
  });

  await tp.setTimeout(600);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (0.10) * -1);
      }, i*35, i)
    }
  });

  await tp.setTimeout(2652);
  var randomLink = links[Math.floor(Math.random() * links.length)];
  for(var link of links){
    if (link.includes("contact") || link.includes("about")) {
      randomLink = link;
    } else {
      if (link.includes("admissions") || link.includes("apply")) {
        randomLink = link;
      }
    }
  }
  }
  
  // Navigate to the random link
  await gotoPage(randomLink);
  await tp.setTimeout(2236);

  var randomLink = links[Math.floor(Math.random() * links.length)];
  await gotoPage(randomLink);
  await tp.setTimeout(5000);

  await gotoPage(googleSearch);

 const isCaptchaPresent = await page.evaluate(() => {
    // This selector might change as Google updates its website
    return !!document.querySelector('.g-recaptcha');
  });

  if (isCaptchaPresent) {
    console.log('CAPTCHA detected!');
    return false;

  } else {
    console.log('No CAPTCHA!');
  }

  await tp.setTimeout(5000);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (i*0.05));
      }, i*35, i)
    }
  });

  await tp.setTimeout(5000);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (i*0.04*-1));
      }, i*35, i)
    }
  });

  await tp.setTimeout(600);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (0.10) * -1);
      }, i*35, i)
    }
  });

  //await page.goto('https://www.msnbc.com');
  await recorder.stop();
  await browser.close();

  return true;
};