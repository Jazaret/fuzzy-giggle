var chai = require('chai');
var expect = chai.expect;
const Messages = require('../../messages');

const messageList = [
    {
        "userIdUpdated": "jazaret@gmail.com",
        "dateCreated": "2017-04-17T19:57:48.819Z",
        "toUserId": "j.azaret@gmail.com",
        "messageId": "21e47e30-23a8-11e7-a7c7-0d1335775f22",
        "message": "hello world",
        "fromUserId": "jazaret@gmail.com",
        "allowEdit": true,
        "dateUpdated": "2017-04-17T19:57:48.819Z"
    }
];

const db = {
    scan: function (params, callback) {
        callback(null, { Items: messageList });
    }
};

let messages = new Messages(db);

describe('GetMessages_Successful', function () {
    it('Tasks Get', function (done) {
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            var resultMessage = JSON.parse(response.body).message;
            var responseString = JSON.stringify(JSON.parse(response.body).message);
            var original = JSON.stringify(messageList);
            expect(responseString).to.equal(original);
            done();
        };
        messages.getMessages(callback, 'jazaret@gmail.com');
    });
});