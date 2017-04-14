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
      data.Items = sortTasks(data.Items);
      response = {
        statusCode: 200,
        body: JSON.stringify({
          message: data.Items
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

  var validateMsg = validateTask(event);

  if (validateMsg) {
    response = {
      statusCode: 405,
      body: validateMsg
    };
    callback(null, response);
    return;
  }
  event.taskId = newId;
  var params = {
    Item: formatTaskToUpsert(event),
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
  var validateMsg = validateTask(event);
  if (validateMsg) {
    response = {
      statusCode: 400,
      body: validateMsg
    };
    callback(null, response);
    return;
  }
  var task = modelTask(event);

  //GetItem to make sure it's an update
  params = {
    TableName: tableName,
    Key: {
      taskId: task.taskId
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
        task.taskId = data.Item.taskId;
        var params = {
          Item: formatTaskToUpsert(task),
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

  var tasksBody = 'Incomplete Tasks for you:';

  var emailsToSend = {};
  console.log(emailsToSend);
  var uniqueNames = [];

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

  var scanParams = {
    TableName: tableName,
    FilterExpression: 'attribute_not_exists(completed)',
  };

  dynamo.scan(scanParams, function (err, data) {
    if (err) {
      console.log(err);
      context.fail('Internal Error:');
    } else {
      console.log(data);
      data.Items.forEach(function (value) {
        //check if recipient already exists
        if (!emailsToSend[value.user]) {
          //if recipient doesn't exist then add to master list
          uniqueNames.push(value.user);
          //initialize dictionary entry
          emailsToSend[value.user] = [];
        }
        //add task to email
        emailsToSend[value.user].push({
          description: value.description
        });
      });

      console.log(uniqueNames);

      uniqueNames.forEach(function (value) {
        var bodyMsg = 'Tasks to complete: <br><br>';
        //set address
        params.Destination.ToAddresses = [value];

        //get list of tasks for this person and set the body
        var tasks = emailsToSend[value];
        tasks.forEach(function (value) {
          bodyMsg += value.description + '<br>';

        });

        params.Message.Body.Html.Data = bodyMsg;
        // Send the email
        console.log('send email: ' + value + ' msg:' + bodyMsg);
        ses.sendEmail(params, function (err, data) {
          if (err) {
            console.log(err, err.stack);
          } else {
            console.log('success; ' + data);
          }
        });
      });

      context.succeed('Jobs done');
    }
  });


};

//Method to handle messages to and from users.
//Creator of message can specify whether recipient has access to modify message
module.exports.upsertMessage = (event, context, callback) => {
  console.log(context);
  var response, message;
  var contextUserId = (context.identity) ? context.identity.cognitoIdentityId : context.awsRequestId;
  var messageTable = 'message-table';
  var isNewMessage = !event.messageId;

  if (isNewMessage) {
    message = formatMessageToAdd(event);
  }

  var upsertParams = {
    tableName: messageTable,
    Item: {}
  };

  var getParams = {
    TableName: tableName,
    Key: {
      messageId: event.messageId
    }
  }

  return; //NOT DONE YET

  if (isNewMessage) {
    // add message to db
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
  } else {
    //get original message
    dynamo.getItem(getParams, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
        if (!data.Item) {
          response = {
            statusCode: 404,
            body: JSON.stringify({
              message: 'Message not found'
            }),
          };
          callback(null, response);
        } else {
          var messageItem = formatMessageToUpdate(event.message, data)
          response = updateMessage(messageItem, contextUserId, messageTable);
          callback(null, response);
        }
      }
    });
  }
};

//updates the message can be from originator or recipient
function updateMessage(messageItem, contextUserId, messageTable) {

  //proceed only if editor is originator or recipient has rights to edit
  var canProceed = (contextUserId === messageItem.fromUserId || (messageItem.allowEdit && contextUserId === messageItem.toUserId));

  if (!canProceed) {
    response = {
      statusCode: 401,
      body: "user not authorized to edit message"
    };
    return response;
  }

  var params = {
    TableName: messageTable,
    Key: {
      "messageId": messageItem.messageId
    },
    UpdateExpression: "set message = :m, updateDate=:d",
    ExpressionAttributeValues: {
      ":m": messageItem.message,
      ":d": new Date().toISOString
    },
    ReturnValues: "UPDATED_NEW"
  };

  //update message
  dynamo.updateItem(params, function (err, data) {
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
  });

  //recpient edited message, notify source.
  if (contextUserId === messageItem.fromUserId) {
    //todo: get email from ID
    var ses = new aws.SES();
    var emailAddress = "jazaret@gmail.com";

    var emailParams = {
      Destination: {
        ToAddresses: [
          emailAddress
        ]
      },
      Message: {
        Subject: {
          Data: 'Your message was updated!',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: 'Check it out your message was updated to say <br><br>' + messageItem.message,
            Charset: 'UTF-8'
          }
        }
      },
      Source: 'Me <jazaret@gmail.com>',
      ReplyToAddresses: [
        'Me <jazaret@gmail.com>'
      ]
    };

    ses.sendEmail(emailParams, function (err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log('success; ' + data);
      }
    });
  }

  return response;
}

//validates the properties of a task
function validateTask(task) {
  //required fields
  if (task.priority == null || !task.description) {
    return (task.description) ? 'priority is required' : 'description is required'
  }

  //validte completed as iso date
  if (task.completed) {
    //validate completed date
    //ISO_6801 regex
    var ISO_8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i
    if (!ISO_8601.test(task.completed)) {
      return "completed date is invalid";
    }
  }

  //validate user field as email
  if (task.user) {
    var emailTest = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailTest.test(task.user)) {
      return "email is invalid";
    }
  }

  return;
};

//Sort tasks by completed desc (blanks on top) THEN BY priority asc
function sortTasks(tasks) {
  tasks.sort(function (x, y) {
    if (!x.completed && y.completed) {
      return -1
    } else if (x.completed && !y.completed) {
      return 1
    } else if (x.completed !== y.completed) {
      var dateX = Date.parse(x.completed),
        dateY = Date.parse(y.completed);
      return (dateX - dateY) * -1;
    }
    return x.priority - y.priority;
  });

  return tasks;
};

//prepare task to be safe for add/update
function formatTaskToUpsert(task) {
  var result = {
    taskId: task.taskId,
    user: task.user,
    description: task.description
  };

  if (task.completed) {
    result.completed = task.completed;
  }

  return result;
};

//input model = messageId (optional), message, toUserId, AllowEdit
function formatMessageToAdd(messageItem, contextUserId) {
  var utcNow = new Date().toISOString();
  var result = {
    messageId: messageItem.messageId,
    message: messageItem.message,
    toUserId: messageItem.toUserId,
    fromUserId: contextUserId,
    allowEdit: !!messageItem.allowEdit,
    dateCreated: utcNow,
    dateUpdated: utcNow
  }
};

function formatMessageToUpdate(newMessageText, oldData) {
  return {
    messageId: oldData.messageId,
    allowEdit: oldData.allowEdit,
    toUserId: oldData.toUserId,
    fromUserId: oldData.fromUserId,
    message: newMessageText,
    dateUpdated: new Date().toISOString()
  };
};