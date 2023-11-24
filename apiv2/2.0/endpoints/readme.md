This folder defined all API endpoints

Creating a new endpoint is easy!

Step 1: Create a new folder for your endpoont.  It should be all lowercase, one word, no special characters.  This becomes your path.

So for example, if you make a directory called "transfers", your URL path becomes:

BASE_URL + /transfers/

That's it!  You don't have to do anything else to wire up your new route.

Step 2: Create a new file inside your new directory.  It should be the exact name of your directory, just with a .js extension.

Step 3: Copy the class template from the 'class-template.md' file, and change name from 'Example' to 'Directory'

Step 3: Test your new route in postman.

And you're done!  It takes about 30 seconds once you've done it a few times.

A few notes:

You get built in parameter checking and type checking!

When creationg your functions, provide default parameters

async test(str ='', arr =[], num =0)

If the request does not include an expected parameter, or if the type is invalid, the client automatically gets an error.
You don't have to worry about it!

