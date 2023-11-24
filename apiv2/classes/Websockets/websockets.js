// Created Jul 22 2022 by Adam Arthur

/*	Initializes an Express App Server and listens on the port specified environment variable.

*/

import "module-alias/register.js";
import 'dotenv/config'
import DatabaseConnection from '../Database/Mongo/mongo.js'
import { MongoClient, ObjectId } from 'mongodb';

import express from "express";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const app = express();
const server = new HTTPServer(app);
const io = new SocketIOServer(server);

export default class Websockets {

  bDatabaseConnected = false;

  events = [];

  constructor(){
    this.app = new express();
    this.server = new HTTPServer(this.app)
    this.socket = new SocketIOServer(this.server)

    const classPrototype = Websockets.prototype;
    const methodNames = Object.getOwnPropertyNames(classPrototype).filter(
        (prop) => typeof classPrototype[prop] === 'function' && prop !== 'constructor'
    );

    for(var method of methodNames){
      if(method[0] == '_'){
        this.events.push(method);
      }
    }
  }

  startServer(){
    this.connectToDatabase();
  }

  stopServer(){

  }

  // Connects to the database, and if successful, sets a "db" object.  Makes sure to start
  // listening only after a database connection is established.
  connectToDatabase(){
    this.database = new DatabaseConnection( (db)=> 
      { 
        this.bDatabaseConnected = true;
        this.db = db;
        this.server.listen(122);
        this.handleConnection();
        console.log("Websockets Listening on port 122");
      } );
    return;
  }

  handleConnection(){
    this.socket.on('connection', (socket) => {
      console.log("Client Connected")
      this.listenForEvents(socket);
      this.handleDisconnection(socket);
      this.sendAvailableOrders(socket);
    });
  }

  listenForEvents(socket){
    for(var event of this.events){
      let eventListenCmd = `socket.on('${event.slice(1)}', (data) => { if(this.check("data")) { this.${event}(data, socket.id); }; } )`
      // Yes, I've heard all the security stuff about eval.  I like eval.  So go away.  You wanna write all this code manually go be my guest.
      eval(eventListenCmd);
      
    }
  }

  check(data){
    // Implement some type checking in the future.
    // Every command & data will be sent here first.  Can use for authorization, type checking, etc. etc.
    
    return true;
  }

  /* We invent a convention: if function names begin with "_" -- we're listening for an event of the same name, but without the _.  */
  /* As a security note -- this code should be considered highly unsecure.  For proof of concept, demo purposes only.  */
  async _update_document_location(data){


    let collection = this.db.collection(data['collection']);
    delete data['collection'];

    let query = {
      _id: new ObjectId(data._id)
    }

    let update = {
      $set: { "GPS": data['GPS'] }
    }

    try {
      let result = await collection.updateOne(query, update);
    } catch(err){
      console.log(101, "Problem with database", err);
    }
  }

async _claim_order(data) {
  const session = this.database.connection.client.startSession(); // Start a transaction session
  try {
    session.startTransaction();

    let collection = this.db.collection('orders');
    let query = {
      _id: new ObjectId(data.order_id),
      orderAccepted: { $ne: true } // Ensure the order is not already accepted
    };

    let update = {
      $set: { "orderAccepted": true, "driver_id": new ObjectId(data.driver_id) }
    };

    let options = { returnOriginal: false, session }; // Use the transaction session

    let result = await collection.findOneAndUpdate(query, update, options);

    if (!result.value) {
      // Order was already claimed or does not exist
      throw new Error('Order is already claimed or does not exist');
    }

    await session.commitTransaction();
    console.log('Order claimed successfully', result.value);
  } catch (err) {
    await session.abortTransaction();
    console.error('Error claiming order', err);
  } finally {
    session.endSession();
  }
}


  async sendAvailableOrders(socket){
    let coll = this.db.collection('orders');
    try {
      var result = await coll.find({ orderAccepted: false }).toArray();
    } catch(err) {
      console.log(156, err);
    }
    socket.emit('available_orders', result);    
  }

  openChangeStreams = [];

  closeConnectionChangeStreams(socketId, request =null){
      this.openChangeStreams.forEach(element => {
          if (element.socketId === socketId) {
              let changeStreamHandle = element.changeStreamHandle;
              if(request == null){
                changeStreamHandle.close();
              } else {
                if(request === element.request){
                  changeStreamHandle.close();
                }
              }
          }
      });
  }

  /* Requests for change stream notifications */
  async _request_nearby_order_updates(data =null, socketId =null){

    console.log(92, data, socketId);
    
    let collection = this.db.collection('orders');
    //delete data['collection'];

    let operationTypes = ['insert', 'update'];

    // For now, we select for everything
    let query = {$exists: true }

    let distance = data['distance'];  // In meters

    let GPS = data['GPS']

    var changeStreamQuery = [ { $match: { operationType: { $in: operationTypes } } } ]

    const centerPoint = GPS; 

    const maxDistance = distance;

    // For this call, we're only going to allow one change stream per connection
    this.closeConnectionChangeStreams(socketId, 'request_nearby_order_updates');

    console.log(201, "Watching for client", changeStreamQuery, socketId);
    let changeStreamHandle = collection.watch(changeStreamQuery)
      .on('change', async data => {

          console.log(205, "Change Detected");
          let coll = this.db.collection('orders');

          try {
            var result = await coll.findOne({_id: data.documentKey._id })
          } catch(err) {
            console.log(156, err);
          }

          const coordinates = result?.GPS;

          //if (coordinates) {
              //const distance = calculateDistance(centerPoint, coordinates);

              //if (distance <= maxDistance) {
                  // Distinguish between insert and update
                  if (data.operationType === 'insert') {
                      // Handle insert
                      this.socket.to(socketId).emit('list_order', result);
                  } else if (data.operationType === 'update') {
                      // Handle update
                      if(result["orderAccepted"] == true){
                        // A driver has confirmed an order
                        this.socket.to(socketId).emit('remove_order', result);
                      } else {
                        // An order has become available
                        this.socket.to(socketId).emit('list_order', result);
                      }
                  }
              //}
          //}
      });


      // We add the change stream handle to this array, so we can close it out and free the resource after the client disconnects.
      this.openChangeStreams.push ( { socketId: socketId, changeStreamHandle: changeStreamHandle, request: 'request_nearby_order_updates' } );
    
      function calculateDistance(coords1, coords2) {
          const toRadian = angle => (Math.PI / 180) * angle;
          const earthRadius = 6371e3; // meters

          const latitude1 = toRadian(coords1.latitude);
          const longitude1 = toRadian(coords1.longitude);
          const latitude2 = toRadian(coords2.latitude);
          const longitude2 = toRadian(coords2.longitude);

          const deltaLatitude = latitude2 - latitude1;
          const deltaLongitude = longitude2 - longitude1;

          const a = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(deltaLongitude / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

          return Math.round(earthRadius * c); // Distance in meters
      }

  }

  /* Updates a documents GPS Coordinates based on _id */
  async _update_location(data){

  }

  handleDisconnection(socket){
    socket.on('disconnect', () => {
      console.log(212, "client disconnected, closing change streams for", socket.id);
      this.closeConnectionChangeStreams(socket.id);
    });
  }


}

(() => {
    try {
        const server = new Websockets();
        server.startServer()
    } catch (error) {
        console.error(error);
    }
})();
