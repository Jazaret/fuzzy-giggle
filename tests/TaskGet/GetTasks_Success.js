var chai = require('chai');
var expect = chai.expect;
const Tasks = require('../../tasks');

const taskListUnsorted = [
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome",
        priority: 0
    },
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome",
        priority: 0,
        completed: "2016-06-06T12:22:46-04:00"
    },
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome",
        priority: 1
    },
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome",
        priority: 2,
        completed: "2016-07-06T12:22:46-04:00"
    },
    {
        user: "jazaret@gmail.com",
        description: "Do something awesome",
        priority: 1,
        completed: "2016-07-06T12:22:46-04:00"
    }
];

const taskListSorted = [{
    user: "jazaret@gmail.com",
    description: "Do something awesome",
    priority: 0
},
{
    user: "jazaret@gmail.com",
    description: "Do something awesome",
    priority: 1
},
{
    user: "jazaret@gmail.com",
    description: "Do something awesome",
    priority: 1,
    completed: "2016-07-06T12:22:46-04:00"
},
{
    user: "jazaret@gmail.com",
    description: "Do something awesome",
    priority: 2,
    completed: "2016-07-06T12:22:46-04:00"
},
{
    user: "jazaret@gmail.com",
    description: "Do something awesome",
    priority: 0,
    completed: "2016-06-06T12:22:46-04:00"
}];

const db = {
    scan: function (params, callback) {
        callback(null, { Items: taskListUnsorted });
    }
};

let tasks = new Tasks(db);

describe('GetTask_Successful_WithSort', function () {
    it('Tasks Get', function (done) {
        var callback = function (err, response) {
            expect(response.statusCode).to.equal(200);
            
            var responseString = JSON.stringify(JSON.parse(response.body).message);
            var originalSorted = JSON.stringify(taskListSorted);
            expect(responseString).to.equal(originalSorted);
            done();
        };
        tasks.getTasks(callback);
    });
});