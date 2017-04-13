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

  //Get unique names on list of tasks to loop through
  //const uniqueNames = [...new Set(listOfTasks.map(item => item.name))];

  //uniqueNames.forEach(function(value){
    //params.Destination.ToAddresses = value;

    //get list of tasks for this person

    //send email here
  //});

  // Send the email
  ses.sendEmail(params, function (err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail('Internal Error: The email could not be sent.');
    } else {
      console.log('success; ' + data);           // successful response
      context.succeed('The email was successfully sent to this guy');
    }
  });
};

module.exports.findTasksNotCompleted = (event, context, callback) => {
  
  var params = {
      TableName: tableName,
      FilterExpression: 'attribute_not_exists(completed)',
      ScanFilter: { // optional (map of attribute name to Condition)
    
        attribute_name: {
            ComparisonOperator: 'NULL', // (EQ | NE | IN | LE | LT | GE | GT | BETWEEN | 
                                      //  NOT_NULL | NULL | CONTAINS | NOT_CONTAINS | BEGINS_WITH)
            AttributeValueList: [ { S: 'STRING_VALUE' }, ],
        },
        // more conditions .....
    }
  };  

  dynamo.query(params, function(err, data) {
      if (err)
          console.log(JSON.stringify(err, null, 2));
      else
          console.log(JSON.stringify(data, null, 2));
  });
};