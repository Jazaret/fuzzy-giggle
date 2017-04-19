const uuid = require('node-uuid');
const schemas = require("./schemas.js");
const _ = require("lodash");

class Messages {
    constructor(db, tableName, mailer, systemEmailFrom) {
        this.db = db;
        this.mailer = mailer;
        this.tableName = tableName;
        this.systemEmailFrom = systemEmailFrom;
    };

    //Gets message list from database
    //params:
    //  callback - method called with list to return
    getMessages(callback) {
        var result, response;
        this.db.scan({ TableName: this.tableName }, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                data.Items = data.Items;
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

    //Method to add a message item
    //Creator of message can specify whether recipient has access to modify message
    addMessage(incomingMessage, contextUserId, callback) {
        var response, message;

        message = formatMessageToAdd(incomingMessage, contextUserId);
        message = sanitizeMessage(message);

        var validateMsg = validateMessage(message);

        if (validateMsg) {
            response = {
                statusCode: 405,
                body: validateMsg
            };
            callback(null, response);
            return;
        }

        var params = {
            Item: message,
            TableName: this.tableName
        };

        this.db.putItem(params, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: message
                    }),
                };
                callback(null, response);
            }
        });
    };

    //updates the message can be from originator or recipient
    updateMessage(messageItem, contextUserId, callback) {
        var response;
        var tableName = this.tableName;
        var db = this.db;

        //GetItem to make sure it's an update
        var params = {
            TableName: tableName,
            Key: {
                messageId: messageItem.messageId
            }
        };

        db.getItem(params, function (err, data) {
            if (err) {
                callback(err, null);
            } else {
                var originalMessage = data.Item;
                var canProceed = (contextUserId === originalMessage.fromUserId || (originalMessage.allowEdit && contextUserId === originalMessage.toUserId));

                if (!canProceed) {
                    response = {
                        statusCode: 401,
                        body: "user not authorized to edit message"
                    };
                    callback(null, response);
                    return;
                }

                var params = {
                    TableName: tableName,
                    Key: {
                        messageId: originalMessage.messageId
                    },
                    UpdateExpression: "set message = :m, updateDate=:d, userIdUpdate=:u",
                    ExpressionAttributeValues: {
                        ":m": {
                            "S": messageItem.message
                        },
                        ":d": 
                        {
                            "S": new Date().toISOString()
                        },
                        ":u":
                        {
                            "S":  contextUserId
                        }
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
                        callback(null, response);

                        //we can send email from here or just use a DB trigger
                    }
                });
            }
        });
    };

    //Notify user that message is updated.
    //params:
    //  messages - message list that method is using
    //  context - context to retrun method results
    triggerMessagesNotify(messages, context) {
        var self = this;
        messages.forEach(function (messageItem) {
            //Only notify if the person who updated messsage is not the origniator.
            if (messageItem.userIdUpdated === messageItem.fromUserId) {
                return;
            }


            messageUpdatedNowNotify(messageItem, self.mailer, self.systemEmailFrom);
        });
    };
}


//keeps only variables that are in the message schema
function sanitizeMessage(data) {
    data = data || {};
    schema = schemas.message;
    return _.pick(_.defaults(data, schema), _.keys(schema));
}

//validates the properties of a message
function validateMessage(messageItem) {

    //required fields
    if (!messageItem.message) {
        return 'message is required';
    }

    if (!messageItem.toUserId) {
        return 'toUserId is required';
    }

    //validate user field as email
    if (messageItem.toUserId) {
        var emailTest = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailTest.test(messageItem.toUserId)) {
            return "toUserId is invalid";
        }
    }

    return;
};



//input model = messageId (optional), message, toUserId, AllowEdit
function formatMessageToAdd(messageItem, contextUserId) {
    var utcNow = new Date().toISOString();
    return {
        messageId: uuid.v1(),
        message: messageItem.message,
        toUserId: messageItem.toUserId,
        fromUserId: contextUserId,
        allowEdit: !!messageItem.allowEdit,
        dateCreated: utcNow,
        dateUpdated: utcNow,
        userIdUpdated: contextUserId
    }
};

function formatMessageToUpdate(newMessageText, oldData) {
    return {
        messageId: oldData.messageId,
        allowEdit: oldData.allowEdit,
        toUserId: oldData.toUserId,
        fromUserId: oldData.fromUserId,
        message: newMessageText,
        dateUpdated: new Date().toISOString(),
        userIdUpdated: contextUserId
    };
};

//send message to originator if message was updated not by that person.
function messageUpdatedNowNotify(messageItem, mailer, systemEmailFrom) {

    if (messageItem.userIdUpdated !== messageItem.fromUserId) {
        var emailAddress = messageItem.fromUserId;

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
            Source: systemEmailFrom,
            ReplyToAddresses: [
                systemEmailFrom
            ]
        };
        console.log("sendEmail");
        console.log(JSON.stringify(emailParams));
        mailer.sendEmail(emailParams, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log('success; ' + data);
            }
        });
    }
    return;
}

module.exports = Messages;