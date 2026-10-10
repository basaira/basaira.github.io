import test from 'node:test';
import assert from 'node:assert/strict';
import {isCurrentAdminSession,assertUnchanged,assertRequestTransition,sortRequests} from '../admin-repair-core.mjs';

test('rapid sign-out closes an earlier authorization callback', () => {
  assert.equal(isCurrentAdminSession(1,2,'admin','admin',true),false);
  assert.equal(isCurrentAdminSession(1,1,'admin','other',true),false);
  assert.equal(isCurrentAdminSession(1,1,'admin','admin',false),false);
  assert.equal(isCurrentAdminSession(1,1,'admin','admin',true),true);
});
test('concurrent edits cannot silently overwrite', () => {
  assertUnchanged({a:'x'},{a:'x'});
  assert.throws(()=>assertUnchanged({a:'x'},{a:'y'}),/Concurrent/);
  assert.throws(()=>assertRequestTransition('accepted','new'),/تغيّرت/);
  assertRequestTransition('new','new');
});
test('request ordering covers missing, ISO and Firestore dates deterministically', () => {
  const rows=[
    {id:'z',sourceCollection:'legacy',submissionDate:null},
    {id:'b',sourceCollection:'new',submissionDate:{toMillis:()=>300}},
    {id:'a',sourceCollection:'new',submissionDate:{toMillis:()=>300}},
    {id:'c',sourceCollection:'legacy',submissionDate:'2020-01-01T00:00:00.000Z'}
  ];
  assert.deepEqual(sortRequests(rows).map(x=>x.id),['c','a','b','z']);
});
test('ties are deterministic independent of input order',()=>{
  const a=[{id:'b',sourceCollection:'a'}, {id:'a',sourceCollection:'a'}];
  assert.deepEqual(sortRequests(a).map(x=>x.id),sortRequests([...a].reverse()).map(x=>x.id));
});
