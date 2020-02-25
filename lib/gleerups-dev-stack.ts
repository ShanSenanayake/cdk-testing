import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as kinesis from '@aws-cdk/aws-kinesis'
import * as eventSources from '@aws-cdk/aws-lambda-event-sources';
import * as events from '@aws-cdk/aws-events';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs'

export class GleerupsDevStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Create all resources
    const eventRole =  new iam.Role(this, 'Event Role', {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com')
    })
    const apigatewayRole = new iam.Role(this, 'Apigateway Role', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    })

    const logGroup = new logs.LogGroup(this, 'Event logs group')

    const eventBridge = new events.EventBus(this, 'EventBridge')
    const catchAllKinesisRule = new events.Rule(this, 'Push all events to kinesis', {
      eventBus: eventBridge,
      ruleName: 'All-eventBridge-events-to-kinesis', //Must satisfy [\.\-_A-Za-z0-9]+
      eventPattern: {
        source: ["dator"],
      }
    })


    const restApi = new apigw.RestApi(this, 'events api');
    const eventIntegration = new apigw.AwsIntegration({
      service: "events",
      action: "events:PutEvents",
      options: {
        credentialsRole: apigatewayRole,
        requestParameters: {
          "integration.request.header.X-Amz-Target": "'AWSEvents.PutEvents'",
          "integration.request.header.Content-Type": "'application/x-amz-json-1.1'" //Apparently need single quotes otherwise it won't work
        } ,
        requestTemplates: {
          "application/json": '{"Entries":[{"DetailType":$input.json(\'$.type\'),"Detail":"$util.escapeJavaScript($input.json(\'$\'))","EventBusName":"${Token[TOKEN.122]}","Source":"dator"}]}'
        }
      }
    })
          const a =  '{"Entries":[{"DetailType":$input.json(\'$.type\'),"Detail":$util.escapeJavaScript($input.json(\'$\')),"EventBusName":"${Token[TOKEN.122]}","Source":"dator"}]}'

    restApi.root.addMethod('POST', eventIntegration)

    const kinesisStream = new kinesis.Stream(this, 'KinesisStream')
    const lambdaFn =  new lambda.Function(this, 'KinesisConsumer', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/subscriber')
    })

  //give permission
  kinesisStream.grantRead(lambdaFn)
  kinesisStream.grantReadWrite(eventRole);
  logGroup.grantWrite(eventRole)
  events.EventBus.grantPutEvents(apigatewayRole);

  //Modify rules since resource does not exist yet: https://github.com/aws/aws-cdk/issues/2997
  const catchAllKinesisRuleResource = catchAllKinesisRule.node.defaultChild as events.CfnRule
  catchAllKinesisRuleResource.roleArn = `${eventRole.roleArn}`
  catchAllKinesisRuleResource.addPropertyOverride('Targets', [
    {
      Arn: `${(kinesisStream.node.defaultChild as kinesis.CfnStream).attrArn}`,
      Id: 'Kinesis-rule-Target',
    },
    {
      Arn: `${(logGroup.node.defaultChild as logs.CfnLogGroup).attrArn}`,
      Id: 'Cloudwatch-rule-Target',
    }
  ])

  //Connect all resources
  lambdaFn.addEventSource(new eventSources.KinesisEventSource(kinesisStream, {
    startingPosition: lambda.StartingPosition.LATEST,
    batchSize: 1
  }))
  }
}
