const puppeteer = require('puppeteer'); // v13.0.0 or later
const fs = require("fs");
const axios = require("axios");
const tp = require('timers/promises');
const { MongoClient, ObjectId } = require('mongodb');
var cp = require('child_process'); 
const path = require('path');
const { spawn } = require('child_process');
const OBSWebSocket = require('obs-websocket-js').default;
const util = require('util');
const obs = new OBSWebSocket();
const { exec } = require('child_process');
const { execSync } = require('child_process');

let data = '';

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://a.simplemdm.com/api/v1/device_groups/79417/devices/1138778',
  headers: { 
    'Content-Type': 'application/json', 
    'Authorization': 'Basic bFI3emhZdFNLRlhIM2FKZXpmajRGNXNXMzdRNDRCeFZnQ3pzV2c2VFNyV20ycUpJSzJQYjhSaEZ0b3pzMEN2VTo='
  },
  data : data
};

console.log(28, config);


axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});

// Function to minimize all windows
function minimizeAllWindows() {
  // const script = 'tell application "System Events" to keystroke "m" using command down';
  // const command = `osascript -e '${script}'`;
  
  // exec(command, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Error: ${error.message}`);
  //     return;
  //   }
  //   if (stderr) {
  //     console.error(`stderr: ${stderr}`);
  //     return;
  //   }
  //   console.log('All windows minimized.');
  // });
}

let outputArray = [];

  let camera = 0;
  let screen = 1;
  let microphone = 0;

// Execute the CLI command
exec('ffmpeg -hide_banner -list_devices true -f avfoundation -i ""', (error, stdout, stderr) => {
  if (error) {
  }

  stdout = stderr;

  const outputArray = stdout.split('\n');

  var videoDevices = [];
  var audioDevices = [];

  var bVideoDevices = true;
  for(var line of outputArray){
    if(line.indexOf("AVFoundation video devices") != -1){
      continue;
    }
    if(line.indexOf("AVFoundation audio devices") != -1){
      bVideoDevices = false;
      continue;
    }
    if(line.indexOf("error") != -1){
      continue;
    }
    if(line.length == 0){
      continue;
    }

    let devices = line.split(/[\[\]]|\s+(?=\[)|(?<=\])\s+/).filter(Boolean);

    if(bVideoDevices){
        
        //videoDevices.push(`${devices[1]} ${devices[2]}`)
        videoDevices.push(devices[2])
      } else {
        audioDevices.push(devices[2])
      }
  }

  for(let device in videoDevices){
    if(videoDevices[device].indexOf("FaceTime") != -1){
      camera = device;
    }
    if(videoDevices[device].indexOf("iPhone") != -1){
      camera = device;
    }
    if(videoDevices[device].indexOf("Capture") != -1){
      screen = device;
    }
  }

  for(let device in audioDevices){
    if(audioDevices[device].indexOf("MacBook Pro Microphone") != -1){
      microphone = device;
    }
    if(audioDevices[device].indexOf("iPhone") != -1){
      microphone = device;
    }
    if(audioDevices[device].indexOf("Bose") != -1){
      microphone = device;
      break; // Our preferred device if present;
    }
  }

});

// Pick our devices


const connection_uri = 'mongodb://adam:dino@127.0.0.1:27017/contentbounty-prod?authSource=admin&socketTimeoutMS=3600000&connectTimeoutMS=3600000'
const client = new MongoClient(connection_uri, { useNewUrlParser: true, useUnifiedTopology: true });

var browser;

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

