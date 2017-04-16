var chai = require('chai');
var expect = chai.expect; 
const Tasks = require('../../tasks');

let tasks = new Tasks();

describe('AddTask_FieldRequired_description', function () {
    it('Field description is required', function (done) {
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
});