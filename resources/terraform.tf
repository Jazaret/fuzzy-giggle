variable "region" {
    default = "us-west-2"
}
variable "accountid" {
    default = "${var.accountid}"
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
  policy = "${file("policies/dynamodb_read_policy.json")}"
}

resource "aws_iam_policy" "policy_terraform_for_writeDB" {
  name        = "policy_terraform_for_writeDB"
  policy = "${file("policies/dynamodb_write_policy.json")}"
}

resource "aws_iam_policy" "policy_terraform_for_deleteDB" {
  name        = "policy_terraform_for_deleteDB"
  policy = "${file("policies/dynamodb_delete_policy.json")}"
}

resource "aws_iam_policy" "policy_terraform_for_triggerDB" {
  name        = "policy_terraform_for_triggerDB"
  policy = "${file("policies/dynamodb_trigger_policy.json")}"
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

resource "aws_lambda_function" "addMessages_lambda" {
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
    handler = "handlerTasks.triggerMessagesNotify"
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
# AP AYAYAY                 #
#############################
# Now, we need an API to expose those functions publicly
resource "aws_api_gateway_rest_api" "fuzzy_giggle_api" {
  name = "Task and Messages"
}

# The API requires at least one "endpoint", or "resource" in AWS terminology.
# The endpoint created here is: /task
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

resource "aws_api_gateway_integration" "Fuzzy-Giggle-GET-Integration" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  type = "AWS"
  integration_http_method = "GET"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.getTasks_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-get" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Get" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-GET-Integration"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-get.http_method}"
  status_code = "${aws_api_gateway_method_response.200-get.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_get" {
    function_name = "${aws_lambda_function.getTasks_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForGet"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${var.accountid}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*"
}
#End Tasks/Get#

#Tasks/Post#
resource "aws_api_gateway_method" "tasks-post" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Post-Integration" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-post.http_method}"
  type = "AWS"
  integration_http_method = "POST"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.addTask_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-post" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-post.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Post" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Post-Integration"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-post.http_method}"
  status_code = "${aws_api_gateway_method_response.200-post.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_post" {
    function_name = "${aws_lambda_function.addTask_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForPost"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${var.accountid}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*"
}
#End Tasks/POST#

#Tasks/PUT#
resource "aws_api_gateway_method" "tasks-put" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Put-Integration" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-put.http_method}"
  type = "AWS"
  integration_http_method = "PUT"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.updateTask_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-put" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-put.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Put" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Put-Integration"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-put.http_method}"
  status_code = "${aws_api_gateway_method_response.200-put.status_code}"
}

resource "aws_lambda_permission" "allow_api_gateway_put" {
    function_name = "${aws_lambda_function.updateTask_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForPut"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${var.accountid}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*"
}
#End Tasks/PUT#

#Tasks/DELETE#
resource "aws_api_gateway_method" "tasks-delete" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "Fuzzy-Giggle-Delete-Integration" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-delete.http_method}"
  type = "AWS"
  integration_http_method = "DELETE"
  uri = "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/${aws_lambda_function.deleteTask_lambda.arn}/invocations"
}

resource "aws_api_gateway_method_response" "200-delete" {
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-delete.http_method}"
  status_code = "200"
}

resource "aws_api_gateway_integration_response" "Fuzzy-Giggle-IntegrationResponse-Delete" {
  depends_on = ["aws_api_gateway_integration.Fuzzy-Giggle-Delete-Integration"]
  rest_api_id = "${aws_api_gateway_rest_api.fuzzy_giggle_api.id}"
  resource_id = "${aws_api_gateway_resource.tasks-resource.id}"
  http_method = "${aws_api_gateway_method.tasks-delete.http_method}"
  status_code = "${aws_api_gateway_method_response.200-delete.status_code}"
}
resource "aws_lambda_permission" "allow_api_gateway_delete" {
    function_name = "${aws_lambda_function.deleteTask_lambda.function_name}"
    statement_id = "AllowExecutionFromApiGatewayForDelete"
    action = "lambda:InvokeFunction"
    principal = "apigateway.amazonaws.com"
    source_arn = "arn:aws:execute-api:${var.region}:${var.accountid}:${aws_api_gateway_rest_api.fuzzy_giggle_api.id}/*/*"
}
#End Tasks/DELETE#