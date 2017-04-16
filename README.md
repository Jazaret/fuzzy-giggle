# fuzzy-giggle

This is a serverless task application using lambdas (using NodeJS), gateway API, DynamoDb, & CloudWatch events.  

The application was developed using Serverless and has a Terraform definition as well. Specific roles have been created with each orchestration definition. 

Features:
* Specific set of IAM Roles to be assumed by each Lambda
* Commits signed with GPG key
* Swagger + API Gateway Extensions exported and added to repo (swagger.json).
* Sort Task List algorithm uses merge sort with worst case performance of O(n log n).
* Unit tests included and written with mocha and chai

Packages used:
* aws-sdk
* dynamodb-doc
* node-uuid
* chai
* mocah (global install)