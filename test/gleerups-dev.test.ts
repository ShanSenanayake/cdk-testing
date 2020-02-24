import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import GleerupsDev = require('../lib/gleerups-dev-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new GleerupsDev.GleerupsDevStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
