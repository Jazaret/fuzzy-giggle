var chai = require('chai');
var expect = chai.expect;
const Tasks = require('../../tasks');

const db = {
    putItem: function (params, callback) {
        callback(null, params);
    }
};

let tasks = new Tasks(db);

describe('AddTask_FieldRequired_description', function () {
    it('Field description is required - value missing', function (done) {
        var taskToAdd = {
            "user": "jazaret@gmail.com",
            "priority": 0
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(405);
            expect(response.body).to.equal('description is required');
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });
    it('Field description is required - value exists', function (done) {
        var taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "description",
            "priority": 0
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });
});