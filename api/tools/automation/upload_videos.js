const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const connection_uri = 'mongodb://adam:dino@127.0.0.1:27017/contentbounty-prod?authSource=admin&socketTimeoutMS=3600000&connectTimeoutMS=3600000'
const client = new MongoClient(connection_uri, { useNewUrlParser: true, useUnifiedTopology: true });

activeConnection = client.connect();

client.connect(function(error, conn) {
  if (error) {
    // Handle the error
    console.error("Connection error:", error);
  } else {
      activeConnection = conn;
      db = activeConnection.db();
    // Connection successful, use the activeConnection object
    console.log("Connection successful:");
  }
});

const {
    google
} = require('googleapis');



const credentials = {
    "web": {
        "client_id": "1002938566232-prjrbjktklhdmq7ocrgnl8d65hctluf7.apps.googleusercontent.com",
        "project_id": "adamsapi",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "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",
        "redirect_uris": ["https://app.contentbounty.com/v2.0/api/public/callbacks/google/authorized"]
    }
}

// Create a new OAuth2 client using your credentials
const auth = new google.auth.OAuth2(
    credentials.web.client_id,
    credentials.web.client_secret,
    credentials.web.redirect_uris[0]
);

var token = {
    "access_token": "ya29.a0AWY7Ckk5RswHhGy6Zfta4r7NtjQtGzVrMkN51azK4O0KG5s-4QtyVNnC8NBNzlgxbGwBpggAfaUbvhF6EInBGhxUD-Ju7kVm-vT-qr9OYmTek6rbQqztdBh-kcqqB6M5cq3m3ezomyXmjDOXhV21fdT2lyataCgYKAWoSARESFQG1tDrplZE31o5f2zPElWOe-ekCHA0163",
    "expiry_date": 1684533528283,
    "scope": "https://www.googleapis.com/auth/youtube.upload",
    "token_type": "Bearer"
}

// Set the access token to the credentials
auth.setCredentials(token);

// Create a YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth
});


// Define the video metadata
const videoMetadata = {
    snippet: {
        title: 'My Uploaded Video',
        description: 'Description of my video',
        tags: ['tag1', 'tag2'],
        categoryId: '22', // Specify the category ID (optional)
    },
    status: {
        privacyStatus: 'unlisted', // Set the privacy status of the video (public, private, unlisted)
    },
};

(async () => {
    iterateThroughVideos();
})();

async function iterateThroughVideos(){
    const directoryPath = './';

    fs.readdir(directoryPath, async (error, files) => {
      if (error) {
        console.error('Error reading directory:', error);
      } else {
        // Filter .mov files
        var movFiles = files.filter(file => path.extname(file) === '.mov');

        movFiles = movFiles.splice(0, 1);

        for(var filename of movFiles){
            console.log('Processing file:', filename);
            await uploadVideo(filename);
            console.log(96, "Video Uploaded!");
        }
      }
    });
}

const uploadVideo = async (filename) => {

    // Define the video file path
    const videoFilePath = filename;

    // Read the video file
    const videoFileStream = fs.createReadStream(videoFilePath);    

  try {
    const res = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: videoMetadata,
      media: {
        body: videoFileStream,
      },
    });

    const collection = db.collection('delete_trashes');
    const query = { _id: ObjectId("646107c9f8c634bf8322428d") };
    const update = { $set: { "youtube_id": res.data.id, "youtube_link": `https://www.youtube.com/watch?v=${res.data.id}` } };

    // If we've uploaded the file, we no longer need it on our hdd.  Let's delete it
    await fs.promises.unlink(videoFilePath);

    const result = await collection.updateOne(query, update);

    console.log('Video uploaded successfully!');
    console.log('Video ID:', res.data.id);
    console.log(`https://www.youtube.com/watch?v=${res.data.id}`);
    console.log(88, result.result);
  } catch (error) {
    console.error('Error uploading video:', error);
  }
};

//Upload the video
// youtube.videos.insert({
//         part: 'snippet,status',
//         requestBody: videoMetadata,
//         media: {
//             body: videoFileStream,
//         },
//     },
//     (err, res) => {
//         if (err) {
//             console.error('Error uploading video:', err);
//             return;
//         }

//         const collection = db.collection('delete_trashes');
//         const query = { _id: ObjectId("646107c9f8c634bf8322428d") };
//         const update = { $set: { "youtube_id": res.data.id, "youtube_link": `https://www.youtube.com/watch?v=${res.data.id}` } };

//         // If we've uploaded the file, we no longer need it on our hdd.  Let's  delete it
//         fs.unlink(videoFilePath, (error) => {
//           if (error) {
//             console.error('Error deleting file:', error);
//           } else {
//             console.log('File deleted successfully');
//           }
//         });

//         collection.updateOne(query, update, (err, result) => {
//             console.log(88, err, result);
//         });


//         console.log('Video uploaded successfully!');
//         console.log('Video ID:', res.data.id);
//         console.log(`https://www.youtube.com/watch?v=${res.data.id}`);
//     });