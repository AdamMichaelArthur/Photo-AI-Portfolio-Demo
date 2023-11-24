import { spawn } from 'child_process';

const curlCommand = 'curl';
const url = 'https://api.bombbomb.com/v2/videos/';
const file = '/Users/adamarthur/Documents/Software Projects/contentbounty/api/tools/automation/2023-05-24 12-55-09.mov';
const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjU5NDE2NTRjODUyODI0ODZmNGIxM2NkYmNjOWY0YzQ2Y2RlNzBkYTAwZmFkNDUxYWNhOTlmZjI3NDYxYTk3YTRhN2IzYWM3NTllMjYwYjdkIn0.eyJhdWQiOiI3ODk1ODQ0Yy1hNTE3LTliMWYtYTMzZi1iODc4YTNhZTk0YjMiLCJqdGkiOiI1OTQxNjU0Yzg1MjgyNDg2ZjRiMTNjZGJjYzlmNGM0NmNkZTcwZGEwMGZhZDQ1MWFjYTk5ZmYyNzQ2MWE5N2E0YTdiM2FjNzU5ZTI2MGI3ZCIsImlhdCI6MTY4NDkzNjU5NC4yODk5OTMsIm5iZiI6MTY4NDkzNjU5NC4yODk5OTMsImV4cCI6MTY4NDk0MDE5NC4yNzAyNDksInN1YiI6ImYyYmJlNzM2LTRiOWYtOTc5NC1jZDAyLWU5MDNkZjU3NGU0YSIsInNjb3BlcyI6WyJhbGw6bWFuYWdlIl0sImJiY2lkIjoiYmUwMDZkODYtOTU3Yy1kOTU1LThiMWEtZjhhOGY1NGFhNDRlIn0.NdhKIuBaDPU2v03aXjkSpNbgCLPOSg8snr9ODeyRGzrcSF9mQNwJCF4jx6V-W59gmmcLpcjkkjbuoER5mXTlGZ-KIp6jNHZs-L8EVbrpRxs9H7hD2O2H1fClQ1yDZpEKZub2BE2_RugSsJ1sFqDdlzRESdgNpH15eaNABXqQ5e4';

// Create the curl command arguments
const curlArgs = [
  '--location',
  url,
  '--header',
  `Authorization: Bearer ${token}`,
  '--form',
  `file=@${file}`,
  '--form',
  'name="My Test Upload"',
  '--form',
  'description="My Test Description"',
];

// Spawn the curl command
const curlProcess = spawn(curlCommand, curlArgs);

// Listen for output
curlProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

curlProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

// Listen for completion
curlProcess.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
