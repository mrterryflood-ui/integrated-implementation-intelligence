import test from 'node:test';
import assert from 'node:assert/strict';
import {planningReturnPath} from '../lib/planning-navigation';
test('the chosen tool survives sign-in without permitting arbitrary redirect paths',()=>{
 assert.equal(planningReturnPath({view:'meetings'}),'/planning?view=meetings');
 assert.equal(planningReturnPath({view:'implementation',organizationId:'edb8435b-093e-4ec3-a268-244c3480dc17'}),'/planning?view=implementation&organizationId=edb8435b-093e-4ec3-a268-244c3480dc17');
 assert.equal(planningReturnPath({view:'https://example.org',organizationId:'../private',redirect:'https://example.org'}),'/planning');
 assert.equal(planningReturnPath({view:['meetings','knowledge']}),'/planning');
});
