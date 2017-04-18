data "aws_caller_identity" "current" { }

variable "region" {
    default = "us-west-2"
}
    
provider "aws" {
  region = "${var.region}"
  profile                  = "default"
}

####
#Create DynamoDb Tables
####
resource "aws_dynamodb_table" "dynamodb-table-tasks" {
    name = "tasks-table"
    read_capacity = 5
    write_capacity = 5
    hash_key = "taskId"
    attribute {
      name = "taskId"
      type = "S"
    }
}
resource "aws_dynamodb_table" "dynamodb-table-messages" {
    name = "messages-table"
    read_capacity = 5
    write_capacity = 5
    hash_key = "messageId"
    attribute {
      name = "messageId"
      type = "S"
    }
    stream_enabled = true
    stream_view_type = "NEW_AND_OLD_IMAGES"
}

#############################
# IAM WHAT IAM              #
#############################

#Create roles
####
resource "aws_iam_role" "iam_terraform_for_lambda_getTasks" {
    name = "iam_terraform_for_lambda_getTasks"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_addTask" {
    name = "iam_terraform_for_lambda_addTask"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_updateTask" {
    name = "iam_terraform_for_lambda_updateTask"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_deleteTask" {
    name = "iam_terraform_for_lambda_deleteTask"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_emailTasks" {
    name = "iam_terraform_for_lambda_emailTasks"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_getMessages" {
    name = "iam_terraform_for_lambda_getMessages"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_addMessage" {
    name = "iam_terraform_for_lambda_addMessage"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_updateMessage" {
    name = "iam_terraform_for_lambda_updateMessage"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}
resource "aws_iam_role" "iam_terraform_for_lambda_messageDbTrigger" {
    name = "iam_terraform_for_lambda_messageDbTrigger"
    assume_role_policy =  "${file("policies/assume_role_policy.json")}"
}


#Create Policy Resources
#####
resource "aws_iam_policy" "policy_terraform_for_logs" {
  name        = "policy_terraform_for_logs"
  policy = "${file("policies/logs_policy.json")}"
}

resource "aws_iam_policy" "policy_terraform_for_readDB" {
  name        = "policy_terraform_for_readDB"
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
        "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "policy_terraform_for_writeDB" {
  name        = "policy_terraform_for_writeDB"
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
        "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "policy_terraform_for_deleteDB" {
  name        = "policy_terraform_for_deleteDB"
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
        "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "policy_terraform_for_triggerDB" {
  name        = "policy_terraform_for_triggerDB"
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
                "dynamodb:GetRecords",
                "dynamodb:GetShardIterator",
                "dynamodb:DescribeStream",
                "dynamodb:ListStreams"
            ],
      "Resource": [
        "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/*"
      ]
    }
  ]
}
EOF
}

resource "aws_iam_policy" "policy_terraform_for_ses" {
  name        = "policy_terraform_for_ses"
  policy = "${file("policies/send_ses_email_policy.json")}"
}

#Associate policies to roles
#####
resource "aws_iam_policy_attachment" "role_policy_logs" {
    name = "role_policy_logs"
    roles = [
      "${aws_iam_role.iam_terraform_for_lambda_getTasks.name}",
      "${aws_iam_role.iam_terraform_for_lambda_addTask.name}",
      "${aws_iam_role.iam_terraform_for_lambda_updateTask.name}",
      "${aws_iam_role.iam_terraform_for_lambda_deleteTask.name}",
      "${aws_iam_role.iam_terraform_for_lambda_emailTasks.name}",
      "${aws_iam_role.iam_terraform_for_lambda_getMessages.name}",
      "${aws_iam_role.iam_terraform_for_lambda_addMessage.name}",
      "${aws_iam_role.iam_terraform_for_lambda_updateMessage.name}",
      "${aws_iam_role.iam_terraform_for_lambda_messageDbTrigger.name}",
    ]
    policy_arn = "${aws_iam_policy.policy_terraform_for_logs.arn}"
}

resource "aws_iam_policy_attachment" "role_policy_readDB" {
    name = "role_policy_readDB"
    roles = [
      "${aws_iam_role.iam_terraform_for_lambda_getTasks.name}",
      "${aws_iam_role.iam_terraform_for_lambda_updateTask.name}",
      "${aws_iam_role.iam_terraform_for_lambda_emailTasks.name}",
      "${aws_iam_role.iam_terraform_for_lambda_getMessages.name}",
      "${aws_iam_role.iam_terraform_for_lambda_updateMessage.name}",
      "${aws_iam_role.iam_terraform_for_lambda_messageDbTrigger.name}",
    ]
    policy_arn = "${aws_iam_policy.policy_terraform_for_readDB.arn}"
}

