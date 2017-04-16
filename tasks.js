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
        console.log('id = ' + newId);
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

    emailTasks(context, callback) {
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

module.exports = Tasks;