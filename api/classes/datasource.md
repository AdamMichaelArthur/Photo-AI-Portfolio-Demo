The Datasource API is a powerful class that's designed to make interacting
with a MongoDB database a breeze.

Security
--------

The security model for this is as follows:

	-	Public: no restrictions whatsoever
	-	Account: only people whose login details are under a particular account can access this data
	-	User: only the user has access to this data by default
	-	Protected: only the user has access to this data

In general, the Account owns the data: so any data that's associated with a user is also available to
the account.  No privacy is assumed or accounted for here.  If there is data that needs to be accessible
only to the user, that needs to use a "protected" flag specifically.

Excel Import
------------

Datasource offers a powerful way to take existing spreadsheet data in csv or Excel format and insert it into
the database.


Special Functions
-----------------
progress
completed
sort
search
clone
distinct
distinctids
export
array
arrayall
arrayrm
arrayrmall
arraypatch
arrayput
autocomplete
all
swap
aggregate
account
dates
calendar
key
owner
getkeys
selected
nextselected
prevselected
mergefields
emailfields
count
bulk

The Datasource API requires an authenticated and logged in user for most calls

GET
===

URL Pattern: /datasource/[collection]
Options:	/max_records	Specifies the max number of records to return
			/sort			Allows you to sort the records by criteria
			/filter			Allows you to specify a custom search filter
			/id 			Allows you to get a specific document
			/all 			Returns all matching documents including those not made by the user.

Result sets are paginated by default.  On some occasions where you need to get the
entire result set, use the /all option.  Be careful with it though, there are no guardrails if
you have a large result set.  

Filter

/datasource/bounty/filter/eyAiZGVzY3JpcHRpb24iOnsiJGV4aXN0cyI6IHRydWV9IH0=

With the filter option, you can pass through any valid MongoDB find query.  The API
automatically adds security and filtering -- so you will only get documents that were
created by the user.

/filter/[base-64 encoded string]
{ "description":{$exists: true} }
eyAiZGVzY3JpcHRpb24iOnskZXhpc3RzOiB0cnVlfSB9



