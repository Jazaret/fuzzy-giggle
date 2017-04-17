var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

const taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 0
        };   

let tasks = new Tasks(db);


describe('AddTask_Successful_Add', function () {
    it('Task is added', function (done) {
        
        var callback = function (err, response) {
            var taskAdded = JSON.parse(response.body).message;            
            expect(response.statusCode).to.equal(200);        
            expect(taskAdded.user).to.equal(taskToAdd.user);
            expect(taskAdded.description).to.equal(taskToAdd.description);
            expect(taskAdded.priority).to.equal(taskToAdd.priority);
            expect(taskAdded.taskId).to.be.ok;
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });
});