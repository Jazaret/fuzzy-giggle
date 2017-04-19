var chai = require('chai');
var expect = chai.expect;
const Tasks = require('../../tasks');

const systemEmail = 'jazaret@gmail.com';

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
    },
    {
        user: "jojo@gmail.com",
        description: "Do something awesome #3",
        priority: 1
    }
];

const db = {
    scan: function (params, callback) {
        callback(null, { Items: taskList });
    }
};

describe('EmailTasks_Successful', function () {
    it('Email Tasks', function (done) {
        const mailer = {
            calls: 0,
            sendEmail: function (params, callback) {
                callback(null, params);

                if (this.calls === 0) {                    
                    expect(params.Destination.ToAddresses[0]).to.equal('jazaret@gmail.com');
                } else {
                    expect(params.Destination.ToAddresses[0]).to.equal('jojo@gmail.com');
                    done();
                }                
                this.calls++;
            }
        }

        let tasks = new Tasks(db, null, mailer, systemEmail);

        var context = {
            succeed: function (result) {
                expect(result).to.equal('Jobs done');
            },
            fail: function () {
                done(new Error('never context.fail'));
            }
        };
        tasks.emailTasks(context);
    });
});