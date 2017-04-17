var chai = require('chai');
var expect = chai.expect; 
const Messages = require('../../Messages');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

let messages = new Messages(db);

const MessageToAdd = {
        message: "hello friend",
        toUserId: "j.azaret@gmail.com",
        allowEdit: true
    }

describe('AddMessage_Successful_Add', function () {
    it('Message is added', function (done) {
        
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            var MessageAdded = JSON.parse(response.body).message;                        
            expect(MessageAdded.message).to.equal(MessageToAdd.message);
            expect(MessageAdded.toUserId).to.equal(MessageToAdd.toUserId);
            expect(MessageAdded.allowEdit).to.equal(MessageToAdd.allowEdit);
            expect(MessageAdded.messageId).to.be.ok;
            expect(MessageAdded.toUserId).to.be.ok;
            expect(MessageAdded.fromUserId).to.be.ok;
            expect(MessageAdded.dateUpdated).to.be.ok;
            expect(MessageAdded.dateCreated).to.be.ok;
            expect(MessageAdded.userIdUpdated).to.be.ok;
            done();
        };
        var contextUserId = 'jazaret@gmail.com';
        messages.addMessage(MessageToAdd, contextUserId, callback);
    });
});