'use strict';

console.log('Loading function');
const uuid = require('node-uuid');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();


module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully! ' + uuid.v1(),
      input: event,
    }),
  };

  callback(null, response);

};

module.exports.getTasks = (event, context, callback) => {

  var result, response;

  dynamo.scan({ TableName: process.env.TABLE_NAME }, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            response = {
                statusCode: 200,
                body: JSON.stringify({
                  message: data
                }),
              };            
        }
        callback(null, response);
    });
};

module.exports.putTasks = (event, context, callback) => {

    var newId = uuid.v1();
    console.log('id = ' + newId);

    if (!event.name || !event.description) {
        response = {
          statusCode: 200,
          body: (!event.name) ? "Name is required" : "Description is required"          
        };        
        callback(null, response);
        return;
    }

    var newTask = {
      newId: newid,
      name: name,
      description: description,
      priority: priority,
      completed: completed
    }
    
    var params = {
        Item: event,
        TableName: process.env.TABLE_NAME
    };
    
    dynamo.putItem(params, function(err, data) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

