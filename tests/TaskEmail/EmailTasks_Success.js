var chai = require('chai');
var expect = chai.expect;
const Tasks = require('../../tasks');

const taskList = [
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome #1",
        priority: 0
    },
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome #2",
        priority: 1
    }
];

const db = {
    scan: function (params, callback) {
        callback(null, { Items: taskList });
    }
};

const mailer = {
    mailSent: [],
    sendEmail: function (params, callback) {
        this.mailSent.push(params);
        callback(null, params);
    }
}

let tasks = new Tasks(db, null, mailer);

describe('EmailTasks_Successful', function () {
    it('Email Tasks', function (done) {
        var context = {
            succeed: function (result) {
                expect(result).to.equal('Jobs done');
                done();
            },
            fail: function () {
                done(new Error('never context.fail'));
            }
        };
        tasks.emailTasks(context);
    });
});