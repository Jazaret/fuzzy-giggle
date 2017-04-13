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