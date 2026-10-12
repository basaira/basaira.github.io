// Focused SDK and Firestore Emulator security checks for the patched audit rule.
// This suite is direct-SDK rules evidence; UI handler evidence is in admin-four-state.mjs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {
  collection,deleteDoc,doc,getDoc,getDocs,serverTimestamp,setDoc,
  Timestamp,updateDoc,writeBatch
} from 'firebase/firestore';

const projectId='demo-basair-no-email-security';
assert.equal(process.env.GCLOUD_PROJECT,projectId);
assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^127\.0\.0\.1:\d+$/);
const rules=readFileSync('firestore.rules','utf8');
const env=await initializeTestEnvironment({projectId,firestore:{rules}});
const audit=(uid,email='',changes={})=>({
  action:'request.status',targetType:'request',targetId:'lead',details:{status:'contacted'},
  actorUid:uid,actorEmail:email,createdAt:serverTimestamp(),...changes
});
const privileged=async fn=>env.withSecurityRulesDisabled(async ctx=>fn(ctx.firestore()));
async function snapshot(){
  let value;
  await privileged(async db=>{
    value={
      request:(await getDoc(doc(db,'enrollment_requests','lead'))).data(),
      content:(await getDoc(doc(db,'site_content','public'))).data(),
      audits:(await getDocs(collection(db,'admin_audit'))).size
    };
  });
  return value;
}
async function denial(label,operation,strictAuditPredicate=false){
  const before=await snapshot();
  let error;
  try{await operation()}catch(caught){error=caught}
  assert.ok(error,`${label}: expected denial`);
  assert.equal(error.code,'permission-denied',`${label}: unexpected error ${error}`);
  if(strictAuditPredicate) assert.doesNotMatch(String(error),/evaluation error|Property email is undefined/i,
    `${label}: patched audit expression must evaluate safely`);
  assert.deepEqual(await snapshot(),before,`${label}: denied operation must be atomic`);
  console.log(JSON.stringify({result:'PASS: expected PERMISSION_DENIED, no state or audit change',label,
    existingRoleRuleEvaluation:/evaluation error/i.test(String(error))}));
}
async function atomicStatus(db,entry,handledBy=entry.actorUid){
  const batch=writeBatch(db);
  batch.update(doc(db,'enrollment_requests','lead'),{
    status:'contacted',handledAt:serverTimestamp(),handledBy
  });
  batch.set(doc(collection(db,'admin_audit')),entry);
  return batch.commit();
}
try{
  await privileged(async db=>{
    for(const [uid,active] of [['noEmail',true],['emailAdmin',true],['malformed',true],['inactive',false],['revoked',true]])
      await setDoc(doc(db,'admin_roles',uid),{active});
    await setDoc(doc(db,'enrollment_requests','lead'),{status:'new',fullName:'Synthetic Lead'});
    await setDoc(doc(db,'site_content','public'),{texts:{welcome:'Original',keep:'Keep'},videos:[],settings:{safe:true}});
  });
  const noEmail=env.authenticatedContext('noEmail').firestore();
  const emailAdmin=env.authenticatedContext('emailAdmin',{email:'admin@example.invalid'}).firestore();
  const malformed=env.authenticatedContext('malformed',{email:42}).firestore();
  const inactive=env.authenticatedContext('inactive').firestore();
  const outsider=env.authenticatedContext('student').firestore();
  const guest=env.unauthenticatedContext().firestore();
  const revoked=env.authenticatedContext('revoked').firestore();
  assert.equal((await getDocs(collection(noEmail,'enrollment_requests'))).size,1);
  await atomicStatus(noEmail,audit('noEmail'));
  assert.equal((await snapshot()).request.handledBy,'noEmail');
  assert.equal((await snapshot()).audits,1);
  await atomicStatus(emailAdmin,audit('emailAdmin','admin@example.invalid'));
  assert.equal((await snapshot()).audits,2);
  console.log(JSON.stringify({result:'PASS: optional email and present email each commit one atomic audit'}));

  await denial('unauthenticated read',()=>getDocs(collection(guest,'enrollment_requests')));
  await denial('non-admin read',()=>getDocs(collection(outsider,'admin_audit')));
  await denial('inactive read',()=>getDocs(collection(inactive,'enrollment_requests')));
  await denial('unauthenticated batch',()=>atomicStatus(guest,audit('guest')));
  await denial('non-admin batch',()=>atomicStatus(outsider,audit('student')));
  await denial('inactive batch',()=>atomicStatus(inactive,audit('inactive')));
  await privileged(db=>updateDoc(doc(db,'admin_roles','revoked'),{active:false}));
  await denial('revoked batch',()=>atomicStatus(revoked,audit('revoked')));
  await denial('actorUid spoof',()=>atomicStatus(noEmail,audit('impostor'),'noEmail'),true);
  await denial('actorEmail spoof with token email',()=>atomicStatus(emailAdmin,audit('emailAdmin','forged@example.invalid')),true);
  await denial('nonempty email with missing token claim',()=>atomicStatus(noEmail,audit('noEmail','forged@example.invalid')),true);
  await denial('malformed numeric token email',()=>atomicStatus(malformed,audit('malformed','')),true);
  await denial('invalid audit action',()=>atomicStatus(noEmail,audit('noEmail','',{action:'role.create'})),true);
  await denial('unexpected audit fields',()=>atomicStatus(noEmail,audit('noEmail','',{privateData:'synthetic'})),true);
  await denial('invalid timestamp',()=>atomicStatus(noEmail,audit('noEmail','',{createdAt:Timestamp.fromMillis(0)})),true);
  await denial('disallowed status field',async()=>{
    const batch=writeBatch(noEmail);
    batch.update(doc(noEmail,'enrollment_requests','lead'),{
      status:'contacted',handledAt:serverTimestamp(),handledBy:'noEmail',fullName:'Changed'
    });
    batch.set(doc(collection(noEmail,'admin_audit')),audit('noEmail'));
    await batch.commit();
  });
  await denial('malformed content and audit',async()=>{
    const batch=writeBatch(noEmail);
    batch.update(doc(noEmail,'site_content','public'),{videos:'malformed'});
    batch.set(doc(collection(noEmail,'admin_audit')),audit('noEmail'));
    await batch.commit();
  });
  const auditDocs=await getDocs(collection(noEmail,'admin_audit'));
  await denial('audit modification',()=>updateDoc(auditDocs.docs[0].ref,{actorEmail:'changed'}));
  await denial('audit deletion',()=>deleteDoc(auditDocs.docs[0].ref));
  console.log(JSON.stringify({result:'PASS',projectId,negativeCases:18,audits:(await snapshot()).audits}));
}finally{await env.cleanup()}
