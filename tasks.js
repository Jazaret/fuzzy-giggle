const uuid = require('node-uuid');
const schemas = require("./schemas.js");
const _ = require("lodash");

class Tasks {
    constructor(db, tableName, mailer) {
        this.db = db;
        this.mailer = mailer;
        this.tableName = tableName
    };

    //Gets task list from database
    //params:
    //  callback - method called with list to return
    getTasks(callback) {
        var result, response;
        this.db.scan({ TableName: this.tableName }, function (err, data) {
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

    //Adds task to database
    //params:
    //  task - task to add
    //  callback - method called after adding
    addTask(task, callback) {
        var response;
        var newId = uuid.v1();

        //todo: split required validation & invalid values validation
        var validateMsg = validateTask(task);

        if (validateMsg) {
            response = {
                statusCode: 405,
                body: validateMsg
            };
            callback(null, response);
            return;
        }

        task.taskId = newId;
        task = sanitizeTask(task);
        var params = {
            Item: task,
            TableName: this.tableName
        };
        this.db.putItem(params, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: task
                    }),
                };
                callback(null, response);
            }
        });
    };

    //Updates task on a database
    //params:
    //  task - task object to update - updates only changes
    //  callback - method called with list to return
    updateTask(task, callback) {
        var response, params;
        var db = this.db;
        var tableName = this.tableName;

        //GetItem to make sure it's an update
        params = {
            TableName: tableName,
            Key: {
                taskId: task.taskId
            }
        };

        db.getItem(params, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
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
                    var newTask = mergeTasks(data.Item, task);
                    var putParams = {
                        Item: newTask,
                        TableName: tableName
                    };

                    db.putItem(putParams, function (err, data) {
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

    //Deletes task on a database
    //params:
    //  taskId - task identifier
    //  callback - method called with delete result
    deleteTask(taskId, callback) {

        var result, response;

        this.db.deleteItem({ TableName: this.tableName, Key: { taskId: taskId } }, function (err, data) {
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

    //Emails users with tasks yet to be completed
    //params:
    //  context - context to retrun method results
    emailTasks(context) {
        var mailer = this.mailer;
        var tasksBody = 'Incomplete Tasks for you:';

        var emailsToSend = {};
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
            TableName: this.tableName,
            FilterExpression: 'attribute_not_exists(completed)',
        };

        this.db.scan(scanParams, function (err, data) {
            if (err) {
                console.log(err);
                context.fail('Internal Error on read:' + err);
            } else {
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
                    mailer.sendEmail(params, function (err, data) {
                        if (err) {
                            console.log(err, err.stack);
                            context.fail('Internal Error on email:' + err.stack);
                        } else {
                            console.log('email sent to ' + value);
                        }
                    });
                });

                context.succeed('Jobs done');
            }
        });
    };

    //Method to handle messages to and from users.
    //Creator of message can specify whether recipient has access to modify message
    upsertMessage(incomingMessage, context, callback) {
        console.log(context);
        var response, message;
        var contextUserId = (context.identity) ? context.identity.cognitoIdentityId : context.awsRequestId;
        var messageTable = 'message-table';
        var isNewMessage = !incomingMessage.messageId;

        if (isNewMessage) {
            message = formatMessageToAdd(incomingMessage);
        }

        var upsertParams = {
            tableName: messageTable,
            Item: {}
        };

        var getParams = {
            TableName: tableName,
            Key: {
                messageId: incomingMessage.messageId
            }
        }

        return; //NOT DONE YET

        if (isNewMessage) {
            // add message to db
            this.db.putItem(params, function (err, data) {
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
            this.db.getItem(getParams, function (err, data) {
                if (err) {
                    callback(err, null);
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
                        var messageItem = formatMessageToUpdate(incomingMessage.message, data)
                        response = updateMessage(messageItem, contextUserId, messageTable, this.db, this.mailer);
                        callback(null, response);
                    }
                }
            });
        }
    };

    //Notify user that task is created.
    //params:
    //  tasks - task list that method is using
    //  context - context to retrun method results
    taskNotify(tasks, context) {
        forEach(tasks, function (task) {
            //if current user is not the creator then email creator
            if (false) {
                context.succeed('No need to do anything');
                return;
            }

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
                            Data: "TASK MODIFIED ALERT!",
                            Charset: 'UTF-8'
                        }
                    }
                },
                Source: 'Me <jazaret@gmail.com>',
                ReplyToAddresses: [
                    'Me <jazaret@gmail.com>'
                ]
            };

            this.mailer.sendEmail(params, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                    context.fail('Internal Error on email:' + err.stack);
                } else {
                    console.log('success;');
                    console.log(data);
                }
            });
        });

        context.succeed('Notifications sent');
    }


}

//keeps only variables that are in the task schema
function sanitizeTask(data) {
    data = data || {};
    schema = schemas.task;
    return _.pick(_.defaults(data, schema), _.keys(schema));
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

//combine existing task with new task for update
function mergeTasks(oldTask, newTask) {
    var result = {
        taskId: oldTask.taskId,
        user: (newTask.user != null) ? newTask.user : oldTask.user,
        description: (newTask.description) ? newTask.description : oldTask.description,
        priority: (newTask.priority != null) ? newTask.priority : oldTask.priority
    };

    if (newTask.completed) {
        result.completed = newTask.completed;
    } else if (oldTask.completed) {
        result.completed = oldTask.completed;
    }

    return result;
}

//updates the message can be from originator or recipient
function updateMessage(messageItem, contextUserId, messageTable, db, mailer) {
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
    db.updateItem(params, function (err, data) {
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

        mailer.sendEmail(emailParams, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log('success; ' + data);
            }
        });
    }

    return response;
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


module.exports = Tasks;