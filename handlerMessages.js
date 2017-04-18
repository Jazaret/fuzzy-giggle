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
    //todo - use cognito for identity user context if possible
    var contextUserId = event.contextUserId || 'jazaret@gmail.com';
    messages.addMessage(event, contextUserId, callback);
}

module.exports.updateMessage = (event, context, callback) => {
    //todo - use cognito for identity user context if possible
    var contextUserId = event.contextUserId || 'jazaret@gmail.com';
    messages.updateMessage(event, contextUserId, callback);
}

module.exports.triggerMessagesNotify = (event, context, callback) => {
    console.log(JSON.stringify(event));
    var messageList = [];
    event.Records.forEach(function(record) {
        if (record.dynamodb && record.dynamodb.NewImage) {
            var dbImage = record.dynamodb.NewImage;
            messageList.push({
                messageId: dbImage.messageId["S"],
                userIdUpdated: dbImage.userIdUpdated["S"],
                allowEdit: dbImage.allowEdit["BOOL"],
                fromUserId: dbImage.fromUserId["S"],
                message: dbImage.message["S"],
                toUserId: dbImage.toUserId["S"],
                dateUpdated: dbImage.dateUpdated["S"],
                dateCreated: dbImage.dateCreated["S"],
            });
        }
    });
    messages.triggerMessagesNotify(messageList, context);
}