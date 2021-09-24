// Include the MQTT package.
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const config = require('config');
const Devices = require('./models/devices');
const mqttPublish = require('./mqttPublish');

// Created a MQTT client connected to the hivemq service. 
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// MongoDB - add the username, password, to connection string.
const connectString = `mongodb+srv://${config.get('db.user')}:${config.get('db.password')}@sit314.ljihj.mongodb.net/sit314?retryWrites=true&w=majority`;

// Set to the type of messages to listen for.
let flitered = false;
let topics = '';

// Set the topic paths.
// All messages.
var allMessages = "/scorlights/#";

// Flitered.
var shortrangeSpeeds = "/seanc/shortrange/speed/";
var allBattery = "/seanc/+/battery/";
var longrangeLatLong = "/seanc/longrange/latLong/";

// If not filtering subscribe to all messages else, only subscribe to the flitered ones.
if (!flitered) {
    // All messages.
    topics = [allMessages];
}
else {
    // Flitered.
    topics = [shortrangeSpeeds, allBattery, longrangeLatLong];
}

// Connect to the MQTT service and subscribe to listen to the required topic. 
client.on('connect', () => {
    client.subscribe(topics);
    console.log('mqtt connected');
    // Connect to the MongoDB.
    mongoose.connect(connectString, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to db'))
        .catch(err => {
            // Show db connection error on the console. 
            console.log('Could not connect to the db. ', err);
        });
});

// Display messages.
client.on('message', (topic, message) => {
    console.log(`${topic} : ${message}`);

    let splitTopic = topic.split("/");
    
    if (splitTopic[2] == "switch")
    {
        // call the db function and look and send on the MQTT message to the target device to toggle it.
        lookupTargetAndSend(splitTopic[3], message);
    }

});

async function lookupTargetAndSend(device_id, message)
{
    
        const device = await Devices
        .find({device_id: device_id})
        .catch((err) => {
            console.log(err);
            return success;
        });
    
        console.log(`MQTT target for device ID: ${device_id} is: ${device[0].target}`);
        mqttPublish(`/scorlights${device[0].target}`,message);

    // Close the db connection.
    //mongoose.connection.close();    
}

// Could also be extended to get the current state field on the devices within the db and update them, 
// i.e lights in room x turned off, set all lights in that room to off 

