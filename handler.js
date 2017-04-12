'use strict';

console.log('Loading function');
const aws = require('aws-sdk');
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

module.exports.deleteTask = (event, context, callback) => {

  var result, response;

  dynamo.deleteItem({ TableName: tableName, Key: { taskId: event.taskId } }, function (err, data) {
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

  if (!event.user || !event.description) {
    response = {
      statusCode: 400,
      body: (!event.user) ? 'user is required' : 'Description is required'
    };
    callback(null, response);
    return;
  }

  var params = {
    Item: {
      taskId: newId,
      user: event.user,
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
  if (!event.user || !event.description) {
    response = {
      statusCode: 400,
      body: (!event.user) ? 'user is required' : 'description is required'
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
            user: event.user,
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
  return;
};

module.exports.emailTasks = (event, context, callback) => {
  var ses = new aws.SES();

  //get tasks that compmlete is null or whitespace for each user

  var tasksBody = 'Incomplete Tasks for you:';

  var params = {
    Destination: {
      ToAddresses: [
        'jazaret@gmail.com'
      ]
    },
    Message: {
      Subject: {
        Data: 'task subject',
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: tasksBody,
          Charset: 'UTF-8'
        }
      }
    },
    Source: 'Me <jazaret@gmail.com>',
    ReplyToAddresses: [
      'Me <jazaret@gmail.com>'
    ]
  };

  // Send the email
  ses.sendEmail(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail('Internal Error: The email could not be sent.');
    } else {
      console.log(data);           // successful response
      context.succeed('The email was successfully sent to this guy');
    }
  });
};