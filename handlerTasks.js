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
    var item = event.body ? JSON.parse(event.body) : event;
    tasks.addTask(item, callback);
};

module.exports.updateTask = (event, context, callback) => {
    var item = event.body ? JSON.parse(event.body) : event;
    tasks.updateTask(item, callback);
}

module.exports.deleteTask = (event, context, callback) => {
    var item = event.body ? JSON.parse(event.body) : event;
    tasks.deleteTask(event.taskId, callback);
}

module.exports.emailTasks = (event, context, callback) => {
    tasks.emailTasks(context);
}

module.exports.taskNotify = (event, context, callback) => {
    tasks.taskNotify(event.Records, context);
}

module.exports.hello = (event, context, callback) => {
    console.log('entering hello');
    callback(null, "finsihed hello");
}
