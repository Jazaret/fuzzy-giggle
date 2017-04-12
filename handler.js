'use strict';

console.log('Loading function');
const uuid = require('node-uuid');
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();
const tableName = process.env.TABLE_NAME;


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

  dynamo.scan({ TableName: tableName }, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify({
          message: data
        }),
      };
      callback(null, response);
    }
  });
};

module.exports.addTask = (event, context, callback) => {
  var response;
  var newId = uuid.v1();
  console.log('id = ' + newId);

  if (!event.name || !event.description) {
    response = {
      statusCode: 400,
      body: (!event.name) ? 'Name is required' : 'Description is required'
    };
    callback(null, response);
    return;
  }

  var params = {
    Item: {
      taskId: newId,
      name: event.name,
      description: event.description
    },
    TableName: tableName
  };

  dynamo.putItem(params, function (err, data) {
    if (err) {
      callback(err, null);
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify({
          message: data
        }),
      };
      callback(null, response);
    }
  });
};

module.exports.updateTask = (event, context, callback) => {
  var response, params;
  if (!event.name || !event.description) {
    response = {
      statusCode: 400,
      body: (!event.name) ? 'name is required' : 'description is required'
    };
    callback(null, response);
    return;
  }

  //GetItem
  params = {
    TableName: tableName,
    Key: {
      taskId: event.taskId
    },
    AttributesToGet: ['taskId']
  };

  dynamo.getItem(params, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      if (!data.Item) {
        response = {
          statusCode: 404,
          body: JSON.stringify({
            message: 'Task not found'
          }),
        };
        callback(null, response);
      } else {
        //Item found, now update
        var params = {
          Item: {
            taskId: data.Item.taskId,
            name: event.name,
            description: event.description
          },
          TableName: tableName
        };

        dynamo.putItem(params, function (err, data) {
          if (err) {
            callback(err, null);
          } else {
            response = {
              statusCode: 200,
              body: JSON.stringify({
                message: data
              }),
            };
            callback(null, response);
          }
        });
      }
    }
  });
  //End GetItem
  return;


};
