README.MD

This folder contains classes designed to provide infrastructure to solve a number of common problems.

Problem
-------

How do you make performant big queries against API's that have rate limits?

Scenarios
---------

A service wants to scrape websites.  Each website scrape takes 1-2 seconds.  There are 10,000 sites to scrape.
An OpenAI ChatGPT call takes 5-10 seconds.  We need to process 100 requests to complete a task, and we need to
do it as fast as possible.
