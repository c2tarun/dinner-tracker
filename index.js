var dashButton = require('node-dash-button');
var moment = require('moment-timezone');
var readConfig = require('read-config');
var AWS = require('aws-sdk');

var homeDirectory = process.env['HOME'];
var config = readConfig(homeDirectory + '/.config/dinner-tracker/config');

// Loading aws credentials
var awsCredentials = new AWS.SharedIniFileCredentials({
    profile: 'dinner-tracker',
    filename: config.awsCredentials
});

// Setting region
AWS.config.update({
    region: 'us-west-2'
});
AWS.config.credentials = awsCredentials;

// Creating dynamodb
var dynamodb = new AWS.DynamoDB();
dynamodb.setEndpoint('https://dynamodb.us-west-2.amazonaws.com');

// Creating aws sns
var sns = new AWS.SNS();
sns.setEndpoint('https://sns.us-west-2.amazonaws.com');

// Creating dash button instance
var dinnerDash = dashButton(config.dinnerDashSSID, null, null, 'all');
dinnerDash.on("detected", () => {
    makeEntryInDynamoDB((err) => {
        console.error("Sending data to dynamo failed ", err);
    }, (dinnerTime) => {
        console.log("Data sent to Dynamo");
        sendSMS(dinnerTime);
    });
});

// Method will make an entry in dynamo db.
var makeEntryInDynamoDB = function(error, success) {
    var seattleTime = moment.tz('America/Los_Angeles');
    console.log("Dinner Time " + seattleTime.format().toString());
    var params = {
        Item: {
            "dinnerTime": {
                S: seattleTime.format().toString()
            }
        },
        TableName: config.dinnerTableName
    };

    console.log(params);
    // Putting item in dynamo
    dynamodb.putItem(params, function(err, data) {
        if (err) {
            error(err);
        } else {
            success(seattleTime);
        }
    });
}

// Method will send an sms
var sendSMS = function(dinnerTime) {
    var day = dinnerTime.format('YYYY-MMMM-DD');
    var time = dinnerTime.format('h:mm:ss A');
    var smsMessage = "Dinner time on " + day + " is " + time;

    console.log("SMS: " + smsMessage);

    var snsParams = {
        Message: smsMessage,
        TopicArn: config.dinnerSnsArn
    }

    console.log("SNS Arn: " + config.dinnerSnsArn);

    sns.publish(snsParams, function(err, data) {
        if (err) {
            console.error("Unable to send message. Error JSON: ", JSON.stringify(err, null, 2));
        } else {
            console.log("Results from sending message: ", JSON.stringify(data, null, 2));
        }
    });
}