resource "aws_iam_policy_attachment" "role_policy_writeDB" {
    name = "role_policy_writeDB"
    roles = [
      "${aws_iam_role.iam_terraform_for_lambda_addTask.name}",
      "${aws_iam_role.iam_terraform_for_lambda_updateTask.name}",
      "${aws_iam_role.iam_terraform_for_lambda_addMessage.name}",
      "${aws_iam_role.iam_terraform_for_lambda_updateMessage.name}",
    ]
    policy_arn = "${aws_iam_policy.policy_terraform_for_writeDB.arn}"
}

resource "aws_iam_policy_attachment" "role_policy_triggerDb" {
    name = "role_policy_triggerDb"
    roles = [
      "${aws_iam_role.iam_terraform_for_lambda_messageDbTrigger.name}",
    ]
    policy_arn = "${aws_iam_policy.policy_terraform_for_triggerDB.arn}"
}

resource "aws_iam_policy_attachment" "role_policy_ses" {
    name = "role_policy_ses"
    roles = [
        "${aws_iam_role.iam_terraform_for_lambda_emailTasks.name}",
        "${aws_iam_role.iam_terraform_for_lambda_messageDbTrigger.name}",
    ]
    policy_arn = "${aws_iam_policy.policy_terraform_for_ses.arn}"
}


#############################
# FUNCTION JUNCTION         #
#############################
resource "aws_lambda_function" "getTasks_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "getTasks"
    role = "${aws_iam_role.iam_terraform_for_lambda_getTasks.arn}"
    handler = "handlerTasks.getTasks"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "tasks-table"
      }
    }
}

resource "aws_lambda_function" "addTask_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "addTask"
    role = "${aws_iam_role.iam_terraform_for_lambda_addTask.arn}"
    handler = "handlerTasks.addTask"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "tasks-table"
      }
    }
}

resource "aws_lambda_function" "updateTask_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "updateTask"
    role = "${aws_iam_role.iam_terraform_for_lambda_updateTask.arn}"
    handler = "handlerTasks.updateTask"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "tasks-table"
      }
    }
}

resource "aws_lambda_function" "deleteTask_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "deleteTask"
    role = "${aws_iam_role.iam_terraform_for_lambda_deleteTask.arn}"
    handler = "handlerTasks.deleteTask"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "tasks-table"
      }
    }
}

resource "aws_lambda_function" "emailTasks_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "emailTasks"
    role = "${aws_iam_role.iam_terraform_for_lambda_emailTasks.arn}"
    handler = "handlerTasks.emailTasks"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "tasks-table"
      }
    }
}

# Cloudwatch scheduler for emailTasks
#####
resource "aws_cloudwatch_event_rule" "every_day" {
    name = "every_day"
    description = "Fires every 24 hours"
    schedule_expression = "rate(24 hours)"
}

resource "aws_cloudwatch_event_target" "emailTasks_every_day" {
    rule = "${aws_cloudwatch_event_rule.every_day.name}"
    target_id = "emailTasks_lambda"
    arn = "${aws_lambda_function.emailTasks_lambda.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_emailTasks" {
    statement_id = "AllowExecutionFromCloudWatch"
    action = "lambda:InvokeFunction"
    function_name = "${aws_lambda_function.emailTasks_lambda.function_name}"
    principal = "events.amazonaws.com"
    source_arn = "${aws_cloudwatch_event_rule.every_day.arn}"
}
######
# End Cloudwatch scheduler

# Messages lambdas
######
resource "aws_lambda_function" "getMessages_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "getMessages"
    role = "${aws_iam_role.iam_terraform_for_lambda_getMessages.arn}"
    handler = "handlerMessages.getMessages"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "messages-table"
      }
    }
}

resource "aws_lambda_function" "addMessage_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "addMessage"
    role = "${aws_iam_role.iam_terraform_for_lambda_addMessage.arn}"
    handler = "handlerMessages.addMessage"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "messages-table"
      }
    }
}

resource "aws_lambda_function" "updateMessage_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "updateMessage"
    role = "${aws_iam_role.iam_terraform_for_lambda_updateMessage.arn}"
    handler = "handlerMessages.updateMessage"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "messages-table"
      }
    }
}

resource "aws_lambda_function" "triggerMessagesNotify_lambda" {
    filename = "fuzzy-giggle.zip"
    function_name = "triggerMessagesNotify"
    role = "${aws_iam_role.iam_terraform_for_lambda_messageDbTrigger.arn}"
    handler = "handlerMessages.triggerMessagesNotify"
    source_code_hash = "${base64sha256(file("fuzzy-giggle.zip"))}"
    timeout = 60
    runtime = "nodejs6.10"
    environment {
      variables = {
        TABLE_NAME = "messages-table"
      }
    }
}

# DynamodDB Trigger for messages notify
######
resource "aws_lambda_event_source_mapping" "event_source_mapping_messagesNotify" {
  batch_size        = 1
  event_source_arn  = "${aws_dynamodb_table.dynamodb-table-messages.stream_arn}"
  enabled           = true
  function_name     = "${aws_lambda_function.triggerMessagesNotify_lambda.function_name}"
  starting_position = "LATEST"
}
#######
#

