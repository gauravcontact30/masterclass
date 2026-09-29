import type { DocsProject } from "./official-docs-projects";

const file = (path: string, code: string) => ({ path, code: code.trim() + "\n", note: "" });

export const COMPLEX_AWS_PROJECT: DocsProject = {
  title: "Serverless task API: API Gateway → Lambda → DynamoDB",
  summary: "Run a SAM API and DynamoDB Local in Docker, validate requests, persist tasks, and run an HTTP smoke test. Includes infrastructure, table initialization, environment configuration, application modules, and unit tests.",
  prerequisites: ["Docker with Compose, AWS SAM CLI, Python 3.12+, and uv.", "Save files in a new folder. Ports 3000 and 8000 must be free.", "The supplied commands use local emulators and dummy credentials; no AWS account is required. This project demonstrates API Gateway, Lambda, DynamoDB, and SAM, not every AWS service."],
  points: ["The table has a single-string primary key; task IDs come from UUIDs.", "The scan endpoint is bounded and returns a cursor for pagination.", "The bundled IAM policy applies to the declared table. Local HTTP endpoints have no authentication.", "Official SAM local API reference: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-start-api.html"],
  commands: [
    { command: "uv sync", description: "Create the isolated Python environment and install boto3." },
    { command: "uv run python -m unittest discover -s tests -v", description: "Run handler validation and pagination unit tests." },
    { command: "docker compose up -d", description: "Start DynamoDB Local on the docs-aws-local Docker network." },
    { command: "uv run python scripts/init_table.py", description: "Wait for DynamoDB, then create the local table if absent." },
    { command: "sam build --use-container", description: "Build the Lambda code and its declared dependencies." },
    { command: "sam local start-api --docker-network docs-aws-local --env-vars env.local.json", description: "Start the local API. Keep this terminal running." },
    { command: "uv run python scripts/smoke.py", description: "In another terminal, create a task and read it through the API." },
    { command: "docker compose down", description: "After stopping SAM with Ctrl+C, stop the local database. The named data volume remains for the next run." },
  ],
  verify: ["The smoke test prints Created and retrieved task followed by its ID.", "GET http://localhost:3000/tasks returns items and nextCursor.", "The local database persists in the Docker volume across container restarts."],
  files: [
    file("src/app.py", `import base64
import json
import uuid
from repository import Repository

def response(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps(body)}

def handle(event, repository):
    method = event.get('httpMethod')
    if method == 'POST':
        try:
            raw = event.get('body') or '{}'
            if event.get('isBase64Encoded'):
                raw = base64.b64decode(raw, validate=True).decode('utf-8')
            body = json.loads(raw)
            title = body.get('title') if isinstance(body, dict) else None
            if not isinstance(title, str) or not 1 <= len(title.strip()) <= 120:
                return response(400, {'error': 'Title must contain 1–120 characters'})
        except (ValueError, UnicodeError):
            return response(400, {'error': 'Invalid JSON body'})
        task = {'id': str(uuid.uuid4()), 'title': title.strip(), 'done': False}
        repository.put(task)
        return response(201, task)
    if method == 'GET':
        query = event.get('queryStringParameters') or {}
        cursor = query.get('cursor')
        if cursor:
            try:
                uuid.UUID(cursor)
            except (ValueError, TypeError):
                return response(400, {'error': 'Invalid cursor'})
        items, next_cursor = repository.list(cursor)
        return response(200, {'items': items, 'nextCursor': next_cursor})
    return response(405, {'error': 'Method not allowed'})

def handler(event, context):
    try:
        return handle(event, Repository())
    except Exception:
        # Log the server error without exposing details to the caller.
        import logging
        logging.exception('Task request failed')
        return response(500, {'error': 'Internal server error'})`),
    file("src/repository.py", `import os
import boto3

class Repository:
    def __init__(self):
        endpoint = os.environ.get('DYNAMODB_ENDPOINT')
        options = {'region_name': os.environ.get('AWS_REGION', 'us-east-1')}
        if endpoint:
            options.update(endpoint_url=endpoint, aws_access_key_id='local', aws_secret_access_key='local')
        self.table = boto3.resource('dynamodb', **options).Table(os.environ['TABLE_NAME'])

    def put(self, task):
        self.table.put_item(Item=task, ConditionExpression='attribute_not_exists(id)')

    def list(self, cursor=None):
        options = {'Limit': 20, 'ConsistentRead': True}
        if cursor:
            options['ExclusiveStartKey'] = {'id': cursor}
        result = self.table.scan(**options)
        return result['Items'], result.get('LastEvaluatedKey', {}).get('id')`),
    file("src/requirements.txt", "boto3>=1.35,<2"),
    file("pyproject.toml", '[project]\nname = "docs-complex-aws"\nversion = "0.1.0"\nrequires-python = ">=3.12"\ndependencies = ["boto3>=1.35,<2"]'),
    file("template.yaml", `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  TasksTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
  TasksFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: app.handler
      Runtime: python3.12
      Timeout: 15
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref TasksTable
          DYNAMODB_ENDPOINT: ''
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref TasksTable
      Events:
        List:
          Type: Api
          Properties:
            Path: /tasks
            Method: get
        Create:
          Type: Api
          Properties:
            Path: /tasks
            Method: post`),
    file("compose.yaml", `services:
  dynamodb:
    image: amazon/dynamodb-local:latest
    command: '-jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data'
    working_dir: /home/dynamodblocal
    user: root
    ports: ['127.0.0.1:8000:8000']
    volumes: ['tasks-data:/home/dynamodblocal/data']
    networks: [local]
networks:
  local:
    name: docs-aws-local
volumes:
  tasks-data:`),
    file("env.local.json", JSON.stringify({ TasksFunction: { TABLE_NAME: "docs-complex-tasks", DYNAMODB_ENDPOINT: "http://dynamodb:8000" } }, null, 2)),
    file("scripts/init_table.py", `import time
import boto3
from botocore.exceptions import EndpointConnectionError

client = boto3.client('dynamodb', endpoint_url='http://127.0.0.1:8000', region_name='us-east-1', aws_access_key_id='local', aws_secret_access_key='local')
for attempt in range(30):
    try:
        client.list_tables()
        break
    except EndpointConnectionError:
        if attempt == 29:
            raise
        time.sleep(1)
name = 'docs-complex-tasks'
try:
    client.describe_table(TableName=name)
except client.exceptions.ResourceNotFoundException:
    client.create_table(TableName=name, BillingMode='PAY_PER_REQUEST',
        AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
        KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}])
client.get_waiter('table_exists').wait(TableName=name)
print('Local table ready:', name)`),
    file("scripts/smoke.py", `import json
from urllib.request import Request, urlopen
from urllib.parse import urlencode

base = 'http://127.0.0.1:3000/tasks'
request = Request(base, data=json.dumps({'title': 'Learn serverless'}).encode(), headers={'Content-Type': 'application/json'}, method='POST')
with urlopen(request, timeout=60) as result:
    assert result.status == 201
    task = json.load(result)
cursor = None
while True:
    url = base + ('?' + urlencode({'cursor': cursor}) if cursor else '')
    with urlopen(url, timeout=60) as result:
        page = json.load(result)
    if any(item['id'] == task['id'] for item in page['items']):
        break
    cursor = page['nextCursor']
    if not cursor:
        raise AssertionError('Created task not found')
print('Created and retrieved task', task['id'])`),
    file("tests/test_app.py", `import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'src'))
from app import handle

class MemoryRepository:
    def __init__(self): self.items = []
    def put(self, task): self.items.append(task)
    def list(self, cursor=None): return self.items, None

class HandlerTests(unittest.TestCase):
    def test_create_list_and_validation(self):
        repo = MemoryRepository()
        created = handle({'httpMethod': 'POST', 'body': '{"title":"AWS"}'}, repo)
        self.assertEqual(created['statusCode'], 201)
        listing = handle({'httpMethod': 'GET'}, repo)
        self.assertEqual(json.loads(listing['body'])['items'][0]['title'], 'AWS')
        for body in ['{', 'null', '{"title":""}']:
            self.assertEqual(handle({'httpMethod': 'POST', 'body': body}, repo)['statusCode'], 400)
        self.assertEqual(handle({'httpMethod': 'GET', 'queryStringParameters': {'cursor': 'bad'}}, repo)['statusCode'], 400)
        self.assertEqual(handle({'httpMethod': 'DELETE'}, repo)['statusCode'], 405)

if __name__ == '__main__': unittest.main()`),
  ],
};
