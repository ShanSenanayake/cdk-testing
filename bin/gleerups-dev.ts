#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GleerupsDevStack } from '../lib/gleerups-dev-stack';

const app = new cdk.App();
new GleerupsDevStack(app, 'Shan-Kinesis-poc');
