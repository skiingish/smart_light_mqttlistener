// Include the axios package
const axios = require('axios');

function trafficLogger(data, channel) {
    // The write thingspeak channel
    const thingSpeakWriteAPI = `https://api.thingspeak.com/update?api_key=LY58DF5CGZP2ESAF&field${channel}=${data}`;
    axios.get(thingSpeakWriteAPI)
    .then((res) => {
        // Nothing here.
    })
    .catch((err) => {
        console.log("Traffic Logger Error");
        console.log(err);
    });
}

module.exports = trafficLogger;

