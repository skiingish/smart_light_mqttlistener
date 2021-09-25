// Created by Sean Corcoran
// Light Controller MQTT Listener.
// For SIT314 - Final Project - Deakin University - 2021

// Include the MQTT package.
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const axios = require('axios');
const config = require('config');
const Devices = require('./models/devices');
const mqttPublish = require('./mqttPublish');

// Created a MQTT client connected to the hivemq service. 
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// MongoDB - add the username, password, to connection string.
const connectString = `mongodb+srv://${config.get('db.user')}:${config.get('db.password')}@sit314.ljihj.mongodb.net/sit314?retryWrites=true&w=majority`;

// Set to the type of messages to listen for.
let topic = "/scorlights/#";

// Connect to the MQTT service and subscribe to listen to the required topic, also connect to the database/
client.on('connect', () => {
    client.subscribe(topic);
    console.log('MQTT Connected');
    
    // Connect to the MongoDB.
    mongoose.connect(connectString, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to db'))
        .catch(err => {
            // Show db connection error on the console. 
            console.log('Could not connect to the db. ', err);
        });
});

// Display messages and perform action if a switch message.
client.on('message', (topic, message) => {
    console.log(`${topic} : ${message}`);

    // Split up the topic.
    let splitTopic = topic.split("/");
    
    // If this is a switch topic. actions will need to performed.
    if (splitTopic[2] == "switch")
    {
        // call the db function and look and send on the MQTT message to the target device to toggle it.
        lookupTargetAndSend(splitTopic[3], message);
    }
});

async function lookupTargetAndSend(device_id, message) {
    
    // Look up control device from the DB.
    const device = await Devices
        .find({ device_id: device_id })
        .catch((err) => {
            console.log(err);
            return success;
        });

    console.log(`MQTT target for device ID: ${device_id} is: ${device[0].target}`);

    // If toggle message.
    if (message == "toggle")
    {
        toggle(device, message);
    }

    // If change state message.
    if (message == "on" || message == "off")
    {
        // Set the encoding And change from a buffer into a string.
        const buf = Buffer.from(message, 'utf-8')
        changeState(device, buf.toString());
    }
}

async function toggle(device, message)
{
    // Split up the target string.
    let splitTarget = device[0].target.split("/");
        console.log(splitTarget.length);
    if (splitTarget.length == 2) {
        // Target All
        axios
            .post(`${config.get('API_Address')}/lightsV2/toggle/all/`)
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    if (splitTarget.length == 3) {
        // Target Apartment
        axios
            .post(`${config.get('API_Address')}/lightsV2/apartment/${splitTarget[1]}/toggle`)
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    if (splitTarget.length == 4) {
        // Target Room
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

    if (splitTarget.length == 5) {
        // Target One Light
        mqttPublish(`/scorlights${device[0].target}`, message);
        // Could replace the above with just the api call
    }

    // Close the db connection.
    //mongoose.connection.close(); 
}

async function changeState(device, message)
{
    // Split up the target string.
    let splitTarget = device[0].target.split("/");
        console.log(splitTarget.length);
    if (splitTarget.length == 2) {
        // Target All
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

    if (splitTarget.length == 3) {
        // Target Apartment
        axios
            .post(`${config.get('API_Address')}/lightsV2/apartment/${splitTarget[1]}/changestate/`,{
                stateChange: message
            })
            .then(res => {
                //console.log(res);
            })
            .catch(err => {
                console.log(err);
            });
    }

    if (splitTarget.length == 4) {
        // Target Room
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

    if (splitTarget.length == 5) {
        // Target One Light
        mqttPublish(`/scorlights${device[0].target}`, message);
        // Could replace the above with just the api call
    }
}
// Could also be extended to get the current state field on the devices within the db and update them, 
// i.e lights in room x turned off, set all lights in that room to off 

