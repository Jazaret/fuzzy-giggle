const uuid = require('node-uuid');

class Tasks {
    constructor(db, tableName, mailer) {
        console.log('ses' + mailer);
        console.log('table = ' + tableName);
        this.db = db;
        this.mailer = mailer;
        this.tableName = tableName
    };

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
        var params = {
            Item: formatTaskToUpsert(task),
            TableName: this.tableName
        };
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
    };

    updateTask(task, callback) {
        var response, params;
        var validateMsg = validateTask(task);
        if (validateMsg) {
            response = {
                statusCode: 400,
                body: validateMsg
            };
            callback(null, response);
            return;
        }
        var newTask = modelTask(task);

        //GetItem to make sure it's an update
        params = {
            TableName: this.tableName,
            Key: {
                taskId: newTask.taskId
            },
            AttributesToGet: ['taskId']
        };

        this.db.getItem(params, function (err, data) {
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
                    newTask.taskId = data.Item.taskId;
                    var params = {
                        Item: formatTaskToUpsert(newTask),
                        TableName: this.tableName
                    };

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
                }
            }
        });
        return;
    };

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

    emailTasks(context) {
        var mailer = this.mailer;
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
            TableName: this.tableName,
            FilterExpression: 'attribute_not_exists(completed)',
        };

        this.db.scan(scanParams, function (err, data) {
            if (err) {
                console.log(err);
                context.fail('Internal Error on read:' + err);
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
                    mailer.sendEmail(params, function (err, data) {
                        if (err) {
                            console.log(err, err.stack);
                            context.fail('Internal Error on email:' + err.stack);
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
                        var messageItem = formatMessageToUpdate(incomingMessage.message, data)
                        response = updateMessage(messageItem, contextUserId, messageTable, this.db, this.mailer);
                        callback(null, response);
                    }
                }
            });
        }
    };

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