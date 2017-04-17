'use strict';

console.log('Loading function');
const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const sesMailer = new aws.SES();
const dynamo = new doc.DynamoDB();

const Messages = require('./messages');

let messages = new Messages(dynamo, process.env.TABLE_NAME, sesMailer);


module.exports.getMessages = (event, context, callback) => {
    console.log(JSON.stringify(context));
    messages.getMessages(callback);
}

module.exports.addMessage = (event, context, callback) => {    
    console.log(JSON.stringify(context));
    var contextUserId = 'jazaret@gmail.com';   //context.identity
    messages.addMessage(event, contextUserId, callback);
}

module.exports.updateMessage = (event, context, callback) => {
    var contextUserId = 'j.azaret@gmail.com';   //context.identity
    messages.updateMessage(event, contextUserId, callback);
}

module.exports.triggerMessagesNotify = (event, context, callback) => {
    messages.triggerMessagesNotify(event.Records, context);
}