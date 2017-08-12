var moment = require('moment');

makeDynamoDBEntry = function() {
	console.log("called makeDynamoDBEntry");
	console.log(moment().format());
	console.log(moment().utc().format());
}

makeDynamoDBEntry();