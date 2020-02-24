import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as kinesis from '@aws-cdk/aws-kinesis'
import * as eventSources from '@aws-cdk/aws-lambda-event-sources';

export class GleerupsDevStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const kinesisStream = new kinesis.Stream(this, 'KinesisStream')
    const lambdaFn =  new lambda.Function(this, 'KinesisConsumer', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/subscriber')
    })

  kinesisStream.grantRead(lambdaFn)

  lambdaFn.addEventSource(new eventSources.KinesisEventSource(kinesisStream, {
    startingPosition: lambda.StartingPosition.LATEST,
    batchSize: 1
  }))
  }
}
