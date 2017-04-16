var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

let tasks = new Tasks(db);

describe('AddTask_Successful_Add', function () {
    it('Task is added', function (done) {
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
});