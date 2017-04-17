/** schemas.js **/

schemas = {

    task: {
        taskId: null,
        user: null,
        description: null,
        priority: null,
        completed: null
    },

    message: {
        messageId: null,
        message: null,
        toUserId: null,
        fromUserId: null,
        allowEdit: null,
        dateCreated: null,
        dateUpdated: null,
        userIdUpdated: null
    }
    
}

module.exports = schemas;