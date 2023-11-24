const puppeteer = require('puppeteer'); // v13.0.0 or later
const fs = require("fs");
const axios = require("axios");
const tp = require('timers/promises');
const { MongoClient, ObjectId } = require('mongodb');
var cp = require('child_process'); 
const path = require('path');
const { spawn } = require('child_process');

async function pngsToMp4(){
  // Path to your images directory
  const imagesDir = path.join(__dirname, 'imgs');

  // Path to the output file
  const output = path.join(__dirname, 'output.mp4');

  // Get a sorted list of files in the directory
  const files = fs.readdirSync(imagesDir).sort();

  // Command to create the video
  const command = 'ffmpeg';
  const params = [
      '-y',  // overwrite output file if it exists
      '-framerate', '30',  // frames per second
      '-pattern_type', 'glob', // pattern to match files
      '-i', path.join(imagesDir, '*.png'), // input files
      '-c:v', 'libx264',  // codec
      '-pix_fmt', 'yuv420p',  // pixel format
      '-crf', '23',  // constant rate factor (quality)
      output  // output file
  ];

  const ffmpeg = spawn(command, params);

  // Handle error
  ffmpeg.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // Handle close
  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      console.log(`ffmpeg process exited with code ${code}`);
    } else {
      console.log('Video created successfully');
    }
  });

  return;
}

//return pngsToMp4();

const connection_uri = 'mongodb://adam:dino@127.0.0.1:27017/contentbounty-prod?authSource=admin&socketTimeoutMS=3600000&connectTimeoutMS=3600000'
const client = new MongoClient(connection_uri, { useNewUrlParser: true, useUnifiedTopology: true });

let db, activeConnection;

(async () => {
  try {
        activeConnection = await client.connect();
        db = activeConnection.db();
        console.log("Connected successfully to MongoDB");
    } catch (err) {
        console.log(21, "Unable to connect to database", err);
    }

    await iterateThroughRecords();
})();


async function iterateThroughRecords() {

  const collection = db.collection('delete_trashes');
  const result = await collection.findOne({ "Website Capture":false });
  console.log(result);

  console.log("test1234");
  var status = await captureUrl(result["Website"], result["_id"]);

  const query = { _id: result["_id"] };

  const update = { $set: { "Website Capture": true } };

  // Perform the update operation
  //const updateResult = await collection.updateOne(query, update);

  //console.log(42, updateResult);

}

return;

function makeUrlFullyQualified(url) {
  if (!url.includes('://')) {
    // Add 'http://' to the beginning of the URL
    url = 'http://' + url;
  }
  
  // Return the modified URL
  return url;
}

