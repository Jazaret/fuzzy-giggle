var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

let tasks = new Tasks();

describe('AddTask_FieldRequired_priority', function () {
    it('Field priority is required', function (done) {
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
});