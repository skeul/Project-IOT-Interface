var http = require('http');
var fs = require('fs');
var conf = require('./config')

// Chargement du fichier index.html affiché au client
var server = http.createServer(function (req, res) {
    fs.readFile('./public/index.html', 'utf-8', function (error, content) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
    });
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {

    // init du client mqtt adafruit
    var mqtt = require('mqtt'),
        my_topic_name = 'skeul/groups/sensor';

    var client = mqtt.connect('mqtts://io.adafruit.com', {
        port: 8883,
        username: conf.ADAFRUIT_USER,
        password: conf.ADAFRUIT_KEY
    });

    client.on('connect', () => {
        client.subscribe("skeul/feeds/temp")
        client.subscribe("skeul/feeds/color")
        client.subscribe("skeul/feeds/humidity")
        client.subscribe("skeul/feeds/lum")
    });

    client.on('error', (error) => {
        console.log('MQTT Client Errored');
        console.log(error);
    });

    client.on('message', function (topic, message) {

        var ret = client.subscribe('skeul/feeds/color')
        console.log(topic)
        console.log(message.toString())
        if (message && topic == "skeul/feeds/temp") {
            socket.emit('temp', parseFloat(message).toFixed(2).toString())
            console.log(message.toString())
        }

        if (message && topic == "skeul/feeds/humidity") {
            socket.emit('humidity', parseFloat(message).toFixed(2).toString())
            console.log(message.toString())
        }

        if (message && topic == "skeul/feeds/color") {
            socket.emit('color', message.toString())
            console.log(message.toString())
        }

    });

    // Qaund on reçoit des message venant du front on les envois à l'objet    
    socket.on('lumiere', function (message) {
        console.log("Lumière =", message);
        if (message === 1)
            client.publish('skeul/feeds/lum', "ON")
        else
            client.publish('skeul/feeds/lum', "OFF")
    });
    socket.on('color', function (message) {
        console.log("Couleur =", message);
        client.publish('skeul/feeds/color', message)
    });
});

server.listen(8080);