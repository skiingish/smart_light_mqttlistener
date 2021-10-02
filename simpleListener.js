// For SIT314 - Final Project - Deakin University - 2021

// Include the packages.
const mqtt = require('mqtt');

// new Date object
let date = new Date();

// Create a MQTT client connected to the hivemq service. 
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

// Set to the type of messages to listen for. (listen to all topics)
let topic = "/scorlights/#";

// Connect to the MQTT service and subscribe to listen to the required topic, also connect to the database/
client.on('connect', () => {
    client.subscribe(topic);
    console.log(`${date.toLocaleString()} - MQTT Connected`);
});

// Display MQTT messages.
client.on('message', (topic, message) => {
    console.log(`${date.toLocaleString()} - ${topic} : ${message}`);
});
