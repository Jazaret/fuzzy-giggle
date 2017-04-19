var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

const db = {
    putItem: function(params, callback) {
        callback(null, params);
    }
};

let tasks = new Tasks(db);

const taskToAddNoCompleted = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 0
        };   

const taskToAddWithCompleted = {
            "user": "jazaret@gmail.com",
            "description": "hey there",
            "priority": 0,
            "completed": "2016-07-06T12:22:46-04:00"
        }; 


describe('AddTask_Successful_Add_CompletedValue_NotExist', function () {
    it('Task is added without completed', function (done) {
        
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            var taskAdded = JSON.parse(response.body).message;                        
            expect(taskAdded.user).to.equal(taskToAddNoCompleted.user);
            expect(taskAdded.description).to.equal(taskToAddNoCompleted.description);
            expect(taskAdded.priority).to.equal(taskToAddNoCompleted.priority);
            expect(taskAdded.completed).to.be.undefined;
            expect(taskAdded.taskId).to.be.ok;
            done();
        };
        tasks.addTask(taskToAddNoCompleted, callback);
    });
});

describe('AddTask_Successful_Add_CompletedValue_Exist', function () {
    it('Task is added with completed', function (done) {
        
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            var taskAdded = JSON.parse(response.body).message;                        
            expect(taskAdded.user).to.equal(taskToAddWithCompleted.user);
            expect(taskAdded.description).to.equal(taskToAddWithCompleted.description);
            expect(taskAdded.priority).to.equal(taskToAddWithCompleted.priority);
            expect(taskAdded.completed).to.be.equal(taskToAddWithCompleted.completed);
            expect(taskAdded.taskId).to.be.ok;
            done();
        };
        tasks.addTask(taskToAddWithCompleted, callback);
    });
});