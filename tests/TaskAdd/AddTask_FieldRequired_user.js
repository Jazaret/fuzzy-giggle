var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

let tasks = new Tasks(db);

describe('AddTask_FieldValid_user', function () {
    it('Field user is invalid', function (done) {
        var taskToAdd = {
            "user": "nonononoono",
            "description": "hey there",
            "priority": 9
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(405);
            expect(response.body).to.equal('user is invalid');            
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });
    it('Field user is valid', function (done) {
        var taskToAdd = {
            "user": "testing@test.com",
            "description": "hey there",
            "priority": 9
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);            
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });    
});