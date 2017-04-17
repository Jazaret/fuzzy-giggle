var chai = require('chai');
var expect = chai.expect;
const Messages = require('../../messages');

const messageList = [
    {
        "userIdUpdated": "jazaret@gmail.com",
        "dateCreated": "2017-04-17T19:57:48.819Z",
        "toUserId": "j.azaret@gmail.com",
        "messageId": "1",
        "message": "hello world",
        "fromUserId": "jazaret@gmail.com",
        "allowEdit": false,
        "dateUpdated": "2017-04-17T19:57:48.819Z"
    },
    {
        "userIdUpdated": "jazaret@gmail.com",
        "dateCreated": "2017-04-17T19:57:48.819Z",
        "toUserId": "j.azaret@gmail.com",
        "messageId": "2",
        "message": "hello world",
        "fromUserId": "jazaret@gmail.com",
        "allowEdit": true,
        "dateUpdated": "2017-04-17T19:57:48.819Z"
    }
];



const db = {
    updateItem: function (params, callback) {
        var result = messageList[1];
        result.message = params.ExpressionAttributeValues[":m"];
        callback(null, result);
    },

    getItem: function (params, callback) {
        if (params.Key.messageId === "1") {
            callback(null, { Item: messageList[0] });
        } else {
            callback(null, { Item: messageList[1] });
        }
    }
};

let messages = new Messages(db);

const messageToUpdate1 = {
    "messageId": "1",
    "message": "this should fail and not be seen",
};

const messageToUpdate2 = {
    "messageId": "2",
    "message": "this should work",
};


describe('UpdateMessage_Unauthorized_Update', function () {
    it('Message update should return unauthorized', function (done) {

        var callback = function (err, response) {
            expect(response.statusCode).to.equal(401);
            done();
        };
        var contextUser = 'j.azaret@gmail.com';
        messages.updateMessage(messageToUpdate1, contextUser, callback);
    });
});

describe('UpdateMessage_Authorized_Update', function () {
    it('Message update should return update', function (done) {

        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            var messageUpdated = JSON.parse(response.body).message;
            expect(messageUpdated.message).to.equal(messageToUpdate2.message);
            done();
        };

        var contextUser = 'j.azaret@gmail.com';
        messages.updateMessage(messageToUpdate2, contextUser, callback);
    });
});