const socketIOClient = require('socket.io-client');

// Connect to the server
const serverURL = 'http://localhost:3000'; // Replace with your server URL if different
const socket = socketIOClient(serverURL);

// Event handler for successful connection
socket.on('connect', () => {
  console.log('Connected to the server');

  // Send a chat message to the server
  const message = 'Hello, server!';
  socket.emit('chat message', message);
});

// Event handler for receiving chat messages
socket.on('chat message', (message) => {
  console.log('Received message:', message);
});

// Event handler for disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from the server');
});
