'use strict';

console.log('Loading function');
const aws = require('aws-sdk');
const doc = require('dynamodb-doc');
const sesMailer = new aws.SES();
const dynamo = new doc.DynamoDB();

const Tasks = require('./tasks');

let tasks = new Tasks(dynamo, process.env.TABLE_NAME, sesMailer);

module.exports.getTasks = (event, context, callback) => {
    tasks.getTasks(callback);
}

module.exports.addTask = (event, context, callback) => {
    tasks.addTask(event, callback);
};

module.exports.updateTask = (event, context, callback) => {
    tasks.updateTask(event, callback);
}

module.exports.deleteTask = (event, context, callback) => {
    tasks.deleteTask(event.taskId, callback);
}

module.exports.emailTasks = (event, context, callback) => {
    tasks.emailTasks(context, callback);
}
