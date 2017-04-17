var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

let tasks = new Tasks(db);

describe('AddTask_FieldRequired_priority', function () {
    it('Field priority is required - value missing', function (done) {
        var taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "hey there"
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(405);
            expect(response.body).to.equal('priority is required');            
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });
    it('Field priority is required - value exists', function (done) {
        var taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 0
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);            
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });    
    it('Field priority is invalid', function (done) {
        var taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 999
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(405);
            expect(response.body).to.equal('priority is invalid');            
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });    
    it('Field priority is valid', function (done) {
        var taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 5
        };
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);            
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });    
});