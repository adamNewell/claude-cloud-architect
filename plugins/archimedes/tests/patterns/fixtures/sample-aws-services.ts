import { DynamoDBClient, GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const dynamo = new DynamoDBClient({ region: "us-east-1" });
await dynamo.send(new GetItemCommand({ TableName: "users", Key: {} }));
await dynamo.send(new ScanCommand({ TableName: "orders" }));  // anti-pattern

const sqs = new SQSClient({ region: "us-east-1" });
await sqs.send(new SendMessageCommand({ QueueUrl: "...", MessageBody: "..." }));

export const handler = async (event: { Records: Array<{ body: string }> }) => {
  const message = event.Records[0].body; // SQS trigger signal
};

const sns = new SNSClient({ region: "us-east-1" });
await sns.send(new PublishCommand({ TopicArn: "...", Message: "..." }));

const events = new EventBridgeClient({ region: "us-east-1" });
await events.send(new PutEventsCommand({ Entries: [] }));

const sfn = new SFNClient({ region: "us-east-1" });
await sfn.send(new StartExecutionCommand({ stateMachineArn: "arn:aws:states:...", input: "{}" }));
