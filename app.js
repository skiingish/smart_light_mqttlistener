// Created by Sean Corcoran
// Light Controller MQTT Listener.
// For SIT314 - Final Project - Deakin University - 2021

// Include the packages.
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('config');
// Include the DB model.
const Devices = require('./models/devices');
// Include custom functions.
const mqttPublish = require('./mqttPublish');
const trafficLogger = require('./trafficLogger');

console.log(config.get('API_Address'));

// Create a MQTT client connected to the hivemq service. 
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// MongoDB - add the username, password, to connection string.
const connectString = `mongodb+srv://${config.get('db.user')}:${config.get('db.password')}@sit314.ljihj.mongodb.net/sit314?retryWrites=true&w=majority`;

// Set to the type of messages to listen for. (listen to all topics)
let topic = "/scorlights/#";

// Connect to the MQTT service and subscribe to listen to the required topic, also connect to the database/
client.on('connect', () => {
    client.subscribe(topic);
    console.log('MQTT Connected');

    // Connect to the MongoDB.
    mongoose.connect(connectString, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to Mongo DB');
            connectedToDB = true;
        })
        .catch(err => {
            // Show db connection error on the console. 
            console.log('Could not connect to the db. ', err);
        });
});

// Display MQTT messages and perform action message is coming from a control device.
client.on('message', (topic, message) => {
    console.log(`${topic} : ${message}`);

    // Fire off data to the traffic logger at the MQTT field.
    trafficLogger(1, 1);

    // Split up the topic.
    let splitTopic = topic.split("/");

    // If this is a switch topic. actions will need to performed.
    if (splitTopic[2] == "switch") {
        // Call the db function and look and send on the MQTT message to the target device(s).
        lookupControlDeviceTarget(splitTopic[3], message)
        .catch( (err) => {
            console.log(err);
        });
    }
});

// Looks up the target that this control devices is assigned to control which is stored in the DB.
async function lookupControlDeviceTarget(device_id, message) {
    // Look up control device from the DB.
    const device = await Devices
        .find({ device_id: device_id })
        .catch((err) => {
            console.log(err);
            //return success;
        })
    // If no device found.
    if (device.length == 0)
    {
        console.log(`Device Not In Database: ${device_id}`);
        return;
    }    
    
    //console.log(`MQTT target for device ID: ${device_id} is: ${device[0].target}`);

    // If the toggle message.
    if (message == "toggle") {
        toggle(device, message);
    }

    // If change state message.
    if (message == "on" || message == "off") {
        // Set the encoding and change from a buffer into a string. (Used to cause a error)
        const buf = Buffer.from(message, 'utf-8')
        changeState(device, buf.toString())
        .catch( (err) => {
            //console.log(err);
        });
    }
}

// Call the toggle API for the target device(s)
async function toggle(device, message) {
    // Split up the target string. (the more the sections in the string the finer the control target)
    let splitTarget = device[0].target.split("/");
    //console.log(splitTarget.length);

    // Target All
    if (splitTarget.length == 2) {
        axios
            .post(`${config.get('API_Address')}/lightsV2/toggle/all/`)
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Targeting a apartment
    if (splitTarget.length == 3) {
        axios
            .post(`${config.get('API_Address')}/lightsV2/apartment/${splitTarget[1]}/toggle`)
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Targeting a room.
    if (splitTarget.length == 4) {
        axios
            .post(`${config.get('API_Address')}/lightsV2/room/${splitTarget[2]}/toggle/`, {
                apartment_id: `${splitTarget[1]}`
            })
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Targeting on device. 
    if (splitTarget.length == 5) {
        // Target One Light
        mqttPublish(`/scorlights${device[0].target}`, message);
        // Could replace the above with just the api call, however this method has a better round trip time.
    }
}

// Call the change state (on or off) API for the target device(s)
async function changeState(device, message) {
    // Split up the target string. (the more the sections in the string the finer the control target)
    let splitTarget = device[0].target.split("/");
    //console.log(splitTarget.length);

    // Target All 
    if (splitTarget.length == 2) {

        console.log(message);
        axios
            .post(`${config.get('API_Address')}/lightsV2/changestate/all/`, {
                stateChange: message
            })
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }
    // Target Apartment
    if (splitTarget.length == 3) {

        axios
            .post(`${config.get('API_Address')}/lightsV2/apartment/${splitTarget[1]}/changestate/`, {
                stateChange: message
            })
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Target Room
    if (splitTarget.length == 4) {

        axios
            .post(`${config.get('API_Address')}/lightsV2/room/${splitTarget[2]}/changestate/`, {
                apartment_id: `${splitTarget[1]}`,
                stateChange: message
            })
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Target One Light
    if (splitTarget.length == 5) {
        mqttPublish(`/scorlights${device[0].target}`, message);
        // Could replace the above with just the api call, however this method has a better round trip time.
    }
}

// Could also be extended to get the current state field on the devices within the db and update them, 
// i.e lights in room x turned off, set all lights in that room to off 

