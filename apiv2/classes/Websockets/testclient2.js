import { io } from "socket.io-client";

class SocketClient {
    constructor(url) {
        this.socket = io(url, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        this.setupListeners();
        this.setupPeriodicEvent();
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to the server');
            this.socket.emit('request_nearby_order_updates', {  GPS: { latitude: 41.02440968559823, longitude: 28.979657313573792 }, 'distance':2000});
        });

        this.socket.on('location_update', (data) => {
            console.log(23, data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });

        this.socket.on('reconnect_attempt', () => {
            console.log('Attempting to reconnect...');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
        });
    }

    setupPeriodicEvent() {
        setInterval(() => {

            //this.socket.emit('request_nearby_order_updates', {  GPS: { latitude: 41.02440968559823, longitude: 28.979657313573792 }, 'distance':2000});
        }, 15000);
    }
}

const client = new SocketClient('http://localhost:122');

// Keep the Node.js process running
setInterval(() => {
    //console.log('Keeping the process alive...');
}, 5000);
