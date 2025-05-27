#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaSnsStack } from '../lib/lambda-sns-stack';

const app = new cdk.App();
new LambdaSnsStack(app, 'LambdaSnsStack', {});