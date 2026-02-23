import { Logger } from "@aws-lambda-powertools/logger";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

// Cold start risk: module-level SDK init
const logger = new Logger();
const heavyClient = new SomeSDKClient({ region: "us-east-1" });

// ESM handler
export const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
