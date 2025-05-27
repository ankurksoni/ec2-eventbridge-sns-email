import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

const EMAIL_ID = 'ankursoni.leonardo@gmail.com';

export class LambdaSnsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create a lambda function
    const snsTopic = new sns.Topic(this, 'EC2StateChangeTopic', {
      topicName: 'EC2StateChangeTopic',
    });

    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src'),
      environment: {
        SNS_TOPIC_ARN: snsTopic.topicArn,
      },
    });

    // CloudWatch Logs permissions 
    const logsPolicy = new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:*:698926940450:log-group:/aws/lambda/*'],
      effect: iam.Effect.ALLOW,
    });

    // SNS publish permissions
    const snsPolicy = new iam.PolicyStatement({
      actions: ['sns:Publish'],
      resources: [snsTopic.topicArn],
      effect: iam.Effect.ALLOW,
    });

    lambdaFunction.addToRolePolicy(logsPolicy);
    lambdaFunction.addToRolePolicy(snsPolicy);

    // create an event rule to trigger lambda on EC2 start and stop events
    const eventRule = new events.Rule(this, 'EC2EventRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Instance State-change Notification'],
      },
    });

    // add the lambda function as a target to the event rule
    eventRule.addTarget(new targets.LambdaFunction(lambdaFunction));

    lambdaFunction.addPermission('AllowEventRuleToInvokeLambda', {
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      sourceArn: eventRule.ruleArn,
    });

    // add an email subscription to the SNS topic
    snsTopic.addSubscription(new subscriptions.EmailSubscription(EMAIL_ID));
    
  }
}
