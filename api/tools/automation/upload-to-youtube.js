const {
    google
} = require('googleapis');

const fs = require('fs');

const hardcodedCredentials = {
    "installed": {
        "client_id": "1002938566232-q8emflioe2eq2ta0e2535v7vauoa0iom.apps.googleusercontent.com",
        "project_id": "adamsapi",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "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",
        "redirect_uris": ["http://localhost"]
    }
}

const accessToken = {
    "access_token": "ya29.A0ARrdaM__MnK9d9EY63-o6pSRF036D2IqVA_-L63ZxOYnCiA54n0JlbrWHKkwS2F4kXIlO0x0UbsRBdNWKV7W5mWlqOPPeh-yJwcWHKilhuii2T2YmnchgN9dVMyDHQaeZ3ccuticxv4VL4WfBtb0oxXHFrJb",
    "refresh_token": "1//09mJmTbOC16R5CgYIARAAGAkSNwF-L9IrVxTSXpOKZ-j88JFtltSQKWPVsesQY254vCaRayePi9Kh8c-6jYKvMK3wPlIdPEhie7E",
    "scope": "'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents",
    "token_type": "Bearer",
    "expiry_date": 1650746013047
}


class UploadToYoutube {
    constructor() {

        this.credentials = hardcodedCredentials;
        var auth = this.authorize(this.credentials, () => {

        });

        this.youtube = google.youtube({
            version: 'v3',
            auth
        });

    }

    authorize(credentials, callback) {

        const {
            client_secret,
            client_id,
            redirect_uris
        } = this.credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token.
        try {
            var token = accessToken
        } catch (err) {
            return this.getNewToken(oAuth2Client, callback);
        }

        this.oAuth2Client = oAuth2Client;
        this.token = token
        this.oAuth2Client.setCredentials(this.token);

        return oAuth2Client
    }

    getNewToken(oAuth2Client, callback) {
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

    uploadVideo(){
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

		const videoFilePath = './646107c9f8c634bf8322428d.mov';

		 const videoFileStream = fs.createReadStream(videoFilePath);

		 this.youtube.videos.insert(
		    {
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
		    }
		  );
    }

}

module.exports = UploadToYoutube;

var YouTube = new UploadToYoutube();
YouTube.uploadVideo();
