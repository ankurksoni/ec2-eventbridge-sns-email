import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// create a handler function that takes an event and forward it to sns topic    
export const handler = async (event: any) => {
    // get the instance id from the event
    const instanceId = event.detail['instance-id'];
    const state = event.detail.state;
    const region = event.region;
    const accountId = event.account;
    const time = event.time;

    // Print the instance id, state, region, account id, and time
    console.log('Event:', JSON.stringify(event));
    console.log('Instance ID:', instanceId);
    console.log('State:', state);
    console.log('Region:', region);
    console.log('Account ID:', accountId);
    console.log('Time:', time);

    // create a sns client
    const snsClient = new SNSClient({});
    console.log('SNS_TOPIC_ARN:', process.env.SNS_TOPIC_ARN);
    const topicArn = process.env.SNS_TOPIC_ARN;
    console.log('Topic ARN:', topicArn);
    await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(event),
        Subject: 'EC2 State Change Notification',
    }));
};