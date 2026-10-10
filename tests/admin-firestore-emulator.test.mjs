import fs from 'node:fs';
import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch} from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Refusing non-emulator Firestore testing');
const projectId = 'demo-basair-admin-security';
let env, guest, student, administrator;

before(async()=>{
  env = await initializeTestEnvironment({
    projectId,
    firestore:{rules:fs.readFileSync('firestore.rules','utf8')}
  });
  guest=env.unauthenticatedContext().firestore();
  student=env.authenticatedContext('student',{email:'student@example.invalid'}).firestore();
  administrator=env.authenticatedContext('admin1',{email:'admin@example.invalid'}).firestore();
  await env.withSecurityRulesDisabled(async ctx=>{
    const db=ctx.firestore();
    await setDoc(doc(db,'admin_roles','admin1'),{active:true});
    await setDoc(doc(db,'admin_roles','inactive'),{active:false});
    await setDoc(doc(db,'enrollment_requests','legacy1'),{status:'new',fullName:'Synthetic Only'});
    await setDoc(doc(db,'site_content','public'),{texts:{},videos:[],settings:{}});
  });
});
after(async()=>{if(env)await env.cleanup()});

test('anonymous and non-admin cannot read private requests',async()=>{
  await assertFails(getDocs(collection(guest,'assessment_requests')));
  await assertFails(getDocs(collection(student,'enrollment_requests')));
  await assertSucceeds(getDoc(doc(guest,'site_content','public')));
});
test('no public admin creation or non-admin content mutation',async()=>{
  await assertFails(setDoc(doc(guest,'admin_roles','guest'),{active:true}));
  await assertFails(setDoc(doc(student,'site_content','public'),{texts:{hacked:'value'}},{merge:true}));
  await assertFails(setDoc(doc(administrator,'admin_roles','student'),{active:true}));
  await assertFails(setDoc(doc(student,'settings','global'),{admin:true}));
});
test('visitor assessment validation remains intact',async()=>{
  const lead={requestType:'free_assessment',fullName:'Synthetic Student',country:'Egypt',track:'Arabic',
    firstTouchAttribution:{},lastTouchAttribution:{},status:'new',email:'synthetic@example.invalid',
    submittedAt:serverTimestamp()};
  await assertSucceeds(addDoc(collection(guest,'assessment_requests'),lead));
  await assertFails(addDoc(collection(guest,'assessment_requests'),{...lead,status:'accepted'}));
});
test('admin status update binds actor UID, blocks arbitrary mutations',async()=>{
  await assertSucceeds(updateDoc(doc(administrator,'enrollment_requests','legacy1'),{
    status:'contacted',handledBy:'admin1',handledAt:serverTimestamp()
  }));
  await assertFails(updateDoc(doc(administrator,'enrollment_requests','legacy1'),{
    status:'accepted',handledBy:'other-admin',handledAt:serverTimestamp()
  }));
  await assertFails(updateDoc(doc(administrator,'enrollment_requests','legacy1'),{fullName:'Overwrite'}));
});
test('audit entries enforce actual actor and immutability',async()=>{
  const valid={action:'request.status',targetType:'request',targetId:'legacy1',
    details:{status:'contacted',collection:'enrollment_requests'},
    actorUid:'admin1',actorEmail:'admin@example.invalid',createdAt:serverTimestamp()};
  const audit=await assertSucceeds(addDoc(collection(administrator,'admin_audit'),valid));
  await assertFails(addDoc(collection(administrator,'admin_audit'),{...valid,actorUid:'student'}));
  await assertFails(addDoc(collection(administrator,'admin_audit'),{...valid,actorEmail:'spoof@example.invalid'}));
  await assertFails(addDoc(collection(student,'admin_audit'),{...valid,actorUid:'student'}));
  await assertFails(updateDoc(doc(administrator,'admin_audit',audit.id),{action:'video.delete'}));
  await assertFails(deleteDoc(doc(administrator,'admin_audit',audit.id)));
});
test('content updates permitted only to admin, constrained by field type',async()=>{
  await assertSucceeds(setDoc(doc(administrator,'site_content','public'),{texts:{welcome:'Safe synthetic text'}},{merge:true}));
  await assertFails(setDoc(doc(administrator,'site_content','public'),{videos:'malformed'},{merge:true}));
  await assertFails(setDoc(doc(administrator,'site_content','public'),{unexpectedPrivilegedField:true},{merge:true}));
});
test('revoked role denies subsequent reads and writes',async()=>{
  await env.withSecurityRulesDisabled(async ctx=>{
    await updateDoc(doc(ctx.firestore(),'admin_roles','admin1'),{active:false});
  });
  await assertFails(getDocs(collection(administrator,'assessment_requests')));
  await assertFails(addDoc(collection(administrator,'admin_audit'),{
    action:'request.status',targetType:'request',targetId:'legacy1',details:{},
    actorUid:'admin1',actorEmail:'admin@example.invalid',createdAt:serverTimestamp()
  }));
  assert.ok(true);
});
