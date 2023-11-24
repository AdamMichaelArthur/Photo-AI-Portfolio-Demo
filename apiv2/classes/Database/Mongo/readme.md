One of the reasons I ditched Mongoose is because it started making things more difficult
than just using the SDK provided by Mongo.

When Mongoose started, it provided a valuable layer that sat on top of the Mongo SDK.  However,
in 2023, my personal opinion is that the frustrations associated with Mongoose don't overcome
its advantages, especially since many of its original advantages have subsequently been provided
by the official SDK.

The previous iteration of this project relied on Mongoose extensively, but by the end I found myself
almost exlusively by-passing it to just do raw queries. 

My goal here is to provide an easy to use wrapper around common tasks, but enable easy and direct
access to mongo when needed.

This folder is for those who want to use MongoDB as their database.

Please note that the decision to NOT use Mongoose was intentional.