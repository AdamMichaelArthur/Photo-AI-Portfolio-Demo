const {
    google
} = require('googleapis');
const fs = require('fs');


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
        privacyStatus: 'private', // Set the privacy status of the video (public, private, unlisted)
    },
};

// Define the video file path
const videoFilePath = './646107c9f8c634bf8322428d.mov';

// Read the video file
const videoFileStream = fs.createReadStream(videoFilePath);

// Upload the video
youtube.videos.insert({
        part: 'snippet,status',
        requestBody: videoMetadata,
        media: {
            body: videoFileStream,
        },
    },
    (err, res) => {
        if (err) {
            console.error('Error uploading video:', err);
            return;
        }

        console.log('Video uploaded successfully!');
        console.log('Video ID:', res.data.id);
    });