'use strict';

var wia = require('wia')('DEVICE_SECRET_KEY');

wia.logs.publish({level:"info", message:"Starting wia-raspicam."});

var alarmEnabled = false;
wia.events.publish({name: "alarmEnabled", data: "false"});

// Setup the camera
var fs = require('fs');
var RaspiCam = require("raspicam");

var camOpts = {
	mode: "photo",
	output: "photo.jpeg",
	rotation: 180
}

var camera = new RaspiCam(camOpts);

camera.on("read", function(err, timestamp, filename){
	if (err) {
    wia.logs.publish({level:"error", message:err.toString()});
    return;
  }

	wia.events.publish({
		name: "photo",
		file: fs.createReadStream(__dirname + '/' + filename)
	});
});

// Use this to detect motion using a PIR
var Gpio = require('onoff').Gpio,
	pir = new Gpio(4, 'in', 'both');

pir.watch(function (err, value) {
	if (err) {
    wia.logs.publish({level:"error", message:err.toString()});
    return;
  }
	if (alarmEnabled) {
		wia.events.publish({name: "motionDetected"});
		camera.start();
	}
});

// Functions to remotely enable/disable alarm and take photo
wia.functions.register({
	name: "enableAlarm"
}, function(data) {
	alarmEnabled = true;
	wia.events.publish({name: "alarmEnabled", data: "true"});
});

wia.functions.register({
	name: "disableAlarm"
}, function(data) {
	alarmEnabled = false;
	wia.events.publish({name: "alarmEnabled", data: "false"});
});

wia.functions.register({
	name: "takePhoto"
}, function(data) {
	camera.start();
});
