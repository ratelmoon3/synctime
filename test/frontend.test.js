const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('frontend restores API data and sends availability to the participant endpoint',async()=>{
 const calls=[],listeners={},nodes={};
 const g={id:'11',name:'Shared group',code:'SYNC-ABC123',start:'2026-10-27',end:'2026-11-02',notes:'Shared notes',places:[],members:[{id:'22',name:'Member',submitted:true,slots:['2026-10-27|540','2026-10-27|570']}],events:[]};
 const session={recent:['11'],identities:{'11':'22'},navigation:{groupId:'11',view:'heatmap',week:0,mobileDate:'2026-10-27'}};
 const c={URL,URLSearchParams,Date,Math,Set,Map,Number,String,Array,Object,JSON,Error,location:new URL('https://synctime.example/'),sessionStorage:{getItem:()=>JSON.stringify(session),setItem(){}},document:{querySelector:s=>nodes[s]||={innerHTML:'',textContent:'',style:{},open:false,addEventListener(){}},addEventListener:(type,fn)=>(listeners[type]||=[]).push(fn)},matchMedia:()=>({matches:false,addEventListener(){}}),window:{addEventListener(){}},setTimeout:()=>0,clearTimeout(){},fetch:async(url,options)=>{calls.push({url,...options});let data;if(url==='/api/groups')data=[g];else if(options.method==='PUT')data={ok:true};else data=g;return {ok:true,status:200,json:async()=>structuredClone(data)};}};
 vm.createContext(c);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8'),c);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(vm.runInContext('groupId',c),'11');assert.equal(vm.runInContext('view',c),'heatmap');assert(nodes['#app'].innerHTML.includes('Shared group'));
 await vm.runInContext('saveSlots()',c);
 const save=calls.find(x=>x.method==='PUT');assert.equal(save.url,'/api/groups/11/participants/22/availability');assert.deepEqual(JSON.parse(save.body).slots,g.members[0].slots);
 assert(vm.runInContext('inviteLink()',c).includes('join=SYNC-ABC123'));
 assert(!fs.readFileSync(require('node:path').join(__dirname,'../script.js'),'utf8').includes('localStorage'));
 // Export every day of the current week even on mobile, and escape user content.
 let exported='';
 c.window.open=()=>({opener:c.window,document:{write:html=>exported=html,close(){}},focus(){},print(){}});
 vm.runInContext(`view='timetable';mobile.matches=true;group().events=[{id:'33',title:'<script>alert(1)</script>',description:'Full description',date:'2026-10-27',start:540,end:600,color:'#2563eb',members:['22']}];exportTimetablePdf()`,c);
 assert.equal((exported.match(/class="day"/g)||[]).length,7);
 assert(exported.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
 assert(!exported.includes('<script>alert(1)</script>'));
 assert(exported.includes('Full description'));
 assert(exported.includes('A4 landscape'));
 c.window.open=()=>null;
 assert.doesNotThrow(()=>vm.runInContext('exportTimetablePdf()',c));
});
