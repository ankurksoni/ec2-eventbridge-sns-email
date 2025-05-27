import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

/**
 * CDK Stack to set up an AWS Lambda function triggered by EC2 state change events,
 * which then publishes notifications to an SNS topic with an email subscription.
 *
 * - Provisions a Lambda function with permissions for CloudWatch Logs and SNS publish.
 * - Sets up an EventBridge rule to trigger Lambda on EC2 instance state changes.
 * - Configures an SNS topic with an email subscription for notifications.
 *
 * Replace EMAIL_ID with your actual email address to receive notifications.
 */
const EMAIL_ID = '<your-email-id>@gmail.com'; // TODO: Replace with your email to receive notifications
const ACCOUNT_ID = '<YOUR_ACCOUNT_ID>';

export class LambdaSnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an SNS topic for EC2 state change notifications
    const snsTopic = new sns.Topic(this, 'EC2StateChangeTopic', {
      topicName: 'EC2StateChangeTopic',
    });

    // Define the Lambda function that will process EC2 events and publish to SNS
    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_22_X, // Use Node.js 22.x runtime
      handler: 'index.handler', // Entry point for Lambda
      code: lambda.Code.fromAsset('src'), // Lambda code directory
      environment: {
        SNS_TOPIC_ARN: snsTopic.topicArn, // Pass SNS topic ARN as env variable
      },
    });

    // Grant Lambda permissions to write to CloudWatch Logs
    const logsPolicy = new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [`arn:aws:logs:*:${ACCOUNT_ID}:log-group:/aws/lambda/*`],
      effect: iam.Effect.ALLOW,
    });

    // Grant Lambda permissions to publish to the SNS topic
    const snsPolicy = new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [snsTopic.topicArn],
      effect: iam.Effect.ALLOW,
    });

    // Attach policies to Lambda's execution role
    lambdaFunction.addToRolePolicy(logsPolicy);
    lambdaFunction.addToRolePolicy(snsPolicy);

    // Create an EventBridge rule for EC2 instance state change notifications
    const eventRule = new events.Rule(this, 'EC2EventRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Instance State-change Notification'],
      },
    });

    // Set Lambda as the target for the EventBridge rule
    eventRule.addTarget(new targets.LambdaFunction(lambdaFunction));

    // Allow EventBridge to invoke the Lambda function
    lambdaFunction.addPermission('AllowEventRuleToInvokeLambda', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      sourceArn: eventRule.ruleArn,
    });

    // Subscribe an email address to the SNS topic for notifications
    snsTopic.addSubscription(new subscriptions.EmailSubscription(EMAIL_ID));
    
  }
}