#############################
# API                       #
#############################
resource "aws_api_gateway_rest_api" "fuzzy_giggle_api" {
  name = "fuzzy_giggle_api"
}

resource "aws_api_gateway_resource" "tasks-resource" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  parent_id   = "${aws_api_gateway_rest_api.fuzzy_giggle_api.root_resource_id}"
  path_part   = "tasks"
}

#Tasks/Get#
resource "aws_api_gateway_method" "tasks-get" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-GET-Integration-Tasks" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.getTasks_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-get-tasks" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Get-Task" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-GET-Integration-Tasks"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  status_code = "${aws_api_gateway_method_response.200-get-tasks.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_get" {
    depends_on = [
        "aws_api_gateway_method.tasks-get",
        "aws_api_gateway_method_response.200-get-tasks"
    ]    
    function_name = "${aws_lambda_function.getTasks_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForGet"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End Tasks/Get#

#Tasks/Post#
resource "aws_api_gateway_method" "tasks-post" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Post-Integration-Task" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-post.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.addTask_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-post-tasks" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-post.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Post-Task" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Post-Integration-Task"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-post.http_method}"
  status_code = "${aws_api_gateway_method_response.200-post-tasks.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_post" {
    depends_on = [
        "aws_api_gateway_method.tasks-post",
        "aws_api_gateway_method_response.200-post-tasks"
    ]      
    function_name = "${aws_lambda_function.addTask_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForPost"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End Tasks/POST#

#Tasks/PUT#
resource "aws_api_gateway_method" "tasks-put" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Put-Integration-Task" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-put.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.updateTask_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-put-tasks" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-put.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Put-Task" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Put-Integration-Task"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-put.http_method}"
  status_code = "${aws_api_gateway_method_response.200-put-tasks.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_put" {
    depends_on = [
        "aws_api_gateway_method.tasks-put",
        "aws_api_gateway_method_response.200-put-tasks"
    ]    
    function_name = "${aws_lambda_function.updateTask_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForPut"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End Tasks/PUT#

#Tasks/DELETE#
resource "aws_api_gateway_method" "tasks-delete" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Delete-Integration-Task" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-delete.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.deleteTask_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-delete-tasks" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-delete.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Delete-Task" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Delete-Integration-Task"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-delete.http_method}"
  status_code = "${aws_api_gateway_method_response.200-delete-tasks.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_delete" {
    depends_on = [
        "aws_api_gateway_method.tasks-delete",
        "aws_api_gateway_method_response.200-delete-tasks"
    ]      
    function_name = "${aws_lambda_function.deleteTask_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForDelete"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End Tasks/DELETE#


# Messasges path
######

resource "aws_api_gateway_resource" "messages-resource" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  parent_id   = "${aws_api_gateway_rest_api.fuzzy_giggle_api.root_resource_id}"
  path_part   = "messages"
}

#messages/Get#
resource "aws_api_gateway_method" "messages-get" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-GET-Integration-messages" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-get.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.getMessages_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-get-messages" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-get.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Get-Message" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-GET-Integration-messages"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-get.http_method}"
  status_code = "${aws_api_gateway_method_response.200-get-messages.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_get_messages" {
    depends_on = [
        "aws_api_gateway_method.messages-get",
        "aws_api_gateway_method_response.200-get-messages"
    ]  
    function_name = "${aws_lambda_function.getMessages_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForGetMessages"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End messages/Get#

#messages/Post#
resource "aws_api_gateway_method" "messages-post" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Post-Integration-messages" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-post.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.addMessage_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-post-messages" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-post.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Post-Message" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Post-Integration-messages"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-post.http_method}"
  status_code = "${aws_api_gateway_method_response.200-post-messages.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_post_messages" {
    depends_on = [
        "aws_api_gateway_method.messages-post",
        "aws_api_gateway_method_response.200-post-messages"
    ]    
    function_name = "${aws_lambda_function.addMessage_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForPostMessages"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End messages/POST#

#messages/PUT#
resource "aws_api_gateway_method" "messages-put" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Put-Integration-messages" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-put.http_method}"
  type = "AWS_PROXY"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.updateMessage_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-put-messages" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-put.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Put-Message" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Put-Integration-messages"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.messages-resource.id}"
  http_method = "${aws_api_gateway_method.messages-put.http_method}"
  status_code = "${aws_api_gateway_method_response.200-put-messages.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_put_messages" {
    depends_on = [
        "aws_api_gateway_method.tasks-put",
        "aws_api_gateway_method_response.200-put-messages"
    ]      
    function_name = "${aws_lambda_function.updateMessage_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForPut"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${data.aws_caller_identity.current.account_id}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*/"
}
#End messages/PUT#