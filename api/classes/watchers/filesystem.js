var template = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Untitled</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lora">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.15/css/dataTables.bootstrap.min.css">
</head>

<body>
    <style>.article-clean{color:#56585b;background-color:#fff;font-family:Lora,serif;font-size:14px}.article-clean .intro{font-size:16px;margin:0 auto 30px}.article-clean .intro h1{font-size:32px;margin-bottom:15px;padding-top:20px;line-height:1.5;color:inherit;margin-top:20px}.article-clean .intro p{color:#929292;font-size:12px}.article-clean .intro p .by{font-style:italic}.article-clean .intro p .date{text-transform:uppercase;padding:4px 0 4px 10px;margin-left:10px;border-left:1px solid #ddd}.article-clean .intro p a{color:#333;text-transform:uppercase;padding-left:3px}.article-clean .intro img{margin-top:20px}.article-clean .text p{margin-bottom:20px;line-height:1.45}.article-clean .text h2{margin-top:28px;margin-bottom:20px;line-height:1.45;font-size:16px;font-weight:700;color:#333}@media (min-width:768px){.article-clean .text p{font-size:16px}.article-clean .text h2{font-size:20px}}.article-clean .text figure{text-align:center;margin-top:30px;margin-bottom:20px}.article-clean .text figure img{margin-bottom:12px;max-width:100%}#example{margin-bottom:0}</style>
    <p><section class="article-clean">
        <div class="container">
            <div class="row">
                <div class="col-lg-10 col-xl-8 offset-lg-1 offset-xl-2">
                    <div class="btn-group" role="group"><form action="https://app.contentbounty.com/api/v1.0/boxredirect/upload">
  <input type="file" id="myFile" name="{{directory}}">
  <input type="submit">
</form></div>&nbsp;<button class="btn btn-primary" type="button" onclick="refreshDirectory()">Refresh</button><table id="example" class="table table-striped table-bordered" cellspacing="0" width="100%">
        <p>
        <thead>
            <tr>
                <th>Filename</th>
                <th>Link</th>
            </tr>
        </thead>
        <tbody>
            {{table}}
        </tbody>
    </table>
                </div>
            </div>
        </div>
    </section>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.10.15/js/dataTables.bootstrap.min.js"></script>
</body>

<script>
  function refreshDirectory(){
    var directory = '{{directory}}';
    // Call a public API that causes the directory to refresh
    const Http = new XMLHttpRequest();
    const url='https://app.contentbounty.com/v1.0/api/boxredirect/refresh/directory/' + directory;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
    }
};
xhttp.open("GET", url, true);
xhttp.send();
  }

</script>

</html>`

/*
	Created Mon Feb 7 2022
	by Adam Arthur

	The purpose of this file is to watch the filesystem and trigger webhooks
	and automations.

	An immediate goal is to automatically upload to YouTube any video file
	So, if we upload a .mov, it will upload the video to the associated
	account and publish it, then associate it with the related bounty.

*/

require("./base.js");
var Box = require('@classes/integrations/box/box.js');
var mongoose = require( 'mongoose');
var Bounties = require('./bounties.js')
const util = require("util");
var fs = require('fs');
var box; 
var adminModel = mongoose.model("User");
var Communication = require("@classes/communication.js");
var moment = require('moment');
var path = require('path');
var filename = path.basename(__filename);
var voca = require("voca");
const chokidar = require('chokidar');
const request = require('request');
var base64 = require('base-64');

// Should be an environment variable
var zapierWebhookUrl = 'https://hooks.zapier.com/hooks/catch/11405906/b57jznf'

// Get our base directory from the environment variable
var base_dir = process.env.BASE_DIR;
var base_url = process.env.BASE_WEBSITE_URL;

var validVideoFormats = ["mov","mp4","mpeg","avi"]; // and whatever else we want to include here

console.log(base_dir);
// Initialize watcher.
const watcher = chokidar.watch(base_dir, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
})

.on('add', (path) => {
  checkIfFileIsMovie(path);
});
// Looks at the extension, and if the extension matches a known
// video format we assume it is a video.
function checkIfFileIsMovie(path){
        console.log(path);
        var lastDot = voca.lastIndexOf(path, ".");
        var extension = voca.substr(path, lastDot+1);
        console.log(1, extension);
        if(validVideoFormats.indexOf(extension) != -1){
                console.log(2, "We have a valid extension");
                uploadToYouTube(path);
        } else { console.log(3, "No valid extension found"); }

        var indexOfStaticText = voca.indexOf(path, "static");
        var urlPath = voca.substr(path, indexOfStaticText);
        console.log(4, urlPath);
        var fullUrl = base_url + urlPath;

        createdirectorymap(path);
}

function uploadToYouTube(path){

        // We need to take the path and create a valid url from it

        var indexOfStaticText = voca.indexOf(path, "static");
        var urlPath = voca.substr(path, indexOfStaticText);
        console.log(4, urlPath);
        var fullUrl = base_url + urlPath;
        console.log(5, fullUrl);
  var url = zapierWebhookUrl;
  var postBody = {
    "title":"Video Title",
    "description":"Video Description",
    "video":fullUrl,
  }

  axios
  .post(fulUrl, postBody)
  .then(res => {
    console.log(`statusCode: ${res.status}`)
    console.log(res)
  })
  .catch(error => {
    console.error(error)
  })

}

function createdirectorymap(path){

  var lastForwardSlash = voca.lastIndexOf(path, "/");
  var cwd = voca.substr(path, 0, lastForwardSlash);
  // List the contents of the directory
  //var fileLinks = ''

  var base64Cwd = base64.encode
        console.log(10, cwd);
  fs.readdir(cwd, (err, files) => {

        var fileLinks = '';
        files.forEach(file => {

        console.log(20, cwd);
        console.log(21, file);
        console.log(22, cwd + "/" + file);

        // 2f5ce5745d39affe70b08d2e64f8d4f4

        var fileWithCwd = cwd + "/" + file;
        var indexOfStaticText = voca.indexOf(fileWithCwd, "static");
        var urlPath = voca.substr(fileWithCwd, indexOfStaticText);
        console.log(4, urlPath);
        var fullUrl = base_url + urlPath;

        /*<tr><td>biography.jpg</td><td><a href="">Box Link</a></td><td><a href="">https://www.contentbounty.com/file.jpg</a></td></tr>
            */
        console.log(12, fullUrl);
      var fileLink = `<tr><td>${file}</td><td><a href="">Box Link</a></td><td><a href="${fullUrl}">${fullUrl}</a></a></td></tr>`
      fileLinks = fileLinks + fileLink;
        //console.log(13, fileLink);
        //console.log(14, fileLinks);
    });

    var html = voca.replaceAll(template, "{{table}}", fileLinks)
    html = voca.replaceAll(html, "{{directory}}", base64.encode(cwd))
    fs.writeFileSync(cwd + "/index.html", html);
  });
  //console.log(15, fileLinks);
  //var html = `<!DOCTYPE html><html><head></head><body>${fileLinks}</body></html>`
  //fs.writeFileSync(cwd + "/index.html", html);
}