async function captureUrl(link, _id){
    const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox', '--autoplay-policy=user-gesture-required'] });
    const page = await browser.newPage();

    const timeout = 15000;
    page.setDefaultTimeout(timeout);
    {
        const targetPage = page;
        await targetPage.setViewport({"width":1920,"height":1080})
    }
     {
        const targetPage = page;
        const promises = [];
        //promises.push(targetPage.waitForNavigation());

        try {
        var tpage = makeUrlFullyQualified(link);
        console.log(121, tpage);
        await targetPage.goto(tpage);
        } catch(err){
          console.log(129, err);
          return false;
        }

        try {
          await targetPage.waitForNavigation();
        } catch(err){
          //console.log(121, err)
          //return false;
        }

    }

    // setTimeout( (page) => {
    //     page.evaluate(() => {
    //       window.scrollBy(0, window.innerHeight * 0.25);
    //     });
    // }, 2000, page)

    // setTimeout( (page) => {
    //     page.evaluate(() => {
    //       window.scrollBy(0, window.innerHeight * 0.50);
    //     });
    // }, 4000, page)

    // setTimeout( (page) => {
    //     page.evaluate(() => {
    //       window.scrollBy(0, window.innerHeight * 0.75);
    //     });
    // }, 6000, page)

    // setTimeout( (page) => {
    //     page.evaluate(() => {
    //       window.scrollTo(0, 0);
    //     });
    // }, 8000, page)

    var seconds = 42;
    var fps = 30;
    var totalframes = seconds * fps;

    var fiveSeconds = 5*30;
    var twoSeconds = 2*30;
    var oneSecond = 30;
    var end = oneSecond;//fiveSeconds;
    var i = 0; 

    //await page.setViewport({ width: 1920, height: 1080 });
    for(i = i; i < end; i++){
      // Eh do nothing
      console.log(173, i)
      //await page.screenshot({ path: `imgs/screenshot${i}.png` });
    }

    end = end + twoSeconds;
    var x = 0;
    //scrollAndCapture(x, i, 1, twoSeconds)
    // for(i = i; i < end; i++){
    //   // Eh do nothing
    //   console.log(173, (x / 100).toFixed(2));
      
    //   if(divisor > 0.25){
    //     divisor = 0.25;
    //   }
    //   x++;
    //   await page.screenshot({ path: `imgs/screenshot${i}.png` });
      
    // }


      var divisor = (x / 100).toFixed(2);
      var stop = 30;
      console.log(194, x, i, divisor, stop);

      function scrollFinished(result){
         console.log(203, result);
       }

      const result = await page.evaluate(() => {
        console.log(199);

        for(var i = 0; i < 30; i++){
          
          setTimeout( (x) => {
            window.scrollBy(0, window.innerHeight * (x/100).toFixed(2));
            page.screenshot({ path: `imgs/screenshot${x+30}.png` });
          }, i*1000, i)

          
        
        }

      });

      await tp.setTimeout(30*1000);

      console.log(212, "page evaluate returned");

//}

    end = end + oneSecond * 30;
    x = 0;
    //for(var i = i; i < end; i++){
    //      x++;
          //await page.evaluate(
          //  (i, x) => {
          //    console.log(163, i, (x/100));
            //window.scrollBy(0, window.innerHeight * (x/100));
          //}, i, x);
          //await page.screenshot({ path: `imgs/screenshot${i}.png` });
          //await tp.setTimeout(150);

    //}

    //await tp.setTimeout(20);
    pngsToMp4();

    // end = end + oneSecond;
    // x = 0;
    // for(var i = i; i < end; i++){
    //       x++;
    //       await page.evaluate(
    //         (i, x) => {
    //         //window.scrollBy(0, window.innerHeight * (x/100) * -1);
    //       }, i, x);
    //       await page.screenshot({ path: `imgs/screenshot${i}.png` });
    //       await tp.setTimeout(50);
    // }

    // end = end + fiveSeconds;
    // for(i = i; i < end; i++){
    //   // Eh do nothing
    //   await page.screenshot({ path: `imgs/screenshot${i}.png` });
    //   await tp.setTimeout(50);
    // }

    //}

    //{
        for(var i = 0; i < 240; i++){
          //await page.screenshot({ path: `imgs/screenshot${i}.png` });
          //await tp.setTimeout(35);

        }        
    //}  
    {

    }
    {
      //   const { data } = await page.stopScreencast();
      //   const ffmpeg = spawn('ffmpeg', [
      //     '-y', // Overwrite output file if it exists
      //     '-f', 'image2pipe',
      //     '-c:v', 'mjpeg',
      //     '-i', '-',
      //     '-vf', `fps=${options.fps || 30}`,
      //     '-pix_fmt', 'yuv420p',
      //     "test.mp4"
      //   ]);

      //   data.forEach(frameData => {
      //     ffmpeg.stdin.write(Buffer.from(frameData, 'base64'));
      //   });

      //   ffmpeg.stdin.end();

      // await new Promise((resolve, reject) => {
      //     ffmpeg.on('error', reject);
      //      ffmpeg.on('exit', resolve);
      // });
        //await browser.close();
    }
  }
//        await page.screenshot({ path: `${_id}.png`, fullPage: true, omitBackground: true });

//        const image = fs.readFileSync(`${_id}.png`);

//        const binaryData = new Buffer(image).toString('base64');