var stop = 0;
(async () => {

    // Connect to Mongo
    try {
        activeConnection = await client.connect();
        db = activeConnection.db();
        console.log("Connected successfully to MongoDB");
    } catch (err) {
        console.log(21, "Unable to connect to database", err);
    }

   try {
    const {
      obsWebSocketVersion,
      negotiatedRpcVersion
    } = await obs.connect('ws://127.0.0.1:4455', 'password', {
      rpcVersion: 1
    });
    //console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
  } catch (error) {
    console.error('Failed to connect', error.code, error.message);
  }

  browser = await puppeteer.launch({ headless: false, defaultViewport: null, ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-infobars', '--autoplay-policy=user-gesture-required', '--window-position=330,160', '--window-size=1400,900'] });

  await tp.setTimeout(15000);
  
  minimizeAllWindows();

  // Give myself some time 
  setTimeout( async () => {
     await iterateThroughRecords();
  }, 1000)
  
})();

async function iterateThroughRecords() {
  
  if(stop >= 60){
    console.log("Stopping");
    return;
  }
  stop++;
  db = activeConnection.db();
  const collection = db.collection('delete_trashes');
  const result = await collection.findOne({ "Website Capture":false }, { "$limit": 5 });
  try {
    var status = await captureUrl(result["Website"], result["Search"], result["_id"]);
  } catch(err){
    console.log(198, err)
    // const isBrowserLaunched = browser.isConnected();
    // if(!isBrowserLaunched){
    //   browser = await puppeteer.launch({ headless: false, defaultViewport: null, ignoreDefaultArgs: ['--enable-automation'], args: ['--disable-infobars', '--autoplay-policy=user-gesture-required', '--window-position=330,160', '--window-size=1400,900'] });
    // }
    // await tp.setTimeout(1500);
    return iterateThroughRecords();
    return false;
  }

  if(status == false){
    console.log(209, "Trying again")
    return iterateThroughRecords()
  }

  const query = { _id: result["_id"] };
  const update = { $set: { "Website Capture": true } };0;
  // Perform the update operation
  const updateResult = await collection.updateOne(query, update);
  
  var script = `
${result["School"]},${result["Email Address"]}

Hi ${result['First Name']}, my is Adam.

I'm going to make this really short, I was searching private schools in ${result["Subdivision"]}, saw your website.  I just want to let you know we specialize in helping private schools get new enrollments.

I'm fairly confident we can get ${result["Friendly Name"]} anywhere from twenty to forty new students that otherwise wouldn't have enrolled, based on the the results we're getting with our other private school customers.  

I reached out to you specifically because based on the Google search results I'm seeing and what other schools are doing in the area, there's a good chance there's room for you to grow.

If this is of any interest to you at all, I've included a Calendy link, feel free to book in a time we can chat.  Or if you prefer email that works as well. 

Either way, thanks for watching.  Hope to talk soon.









end





end`;

socket.emit("teleprompter_stop");

setTimeout( ()=> {
  socket.emit("set_teleprompter_text", script);
}, 1000);

setTimeout( ()=> {
  socket.emit("set_teleprompter_speed", 200);

}, 2000);

}

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


//}

async function captureUrl(url, googleSearch, fileId) {


  if(typeof url == 'undefined'){
    // Need to check this...
    console.log(284, url, googleSearch, fileId);
    return true;
  }
  const [page] = await browser.pages()

  page.on('dialog', async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.dismiss(); // Dismiss the dialog automatically
  });


  async function gotoPage(url, timeout){

  if(typeof url == 'undefined'){
    // Need to check this...
    console.log(299, url, googleSearch, fileId);
    return true;
  }

    try {
      console.log(293, url);
      var response = await page.goto(makeUrlFullyQualified(url), {timeout: timeout});      
      
    } catch(err){
      console.log(69, "Navigation timed out", err);
      return false;
    }
    const statusCode = response.status();
    console.log(301, statusCode);
    return true;
  }

  async function evaluatePage(){

  }

  startScreenRecording(`${fileId}`)

  socket.emit("teleprompter_start", 100);

  console.log(324, url);
  var bPageLoaded = await gotoPage(url, 10000)

  var linksRaw = [];

  await page.waitForSelector('a');
  linksRaw = await page.$$eval('a', (anchors) => {
    return anchors.map((anchor) => anchor.href);
  });


  const domain = getDomain(makeUrlFullyQualified(url))
  console.log(338, domain, linksRaw)
  var links = [];
  for(let link of linksRaw){
    console.log(341, linksRaw)
    if(link.includes(domain)){
      links.push(link);
    }
  }

  console.log(333, links);   

  // try {
  
  // linksRaw = await page.evaluate(() =>
  //   Array.from(document.querySelectorAll('a')).map(link => link.href)
  // );
  // } catch(err){
  //   console.log(311, "This one failed...");
  //   return false;
  // }

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
  console.log(387, randomLink, links);
  await gotoPage(randomLink);
  await tp.setTimeout(2236);

  var randomLink = links[Math.floor(Math.random() * links.length)];
  console.log(392, randomLink);
  await gotoPage(randomLink);
  await tp.setTimeout(5000);

  console.log(324, googleSearch);
  await gotoPage(googleSearch);

  let isCaptchaPresent = false;
 try {
   isCaptchaPresent = await page.evaluate(() => {
    // This selector might change as Google updates its website
    return !!document.querySelector('.g-recaptcha');
  });
  } catch(err){
    console.log(363, err);
  }

  if (isCaptchaPresent) {
    console.log('CAPTCHA detected!');

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

  await tp.setTimeout(3000);
  page.evaluate(() => {
    for(var i = 0; i < 30; i++){
      setTimeout( (x) => {
        window.scrollBy(0, window.innerHeight * (0.10) * -1);
      }, i*35, i)
    }
  });

  console.log(47, "stop teleprompter")
  //socket.emit("teleprompter_stop", 100);

  await tp.setTimeout(3000);
  //await page.goto("about:blank");

  stopScreenRecording(fileId.toString());

  var bPageLoaded = await gotoPage("https://www.google.com", 2500);

  await tp.setTimeout(3000);

  iterateThroughRecords();

  console.log(298, "Should dstop recording");

  //await page.goto('https://www.msnbc.com');
  //await recorder.stop();
  
  
};

// Activates the camera 
// ffmpeg -f avfoundation -framerate 30 -i "1:none" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Records screen
// ffmpeg -f avfoundation -r 30 -i "2:0" -f avfoundation -r 30 -i "2" -filter_complex "[0:v][1:v]overlay=W-w-10:H-h-10" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Records screen + webcam
// ffmpeg -f avfoundation -r 30 -i "2" -f avfoundation -r 30 -i "0" -filter_complex "[0:v][1:v]overlay=W-w-10:H-h-10" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Records screen + webcam when iPhone is connected as webcam
// ffmpeg -f avfoundation -r 30 -i "3" -f avfoundation -r 30 -i "1" -filter_complex "[0:v][1:v]overlay=W-w-10:H-h-10" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Records screen + iPhone when iPhone is connected as webca
// ffmpeg -f avfoundation -r 30 -i "3" -f avfoundation -r 30 -i "2" -filter_complex "[0:v][1:v]overlay=W-w-10:H-h-10" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Creates circle overlay, no audio
// ffmpeg -f avfoundation -r 30 -i "3" -f avfoundation -r 30 -i "1" -filter_complex "[1:v]geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':128:128,setpts=N/FRAME_RATE/TB[mask];[1:v][mask]alphamerge[cutout];[0:v][cutout]overlay=x=W-w:y=0" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// ffmpeg -f avfoundation -r 30 -i "1" -f avfoundation -r 30 -i "0" -filter_complex "[1:v]geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':128:128,setpts=N/FRAME_RATE/TB[mask];[1:v][mask]alphamerge[cutout];[0:v][cutout]overlay=x=W-w:y=0" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Works after removing the OBS Studio Camera  
// ffmpeg -f avfoundation -r 30 -i "1" -f avfoundation -r 30 -i "0" -filter_complex "[1:v]geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':128:128,setpts=N/FRAME_RATE/TB[mask];[1:v][mask]alphamerge[cutout];[0:v][cutout]overlay=x=W-w:y=0" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// List devices
// ffmpeg -f avfoundation -list_devices true -i ""

// Bronze -- seems to work really well with my Bose Headphone...
// ffmpeg -f avfoundation -r 30 -i "1" -f avfoundation -r 30 -i "0" -f avfoundation -i ":0" -filter_complex "[1:v]geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':128:128,setpts=N/FRAME_RATE/TB[mask];[1:v][mask]alphamerge[cutout];[0:v][cutout]overlay=x=W-w:y=0" -c:v libx264 -c:a aac -preset ultrafast -crf 23 -pix_fmt yuv420p output.mp4

// Gold -- best results so far with Bose Headphone
// ffmpeg -f avfoundation -thread_queue_size 512 -r 30 -i "1" -f avfoundation -thread_queue_size 512 -r 30 -i "0" -f avfoundation -thread_queue_size 512 -i ":0" -filter_complex "[1:v]geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':128:128,setpts=N/FRAME_RATE/TB[mask];[1:v][mask]alphamerge[cutout];[0:v][cutout]overlay=x=W-w:y=0" -c:v libx264 -c:a aac -preset ultrafast -crf 23 -pix_fmt yuv420p output4.mp4

// ffmpeg -f avfoundation -thread_queue_size 512 -r 30 -pix_fmt uyvy422 -i "1" -f avfoundation -thread_queue_size 512 -r 30 -pix_fmt uyvy422 -i "0" -f avfoundation -thread_queue_size 512 -i ":0" -filter_complex "[1:v]geq='st(3,pow(X-(W/2),2)+pow(Y-(H/2),2));if(lte(ld(3),pow(min(W/2,H/2),2)),255,0)':128:128,setpts=N/FRAME_RATE/TB[mask];[1:v][mask]alphamerge[cutout];[0:v][cutout]overlay=x=-200:y=H-h" -c:v libx264 -c:a aac -preset ultrafast -crf 23 -pix_fmt yuv420p output11.mp4
var recordingProcess; var audioProcess;

async function startScreenRecording(filename) {
  console.log(307, "startScreenRecording", filename);

  try {
    var { outputPath } = await obs.call('StopRecord');
  } catch(err){
    //console.log(err)
  }

  try {
    var result = obs.call('StartRecord');
  } catch(err){
    console.log(err)
  }
}

async function stopScreenRecording(filename) {
  console.log(307, "stopScreenRecording", filename);
  try {
    var { outputPath } = await obs.call('StopRecord');
  } catch(err){
    console.log(err)
  }
  
  const directory = path.dirname(filename);
  const newFilename = directory + "/" + filename + ".mov";
  
  console.log(483, outputPath, newFilename);

  const collection = db.collection('delete_trashes');

  try {
  fs.rename(outputPath, newFilename, (err) => {
  if (err) {
    console.error('Error renaming file:', err);
  } else {
    
  const query = { _id: ObjectId(filename) };
  const update = { $set: { "video_finished": true, "video_filename": newFilename} };
  // Perform the update operation
  collection.updateOne(query, update);

  }
  });
} catch(err){
  console.log(err);
}


}

async function getBombBombToken(){
  let config = { method: 'get', url: 'http://localhost:3002/public/callbacks/bombomb/getToken', maxBodyLength: Infinity, 
                  headers: { 'Content-Type': 'application/json' } };  

  try {
    var token = await this.axios.request(config);
  } catch(err){
    return false;
  }
  return token.token.access_token
}

async function getFreshBombBombToken(){
  let config = { method: 'get', url: 'http://localhost:3002/public/callbacks/bombomb/getFreshToken', maxBodyLength: Infinity, 
                  headers: { 'Content-Type': 'application/json' } };  

  try {
    var token = await this.axios.request(config);
  } catch(err){
    return false;
  }
  return token.token.access_token
}

async function bombombPostRequest(endpoint, data){

      let token = await this.getBombBombToken();

      const config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: `https://api.bombbomb.com/v2/${endpoint}/`,
          headers: { 
            'Authorization': `Bearer ${token}`
          },
          data: data
      };

      try {
        var result = await axios.request(config);
        const statusCode = result.status;
      } catch(err){
        if(err.response.status == 401){
                await this.getFreshBombBombToken();
                return await this.postRequest(endpoint, data);
              } else {
                console.log(639, "Fatal Error: Unable to get fresh BombBomb toke");
                process.exit(1);
                return false;
              }
      }
}

async function uploadBombBomb(filePath, fileId){


  // Set 1: Get an updated token from Content Bounty
  let config = { method: 'get', url: 'http://localhost:3002/public/callbacks/bombomb/getLists', maxBodyLength: Infinity, 
                  headers: { 'Content-Type': 'application/json' } };

  try {
      var token = await this.axios.request(config);
  } catch(err){
      if(err.response.status == 401){

      }

    console.log(603, "Unable to obtain new token");
    return false;
  }
  return 
}







