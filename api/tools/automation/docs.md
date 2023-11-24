TestDB: delete_trash
ProdDB: yourfullschoolleads

Step 1:

	Clear the spreadsheet
	db.delete_trashes.remove({});

Step 2:

	Download a copy of the data from Google Sheets
	https://docs.google.com/spreadsheets/d/1baOSvyEdIv1H94BrWT2FMq1yiRh6DnK20_NEk41kNPY/edit#gid=0

Step 3:

	Inside Postman, goto the "Your Full School" Collection and find the request "Import Spreadsheet Into Database"
	Click on "Body", then change the file-value to be the download from Step 2.
	Send the request.

Step 4:

	On the cli, type 'automation' to be taken to the script directory

Step 5:

	Start the script
	cmd: npm start


