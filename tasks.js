const uuid = require('node-uuid');
const schemas = require("./schemas.js");
const _ = require("lodash");

class Tasks {
    constructor(db, tableName, mailer, systemEmailFrom) {
        this.db = db;
        this.mailer = mailer;
        this.tableName = tableName;
        this.systemEmailFrom = systemEmailFrom;
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
        task.taskId = newId;

        var validateMsg = validateTask(task);

        if (validateMsg) {
            response = {
                statusCode: 405,
                body: validateMsg
            };
            callback(null, response);
            return;
        }

        task = sanitizeTask(task);

        var params = {
            Item: task,
            TableName: this.tableName
        };
        console.log(JSON.stringify(task));
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

                    var validateMsg = validateTask(newTask);

                    if (validateMsg) {
                        response = {
                            statusCode: 405,
                            body: validateMsg
                        };
                        callback(null, response);
                        return;
                    }

                    if (!newTask.completed) {
                        delete newTask.completed;
                    }

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
                        message: "task " + taskId + " has been deleted."
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
            Source: this.systemEmailFrom,
            ReplyToAddresses: [
                this.systemEmailFrom
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
                console.log(JSON.stringify(data));
                data.Items.forEach(function (value) {
                    if (!value.user) {
                        //do nothing if user is not specified
                        return;
                    }

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
            }
        });
    };
}

//keeps only variables that are in the task schema
function sanitizeTask(data) {
    data = data || {};
    schema = schemas.task;
    var result = _.pick(_.defaults(data, schema), _.keys(schema));
    
    //want this to not exist
    if (!result.completed) {
        delete result.completed;
    }
    return result;
}

//validates the properties of a task
function validateTask(task) {

    //required fields
    if (task.priority == null || !task.description) {
        return (task.description) ? 'priority is required' : 'description is required'
    }

    //validate priority digit 0-9
    if (String(+task.priority).charAt(0) != task.priority) {
        return "priority is invalid";
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
            return "user is invalid";
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



module.exports = Tasks;