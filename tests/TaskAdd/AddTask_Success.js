var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

let tasks = new Tasks(db);

const taskToAdd = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 0
        };   



describe('AddTask_Successful_Add', function () {
    it('Task is added', function (done) {
        
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            var taskAdded = JSON.parse(response.body).message;                        
            expect(taskAdded.user).to.equal(taskToAdd.user);
            expect(taskAdded.description).to.equal(taskToAdd.description);
            expect(taskAdded.priority).to.equal(taskToAdd.priority);
            expect(taskAdded.taskId).to.be.ok;
            done();
        };
        tasks.addTask(taskToAdd, callback);
    });
});