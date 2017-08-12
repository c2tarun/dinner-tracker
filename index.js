var dashButton = require('node-dash-button');
var AWS = require('aws-sdk');
var moment = require('moment');

var awsCredentials = new AWS.SharedIniFileCredentials({profile:'dinner-tracker'});
AWS.config.update({
	region: 'us-west-2',
	endpoint: 'https://dynamodb.us-west-2.amazonaws.com'
});
AWS.config.credentials = awsCredentials;

var dinnerDash = dashButton("fc:a6:67:85:4f:5a", null, null, 'all');
dinnerDash.on("detected", () => {
	console.log("Yay dinner is ready!!");
	var dinnerTime = moment().format();
	console.log("dinner done at " + dinnerTime);

	var params = {
		Item: {
			"dinnerTime": {
				S: dinnerTime
			}
		},
		TableName: "dinner-timings"
	};

	var dynamodb = new AWS.DynamoDB();
	console.log(params);
	dynamodb.putItem(params, function(err, data) {
		if (err) {
			console.log(err, err.stack);
		} else {
			console.log(data);
		}
	});
});

