This file has been a labor of love.


It started with a need to create a performant pagination solution in Mongo 3.  

The key here is performant.  Solutions that used skip() and limit() started to
lag after only a few thousand records.

So I created 