//        return binaryData;
//        }

    //}

    async function waitForSelectors(selectors, frame, options) {
      for (const selector of selectors) {
        try {
          return await waitForSelector(selector, frame, options);
        } catch (err) {
          console.error(err);
        }
      }
      throw new Error('Could not find element for selectors: ' + JSON.stringify(selectors));
    }

    async function scrollIntoViewIfNeeded(selectors, frame, timeout) {
      const element = await waitForSelectors(selectors, frame, { visible: false, timeout });
      if (!element) {
        throw new Error(
          'The element could not be found.'
        );
      }
      await waitForConnected(element, timeout);
      const isInViewport = await element.isIntersectingViewport({threshold: 0});
      if (isInViewport) {
        return;
      }
      await element.evaluate(element => {
        element.scrollIntoView({
          block: 'center',
          inline: 'center',
          behavior: 'auto',
        });
      });
      await waitForInViewport(element, timeout);
    }

    async function waitForConnected(element, timeout) {
      await waitForFunction(async () => {
        return await element.getProperty('isConnected');
      }, timeout);
    }

    async function waitForInViewport(element, timeout) {
      await waitForFunction(async () => {
        return await element.isIntersectingViewport({threshold: 0});
      }, timeout);
    }

    async function waitForSelector(selector, frame, options) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to waitForSelector');
      }
      let element = null;
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (element) {
          element = await element.waitForSelector(part, options);
        } else {
          element = await frame.waitForSelector(part, options);
        }
        if (!element) {
          throw new Error('Could not find element: ' + selector.join('>>'));
        }
        if (i < selector.length - 1) {
          element = (await element.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
        }
      }
      if (!element) {
        throw new Error('Could not find element: ' + selector.join('|'));
      }
      return element;
    }

    async function waitForElement(step, frame, timeout) {
      const count = step.count || 1;
      const operator = step.operator || '>=';
      const comp = {
        '==': (a, b) => a === b,
        '>=': (a, b) => a >= b,
        '<=': (a, b) => a <= b,
      };
      const compFn = comp[operator];
      await waitForFunction(async () => {
        const elements = await querySelectorsAll(step.selectors, frame);
        return compFn(elements.length, count);
      }, timeout);
    }

    async function querySelectorsAll(selectors, frame) {
      for (const selector of selectors) {
        const result = await querySelectorAll(selector, frame);
        if (result.length) {
          return result;
        }
      }
      return [];
    }

    async function querySelectorAll(selector, frame) {
      if (!Array.isArray(selector)) {
        selector = [selector];
      }
      if (!selector.length) {
        throw new Error('Empty selector provided to querySelectorAll');
      }
      let elements = [];
      for (let i = 0; i < selector.length; i++) {
        const part = selector[i];
        if (i === 0) {
          elements = await frame.$$(part);
        } else {
          const tmpElements = elements;
          elements = [];
          for (const el of tmpElements) {
            elements.push(...(await el.$$(part)));
          }
        }
        if (elements.length === 0) {
          return [];
        }
        if (i < selector.length - 1) {
          const tmpElements = [];
          for (const el of elements) {
            const newEl = (await el.evaluateHandle(el => el.shadowRoot ? el.shadowRoot : el)).asElement();
            if (newEl) {
              tmpElements.push(newEl);
            }
          }
          elements = tmpElements;
        }
      }
      return elements;
    }

    async function waitForFunction(fn, timeout) {
      let isActive = true;
      const timeoutId = setTimeout(() => {
        isActive = false;
      }, timeout);
      while (isActive) {
        const result = await fn();
        if (result) {
          clearTimeout(timeoutId);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('Timed out');
    }


async function notifySlack(link, post){

    
    var cb_zapier_webhook = `https://hooks.slack.com/services/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`

    var payload = {}
    if(typeof msg == 'object'){
      payload = msg;
    } else {
       payload = { "text": post + ` \nLink ${link}` }
    }

    var data = await axios.post(cb_zapier_webhook, payload);

   
  }

async function changeIpAddr(){
  return cp.execSync('sudo protonvpn c --cc US').toString()  
}

async function outputIpAddr(){
  cp.execSync('curl ifconfig.me').toString()
}