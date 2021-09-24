// Include the MQTT package.
const mqtt = require('mqtt');

// Created a MQTT client connected to the hivemq service. 
const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

const apartment_id = 'testapartment';
const room_id ='testroom';
const device_id = 'testdevice1';

// Flitered.
var all = "/scorlights/";
var apartment = `/scorlights/${apartment_id}/`;
var room = `/scorlights/${apartment_id}/${room_id}/`;
var device = `/scorlights/${apartment_id}/${room_id}/${device_id}/`;

let topics = [all, apartment, room, device];

let light = 'off';

// Connect to the MQTT service and subscribe to listen to the required topic. 
client.on('connect', () => {
    client.subscribe(topics);
    console.log('mqtt connected');
});

// Display messages.
client.on('message', (topic, message) => {
    console.log(`${topic} : ${message}`);

    if (message == 'toggle')
    {
        if (light == 'off')
        {
            light = 'on';
        }
        else 
        {
            light = 'off';
        }
    }

    if (message == 'on')
    {
        if (light == 'off')
        {
            light = 'on';
        }
    }

    if (message == 'off')
    {
        if (light == 'on')
        {
            light = 'off';
        }
    }

    console.log(light);
});