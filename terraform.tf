variable "region" {
    default = "us-west-2"
}
    
provider "aws" {
  region = "${var.region}"
  profile                  = "default"
}

#Create Roles
####
resource "aws_iam_role" "iam_for__getTasks_lambda_and_api" {
    name = "iam_for__getTasks_lambda_and_api"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "iam_for__addTask_lambda_and_api" {
    name = "iam_for__addTask_lambda_and_api"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "iam_for__updateTask_lambda_and_api" {
    name = "iam_for__updateTask_lambda_and_api"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "iam_for__deleteTask_lambda_and_api" {
    name = "iam_for__deleteTask_lambda_and_api"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_role" "iam_for_emailTasks_lambda_and_api" {
    name = "iam_for_lambda_and_api"
    assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "apigateway.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

#Create Policies
####
resource "aws_iam_policy" "policy_for_readDB" {
  name        = "policy_for_readDB"
  path        = "/"
  description = ""

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-2:918902313573:table/tasks"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "policy_for_updateDB" {
  name        = "policy_for_updateDB"
  path        = "/"
  description = ""

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
		"dynamodb:PutItem",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-2:918902313573:table/tasks"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "policy_for_deleteItemDB" {
  name        = "policy_for_deleteItemDB"
  path        = "/"
  description = ""

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
		"dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-west-2:918902313573:table/tasks"
      ]
    }
  ]
}
EOF
}

#Attach Roles to Policies
####
resource "aws_iam_policy_attachment" "attach-lambda-policy" {
    name = "lambda-policy"
    roles = [
		"${aws_iam_role.iam_for__getTasks_lambda_and_api.name}",
		"${aws_iam_role.iam_for__addTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for__updateTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for__deleteTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for_emailTasks_lambda_and_api.name}"
		]
    policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy_attachment" "attach-ddb-read-policy" {
    name = "ddb-read-policy"
    roles = [
		"${aws_iam_role.iam_for__getTasks_lambda_and_api.name}",
		"${aws_iam_role.iam_for__addTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for__updateTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for__deleteTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for_emailTasks_lambda_and_api.name}"
	]
    policy_arn = "${aws_iam_policy.policy_for_readDB.arn}"
}

resource "aws_iam_policy_attachment" "attach-ddb-update-policy" {
    name = "ddb-update-policy"
    roles = [
		"${aws_iam_role.iam_for__addTask_lambda_and_api.name}",
		"${aws_iam_role.iam_for__updateTask_lambda_and_api.name}",
	]
    policy_arn = "${aws_iam_policy.policy_for_updateDB.arn}"
}

resource "aws_iam_policy_attachment" "attach-ddb-delete-policy" {
    name = "ddb-delete-policy"
    roles = [
		"${aws_iam_role.iam_for__deleteTask_lambda_and_api.name}"
	]
    policy_arn = "${aws_iam_policy.policy_for_deleteItemDB.arn}"
}

#Create Functions
####
resource "aws_lambda_function" "getTasks_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "getTasks"
    role = "${aws_iam_role.iam_for__getTasks_lambda_and_api.arn}"
    handler = "handler.getTasks"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
}

resource "aws_lambda_function" "addTask_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "addTask"
    role = "${aws_iam_role.iam_for__addTask_lambda_and_api.arn}"
    handler = "handler.addTask"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
}

resource "aws_lambda_function" "updateTask_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "updateTask"
    role = "${aws_iam_role.iam_for__updateTask_lambda_and_api.arn}"
    handler = "handler.updateTask"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
}

resource "aws_lambda_function" "deleteTask_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "deleteTask"
    role = "${aws_iam_role.iam_for__deleteTask_lambda_and_api.arn}"
    handler = "handler.deleteTask"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
}

resource "aws_lambda_function" "emailTasks_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "emailTasks"
    role = "${aws_iam_role.iam_for__emailTasks_lambda_and_api.arn}"
    handler = "handler.emailTasks"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
}

#Create API Gateway
####
resource "aws_api_gateway_rest_api" "fuzzy_giggle_api" {
  name = "fuzzy_giggle_api"
  description = ""
}

resource "aws_api_gateway_resource" "tasks-resource" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  parent_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.root_resource_id}"
  path_part = "tasks"
}

resource "aws_api_gateway_method" "tasks-get" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Integration" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  type = "AWS"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.getTasks_lambda.arn}/invocations"
  request_templates = {
     "application/json" = "${file("api_gateway_body_mapping.template")}"
  }
}

resource "aws_api_gateway_method_response" "200" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Integration"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  status_code = "${aws_api_gateway_method_response.200.status_code}"
}

resource "aws_api_gateway_deployment" "Fuzzy-Giggle-Deployment" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Integration"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  stage_name = "dev"
}

#Create DynamoDb Table
####
resource "aws_dynamodb_table" "dynamodb-table" {
    name = "tasks-table"
    read_capacity = 5
    write_capacity = 5
    hash_key = "taskId"
    attribute {
      name = "taskId"
      type = "S"
    }
}