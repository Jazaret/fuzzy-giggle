var chai = require('chai');
var expect = chai.expect;
const Messages = require('../../messages');

const systemEmail = 'jazaret@gmail.com';

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
    },
    {
        "userIdUpdated": "j.azaret@gmail.com",
        "dateCreated": "2017-04-17T19:57:48.819Z",
        "toUserId": "j.azaret@gmail.com",
        "messageId": "21e47e30-23a8-11e7-a7c7-0d1335775f22",
        "message": "hello world",
        "fromUserId": "jazaret@gmail.com",
        "allowEdit": true,
        "dateUpdated": "2017-04-17T19:57:48.819Z"
    },    
];

const db = {
    scan: function (params, callback) {
        callback(null, { Items: taskList });
    }
};

describe('EmailMessage_Successful', function () {
    it('Email Messages', function (done) {
        const mailer = {
            calls: 0,
            sendEmail: function (params, callback) {
                callback(null, params);

                expect(params.Destination.ToAddresses[0]).to.equal('jazaret@gmail.com');
                done();
            }
        }

        let messages = new Messages(db, null, mailer, systemEmail);

        var context = {
            succeed: function (result) {
                expect(result).to.equal('Notifications sent');
            },
            fail: function () {
                done(new Error('never context.fail'));
            }
        };
        messages.triggerMessagesNotify(messageList, context);
    });
});