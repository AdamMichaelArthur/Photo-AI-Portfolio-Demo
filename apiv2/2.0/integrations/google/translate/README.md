The Google Translate API is fantastic -- it's fast and it's accuracy unparalelled.

However, I was in for a big which when basic testing cost me about $50.  My initial technical approach
worked, but from a business model it fails.  Translation has to be a minimal cost.

So, we have a new requirement where we will need to do the translation once, store the translation somehow and then use
it only when needed.

So, we can translate on insert and maintain duplicate collections for every language.

Here's how this would work.

Watch for database changes

When a CRUD operation happens, copy it to a new collection or document with the translation.

The problem with this approach is it will translate everything, even if it's never used.  


Or, we could just store a list of strings and do simple find/replace.  So here's how this would work
A string is sent for translation.  Wouldn't even necessarily need to store it in a database.  This would
probably be OK for small data sets, but would likely suffer performance issues if the dataset gets too big.

This needs to be weighed against development time.  It doesn't make sense to spend too much time solving this
problem, at this stage.

Here are a few important considerations.

#1: Insert and Updates are expected to be infrequent, and done by a relatively small number of users
#2: There will be very little variety.  Most restaurants sell variations of the same thing.
#3: I don't really want to introduce more complexity into the database.  I need a simple solution that can be implemented fast.

So, here's my proposed solution.

For each supported language, we have a corresponding .json file.

So english would be en.json, spanish would be es.json, etc.

Each json file contains key value pairs:

{
	"Pizza":"Kaşarlı pizza"
}

It's case sensitive -- we're comparing strings.  So:

{
	"Pizza":"Kaşarlı pizza"
}

is distinct from 

{
	"pizza":"kaşarlı pizza"
}

I'm doing it this way because we won't have context in where the strings are being used or why.

When a request is received in a language other than english, the strings are compared against this json file.  Matching strings are replaced, and if no matches are found, we'll implement logic to fetch the translation from an API to update the file.






