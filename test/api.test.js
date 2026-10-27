const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const request=require('supertest');
const app=require('../server');
const pool=require('../db');
after(()=>pool.end());
test('static allowlist blocks credentials and backend source',async()=>{
 await request(app).get('/').expect(200).expect('Content-Type',/html/);
 for(const p of ['/.env','/db.js','/server.js','/package.json','/node_modules/pg/package.json'])await request(app).get(p).expect(404);
});
test('API rejects invalid input before querying the database',async()=>{
 await request(app).get('/api/groups/not-an-id').expect(400);
 await request(app).post('/api/groups').send({name:'',self:'A',start:'2026-10-27',end:'2026-10-28'}).expect(400);
 await request(app).post('/api/groups/1/events').send({title:'Invalid',date:'2026-10-27',start:480,end:600}).expect(400);
 await request(app).put('/api/groups/1/participants/1/availability').send({slots:'bad'}).expect(400);
});
test('Neon end-to-end CRUD and relationships',{skip:process.env.LIVE_DB_TESTS!=='1'},async()=>{
 await request(app).get('/api/health').expect(200);
 let id;
 try{
  const created=await request(app).post('/api/groups').send({name:'SyncTime automated check '+Date.now(),self:'Tester A',start:'2026-10-27',end:'2026-11-02'}).expect(201);
  id=created.body.groupId;const member=created.body.participantId;const base='/api/groups/'+id;
  let g=(await request(app).get(base).expect(200)).body;assert.equal(g.members.length,1);
  await request(app).get('/api/groups/code/'+g.code).expect(200);
  await request(app).patch(base).send({name:'Updated test',notes:'Test notes'}).expect(200);
  const second=(await request(app).post(base+'/participants').send({name:'Tester B'}).expect(201)).body;
  const joined=(await request(app).post(base+'/participants').send({name:'Tester B'}).expect(201)).body;assert.equal(second.id,joined.id);
  await request(app).get(base+'/participants').expect(200);
  const av=base+'/participants/'+member+'/availability';
  await request(app).put(av).send({slots:['2026-10-27|540','2026-10-27|570']}).expect(200);
  assert.equal((await request(app).get(av).expect(200)).body.slots.length,2);
  await request(app).put(av).send({slots:['2026-10-27|600','2026-10-27|630']}).expect(200);
  await request(app).put(av).send({slots:['2026-10-26|540']}).expect(400);
  assert.equal((await request(app).get(av)).body.slots.length,2,'failed replacement rolls back');
  const place=(await request(app).post(base+'/places').send({name:'Test room'}).expect(201)).body;
  await request(app).patch(base+'/places/'+place.id).send({name:'Updated room'}).expect(200);
  await request(app).get(base+'/places').expect(200);
  const body={title:'Schedule',description:'Line 1\nLine 2',date:'2026-10-27',start:600,end:720,color:'#9333ea',place_id:place.id,members:[member,second.id]};
  const event=(await request(app).post(base+'/events').send(body).expect(201)).body;
  await request(app).get(base+'/events').expect(200);
  let e=(await request(app).get(base+'/events/'+event.id).expect(200)).body;assert.equal(e.description,body.description);assert.equal(e.members.length,2);
  await request(app).put(base+'/events/'+event.id).send({...body,title:'Edited',end:1440}).expect(200);
  await request(app).put(base+'/events/'+event.id+'/participants').send({members:[member]}).expect(200);
  assert.equal((await request(app).get(base+'/events/'+event.id+'/participants')).body.length,1);
  await request(app).delete(base+'/places/'+place.id).expect(204);
  e=(await request(app).get(base+'/events/'+event.id)).body;assert.equal(e.place_id,null);
  g=(await request(app).get(base)).body;assert.equal(g.notes,'Test notes');assert.equal(g.members[0].submitted,true);
  await request(app).delete(base+'/events/'+event.id).expect(204);
  await request(app).delete(base+'/participants/'+second.id).expect(204);
 }finally{if(id)await request(app).delete('/api/groups/'+id).expect(204);}
 await request(app).get('/api/groups/'+id).expect(404);
});
