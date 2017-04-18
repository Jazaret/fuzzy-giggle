# fuzzy-giggle

This is a serverless task application using lambdas (using NodeJS), gateway API, DynamoDb, & CloudWatch events.  

The application was developed on Terraform as well as Serverless platforms. Specific roles have been created with each orchestration definition. 

Features:
* Specific set of IAM Roles to be assumed by each Lambda.
* Commits signed with GPG key.
* Swagger + API Gateway Extensions exported and added to repo (swagger.json).
* Sort Task List algorithm uses merge sort with worst case performance of O(n log n).
* Unit tests included and written with mocha and chai.
* Updated messages are triggered to email to original message creator via DynamoDB trigger.
* Uses Amazon SES for sending emails.

Getting Started:
* Deploy the application using "terraform apply" in the resources directory or use "serverless deploy" in the root repository. 

Usage:

    <API_URL>\tasks
        GET Method - No parameters, returns a sorted list of tasks
        POST Method - JSON of task in request body 
            {
                user: User's email address,
                description: Description of the task (required),
                priority: Task priority, as a single-digit integer. 0 is highest priority (required),
                completed: Completed datetime, formatted as an ISO8601 string
            }
        PUT Method - JSON of updated task in request body (with taskId to identify)
        DELETE Method - JSON of taskId to delete

    (daily task) - email users list of uncompleted tasks
    
    <API_URL>\messages
        GET Method - No parameters, returns list of messages
        POST Method - JSON of message in request body
            {
                message: message to send,
                toUserId: email address of user to message,
                allowEdit: true/false if message can be updated by recipient
            }
        PUT Method - JSON of message to update (with messageId to identify)

    (database trigger) - email sender if recipient edited message
        

Files:
* handlerTasks.js           - task lambda entry point
* handlerMessages.js        - task lambda entry point
* tasks.js                  - task logic for task methods
* messages.js               - message logic for message methods
* schemas.js                - model schemas
* serverless.yml            - Serverless project settings file
* resources/terraform.tf    - Terraform project settings file
* tests/*                   - Test files

Packages used:
* aws-sdk
* dynamodb-doc
* node-uuid
* chai
* mocha (global install)

Improvements:
* Create database indexes to use proper queries instead of full table scans for performance.
* Use cognito for user context in messages system.
* Apply distributed caching service to relieve dynamoDb calls.

