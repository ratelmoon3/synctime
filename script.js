'use strict';
const STORAGE = 'synctime.session.v2';
const legacyColors = {practice:'#16a34a',shoot:'#ea580c',meeting:'#2563eb',meal:'#d97706',setup:'#64748b',other:'#78716c'};
// Validate custom colors and retain the hue of schedules saved before color selection.
function eventColor(event){return /^#[0-9a-f]{6}$/i.test(event?.color)?event.color:(legacyColors[event?.type]||'#2563eb');}
function colorChoices(event){
 const selected=eventColor(event).toLowerCase();
 const colors=[['#2563eb','파랑'],['#16a34a','초록'],['#ea580c','주황'],['#eab308','노랑'],['#9333ea','보라'],['#64748b','회색']];
 // Preserve an existing custom color while keeping the picker to six choices.
 if(!colors.some(([color])=>color===selected))colors[5]=[selected,'현재 색상'];
 return `<fieldset class="color-picker"><legend>일정 색상</legend><div class="color-options">${colors.map(([color,name])=>`<label class="color-option" title="${name}"><input type="radio" name="color" value="${color}" ${color===selected?'checked':''} aria-label="${name}"><span style="--swatch:${color}" aria-hidden="true">✓</span></label>`).join('')}</div></fieldset>`;
}
function eventColorStyle(event){
 const color=eventColor(event),rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const mix=amount=>'#'+rgb.map(c=>Math.round(c*(1-amount)+255*amount).toString(16).padStart(2,'0')).join('');
 return `--accent:${color};--border:${mix(.55)};--tint:${mix(.91)};--ink:#0f172a`;
}
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => iso(new Date());
const addDays = (s,n) => { const d = new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return iso(d); };
const dateLabel = s => new Date(s+'T12:00:00').toLocaleDateString('ko-KR',{month:'numeric',day:'numeric',weekday:'short'});
const time = n => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
const minutes = s => Number(s.split(':')[0])*60+Number(s.split(':')[1]);
const key = (d,n) => `${d}|${n}`;
// Keep half-hour storage compatible, but an hour is available only when both halves are.
function hourAvailable(slots,date,start){const has=k=>slots instanceof Set?slots.has(k):slots.includes(k);return has(key(date,start))&&has(key(date,start+30));}
function selectedHours(){let count=0;for(const slot of draft){const [date,n]=slot.split('|');if(Number(n)>=540&&Number(n)<1440&&Number(n)%60===0&&hourAvailable(draft,date,Number(n)))count++;}return count;}
let db = {groups:[],recent:[],identities:{}};
let loadError = '';
try{const saved=JSON.parse(sessionStorage.getItem(STORAGE)||'{}');db.recent=saved.recent||[];db.identities=saved.identities||{};db.navigation=saved.navigation||null;}catch{}
let groupId=null, view='timetable', week=0, mobileDate='', draft=new Set(), dirty=false, painting=null;
const mobile = matchMedia('(max-width: 767px)');
const group = () => db.groups.find(g=>g.id===groupId);
const member = () => group()?.members.find(m=>m.id===db.identities[groupId]);
function toast(msg){$('#toast').textContent=msg;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',3200);}
// Only navigation and the current participant ID stay in the browser. All domain data uses API calls.
function persist(){try{sessionStorage.setItem(STORAGE,JSON.stringify({recent:db.recent,identities:db.identities,navigation:db.navigation}));return true;}catch{return false;}}
async function api(url,method='GET',body){const response=await fetch('/api'+url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});if(response.status===204)return null;const data=await response.json();if(!response.ok)throw Error(data.error||'Request failed');return data;}
const safe=fn=>async e=>{try{await fn(e);}catch(err){toast(err.message);}};
function cacheGroup(g){const i=db.groups.findIndex(x=>x.id===g.id);if(i<0)db.groups.push(g);else db.groups[i]=g;return g;}
async function refreshGroup(id=groupId){return cacheGroup(await api('/groups/'+id));}

function modal(title,body){$('#modal').innerHTML=`<div class="modal-head"><h2>${title}</h2><button type="button" data-action="close" aria-label="닫기">×</button></div>${body}`;if(!$('#modal').open)$('#modal').showModal();}
function closeModal(){ $('#modal').close(); }
function manageGroup(){
 const g=group();
 modal('그룹 관리',`<div class="form-stack"><form id="group-settings" class="form-stack"><label>그룹명<input name="name" required maxlength="80" value="${esc(g.name)}"></label><div class="form-grid"><label>시작 날짜<input type="date" name="start" value="${g.start}" required></label><label>종료 날짜<input type="date" name="end" value="${g.end}" required></label></div><button class="primary">그룹 수정 저장</button></form><h3>참여자</h3>${g.members.map(m=>`<div class="manage-row"><span>${esc(m.name)}</span><button class="danger" data-remove-member="${m.id}">삭제</button></div>`).join('')}<h3>장소 관리</h3><form id="add-place" class="manage-row"><input name="name" required maxlength="80" placeholder="장소명"><button>추가</button></form>${(g.places||[]).map(p=>`<form class="manage-row" data-place-id="${p.id}"><input name="name" required maxlength="80" value="${esc(p.name)}" aria-label="장소명"><button>수정</button><button type="button" class="danger" data-remove-place="${p.id}">삭제</button></form>`).join('')}<div class="modal-footer"><button class="danger" data-remove-group="${g.id}">그룹 삭제</button><button data-action="close">닫기</button></div></div>`);
}
document.addEventListener('click',safe(async e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.action==='manage')return manageGroup();
 if(b.dataset.removeGroup){if(!confirm('그룹과 모든 일정·참여 정보를 삭제할까요?'))return;await api('/groups/'+groupId,'DELETE');db.groups=db.groups.filter(g=>g.id!==groupId);db.recent=db.recent.filter(id=>id!==groupId);delete db.identities[groupId];closeModal();home();return;}
 if(b.dataset.removeMember){if(!confirm('참여자와 해당 가능 시간을 삭제할까요?'))return;await api('/groups/'+groupId+'/participants/'+b.dataset.removeMember,'DELETE');if(db.identities[groupId]===b.dataset.removeMember)delete db.identities[groupId];await refreshGroup();loadDraft();render();manageGroup();}
 if(b.dataset.removePlace){await api('/groups/'+groupId+'/places/'+b.dataset.removePlace,'DELETE');await refreshGroup();render();manageGroup();}
}));
document.addEventListener('submit',safe(async e=>{
 const f=e.target;if(!['group-settings','add-place'].includes(f.id)&&!f.dataset.placeId)return;e.preventDefault();const data=new FormData(f);
 if(f.id==='group-settings')await api('/groups/'+groupId,'PATCH',{name:data.get('name'),start:data.get('start'),end:data.get('end')});
 else await api('/groups/'+groupId+'/places'+(f.dataset.placeId?'/'+f.dataset.placeId:''),f.dataset.placeId?'PATCH':'POST',{name:data.get('name')});
 await refreshGroup();week=0;mobileDate='';render();manageGroup();toast('저장했습니다.');
}));
function renderNotes(){return `<section class="schedule-notes"><div class="notes-header"><label for="group-notes">특이사항</label><span id="notes-status" class="hint" role="status"></span><button data-action="save-notes">저장</button></div><textarea id="group-notes" rows="2" maxlength="5000" placeholder="준비물, 전달사항, 주의사항 등을 입력하세요.">${esc(group().notes||'')}</textarea></section>`;}
// Serialize notes requests so older keystrokes never overwrite a newer save.
let notesQueue=Promise.resolve();
async function saveNotes(showToast=false){const g=group(),value=$('#group-notes').value;g.notes=value;
 notesQueue=notesQueue.catch(()=>{}).then(()=>api('/groups/'+g.id,'PATCH',{notes:value}));
 try{await notesQueue;if(groupId===g.id&&$('#notes-status'))$('#notes-status').textContent='Saved';if(showToast)toast('Saved');}catch(err){toast(err.message);}
}
document.addEventListener('input',e=>{if(e.target.id==='group-notes')saveNotes();});
// Save navigation separately from availability edits, so refresh restores the current screen.
function saveNavigation(){db.navigation=groupId?{groupId,view,week,mobileDate}:null;persist();}
function restoreNavigation(){
 const saved=db.navigation,g=db.groups.find(g=>g.id===saved?.groupId);
 if(!g){home();return;}
 groupId=g.id;
 view=['availability','heatmap','timetable','list'].includes(saved.view)?saved.view:'timetable';
 const maxWeek=Math.floor((Date.parse(g.end+'T12:00:00Z')-Date.parse(g.start+'T12:00:00Z'))/(7*86400000));
 week=Number.isInteger(saved.week)?Math.max(0,Math.min(maxWeek,saved.week)):0;
 mobileDate=dates().includes(saved.mobileDate)?saved.mobileDate:dates()[0];
 loadDraft();render();
}
// Invite links carry only group metadata; local participant data stays on the device.
function inviteLink(g=group()){const url=new URL(location.href);url.hash=new URLSearchParams({join:g.code}).toString();return url.href;}
function readInvite(input){let url;try{url=new URL(input,location.href);}catch{return null;}const params=new URLSearchParams(url.hash.slice(1));if(params.has('join'))return {code:params.get('join')};if(params.has('invite'))return JSON.parse(params.get('invite'));return null;}
function shareInvite(){
 const link=inviteLink();
 modal('초대 링크 공유',`<div class="form-stack"><p>링크를 받은 사람이 이름을 입력하면 참여할 수 있습니다.</p><label>초대 링크<input id="invite-link" readonly value="${esc(link)}"></label><div class="hint">같은 그룹의 일정과 가능 시간을 함께 확인할 수 있습니다.</div><div class="modal-footer"><button data-action="close">닫기</button><button class="primary" id="copy-invite">링크 복사</button></div></div>`);
 $('#invite-link').addEventListener('click',e=>e.target.select());
 $('#copy-invite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(link);toast('초대 링크를 복사했습니다.');}catch{$('#invite-link').select();toast('링크를 선택했습니다. 복사해서 전달하세요.');}});
}
function receiveInvite(){const params=new URLSearchParams(location.hash.slice(1));if(!params.has('join')&&!params.has('invite'))return;try{const invite=readInvite(location.href);if(!invite?.code)throw Error();joinForm(location.href);}catch{toast('Invalid invitation link');}}
async function joinGroup(input,name){const invitation=readInvite(input);const g=cacheGroup(await api('/groups/code/'+encodeURIComponent(invitation?.code||input.toUpperCase())));const m=await api('/groups/'+g.id+'/participants','POST',{name});db.identities[g.id]=m.id;persist();try{history.replaceState(null,'',location.pathname+location.search);}catch{}closeModal();await openGroup(g.id);view='availability';loadDraft();render();}
function home(){groupId=null;dirty=false;saveNavigation();$('#breadcrumb').textContent='';$('#app').innerHTML=`<div class="home"><div class="eyebrow">TEAM SCHEDULING WORKSPACE</div><h1>SyncTime</h1><div class="muted">가능한 시간을 모아, 하나의 일정으로.</div><div class="home-actions"><button class="primary" data-action="create">＋ 새 일정 그룹 만들기</button><button data-action="join">기존 그룹 참여하기 →</button></div><h2>최근 참여한 그룹</h2><div class="recent">${db.recent.map(id=>db.groups.find(g=>g.id===id)).filter(Boolean).map(g=>`<button class="group-row" data-open="${g.id}"><span><strong>${esc(g.name)}</strong><span class="muted">${g.start} — ${g.end} · ${g.members.length}명 · ${g.events.length}개 일정</span></span><span>→</span></button>`).join('')||'<div class="empty">아직 참여한 그룹이 없습니다.</div>'}</div>${loadError?`<p class="error">${loadError}</p>`:''}</div>`;}
function createForm(){modal('새 일정 그룹 만들기',`<form id="create-form" class="form-stack"><label>그룹명<input name="name" required maxlength="80" placeholder="예: 프로젝트 X 촬영 / 연습"></label><div class="form-grid"><label>시작 날짜<input type="date" name="start" value="${today()}" required></label><label>종료 날짜<input type="date" name="end" value="${addDays(today(),6)}" required></label></div><label>내 이름<input name="self" required maxlength="40" placeholder="이름"></label><p id="form-error" class="error" role="alert"></p><div class="modal-footer"><button type="button" data-action="close">취소</button><button class="primary">그룹 생성</button></div></form>`);}
function joinForm(code=''){modal('기존 그룹 참여하기',`<form id="join-form" class="form-stack"><label>초대 링크 또는 그룹 코드<input name="code" value="${esc(code)}" required placeholder="초대 링크 붙여넣기"></label><label>사용자 이름<input name="name" required maxlength="40" placeholder="등록된 이름 또는 새 이름"></label><div class="hint">내 이름을 입력해 참여하세요.</div><p id="form-error" class="error" role="alert"></p><div class="modal-footer"><button type="button" data-action="close">취소</button><button class="primary">참여</button></div></form>`);}
async function openGroup(id){await refreshGroup(id);groupId=id;week=0;mobileDate='';view='timetable';db.recent=[id,...db.recent.filter(x=>x!==id)];persist();loadDraft();render();}
function loadDraft(){draft=new Set(member()?.slots||[]);dirty=false;}
function dates(){const g=group();const start=addDays(g.start,week*7);return Array.from({length:7},(_,i)=>addDays(start,i)).filter(d=>d<=g.end);}
function displayedDates(){const ds=dates();if(!ds.includes(mobileDate))mobileDate=ds[0];return mobile.matches?[mobileDate]:ds;}
function render(){const g=group();if(!g)return home();const done=g.members.filter(m=>m.submitted).length;$('#breadcrumb').textContent='/ '+g.name;$('#app').innerHTML=`<div class="workspace"><aside class="sidebar"><div class="eyebrow">WORKSPACE</div><h2>${esc(g.name)}</h2><div class="muted">${g.start} — ${g.end}</div><div class="code"><span>${g.code}</span><button data-action="copy" aria-label="초대 링크 공유">초대 링크</button></div><nav class="nav" aria-label="그룹 화면">${[['availability','◷','내 가능 시간'],['heatmap','▦','전체 가능 시간'],['timetable','▤','타임테이블'],['list','☷','일정 목록']].map(([v,i,t])=>`<button data-view="${v}" class="${view===v?'active':''}">${i} ${t}</button>`).join('')}</nav><div class="people"><div class="muted">참여자 <strong>${g.members.length}</strong> · 입력 ${done}</div>${g.members.map(m=>`<div class="person"><span class="avatar">${esc(m.name[0])}</span><span>${esc(m.name)}</span><small>${m.submitted?'입력 완료':'미입력'}</small></div>`).join('')}<button style="width:100%;margin-top:14px" data-action="copy">초대 링크 공유</button></div></aside><section class="content"><div class="titlebar"><div><div class="eyebrow">${view==='timetable'?'MASTER CALL SHEET':'SYNCTIME / '+({availability:'AVAILABILITY',heatmap:'TEAM HEATMAP',list:'SCHEDULES'}[view])}</div><h1>${{availability:'내 가능 시간',heatmap:'전체 가능 시간표',timetable:'주간 타임테이블',list:'일정 목록'}[view]}</h1><div class="subline">${esc(g.name)} · ${g.start} — ${g.end}</div></div><div class="actions"><button data-action="manage">그룹 관리</button>${view==='availability'?'<button class="primary" data-action="save-slots">✓ 가능 시간 저장</button>':'<button class="primary" data-action="new-event">＋ 일정 만들기</button>'}<button data-action="switch">${esc(member()?.name||'참여자 선택')} ▾</button></div></div>${['timetable','list'].includes(view)?renderNotes():''}${view==='list'?renderList():renderCalendar()}${dirty?'<div class="bottom-note">'+'● 저장하지 않은 가능 시간이 있습니다.'+'</div>':''}</section></div>`;saveNavigation();bindPainting();if(view!=='list'){$('.calendar-scroll').scrollTop=0;}}
function exportTimetablePdf(){
 const g=group();if(!g||view!=='timetable')return;
 const ds=dates(),popup=window.open('','_blank');
 if(!popup){toast('팝업을 허용한 뒤 PDF 저장을 다시 눌러주세요.');return;}
 popup.opener=null;
 popup.onload=()=>{popup.focus();popup.print();};
 const events=g.events.filter(e=>ds.includes(e.date)).sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);
 const notes=$('#group-notes')?.value??g.notes??'';
 const heading=`${g.name} · ${ds[0]} ~ ${ds.at(-1)}`;
 const columns=ds.map(d=>{
  const layout=layoutEvents(events.filter(e=>e.date===d));
  return `<section class="day"><h2>${esc(dateLabel(d))}</h2><div class="lane">${layout.map(({event:e,column,total})=>`<article class="event" style="${eventColorStyle(e)};top:${(e.start-540)/900*100}%;height:${(e.end-e.start)/900*100}%;left:${column/total*100}%;width:${100/total}%"><strong>${esc(e.title)}</strong><span>${time(e.start)}–${time(e.end)}</span><span>${esc(names(e.members).join(', '))}</span></article>`).join('')}</div></section>`;
 }).join('');
 popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(heading)} - SyncTime</title><style>
 @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font:11px system-ui,sans-serif;color:#0f172a;margin:0}h1{font-size:20px;margin:0 0 5px}p{margin:0 0 10px;color:#475569}.controls{margin-bottom:16px;display:flex;gap:12px;align-items:center}button{padding:8px 14px;cursor:pointer}.grid{display:grid;grid-template-columns:12mm repeat(${ds.length},minmax(0,1fr));border:1px solid #cbd5e1;break-inside:avoid}.day{min-width:0;border-left:1px solid #cbd5e1}h2{height:8mm;margin:0;text-align:center;font-size:11px;padding:2mm;background:#f1f5f9}.lane{height:145mm;position:relative;background:repeating-linear-gradient(to bottom,white 0,white calc(100% / 15 - 1px),#e2e8f0 calc(100% / 15 - 1px),#e2e8f0 calc(100% / 15))}.times{height:145mm;display:grid;grid-template-rows:repeat(15,1fr)}.times span{font-size:9px;text-align:center;border-top:1px solid #e2e8f0;padding-top:2px}.event{position:absolute;border:1px solid var(--border);border-left:3px solid var(--accent);background:var(--tint);padding:2px;overflow:hidden;font-size:8px}.event strong,.event span{display:block;overflow-wrap:anywhere}.end{margin:3px 0;font-size:9px}.details{margin-top:12px}.details h2{text-align:left;height:auto;padding:6px}.details article{break-inside:avoid;border-bottom:1px solid #e2e8f0;padding:7px 0}.details p,.notes{white-space:pre-wrap;overflow-wrap:anywhere}.notes{margin-top:12px;break-inside:avoid}small{color:#64748b}@media print{.controls{display:none}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
 </style></head><body><div class="controls"><button onclick="window.print()">PDF로 저장 / 인쇄</button><small>인쇄 대상에서 ‘PDF로 저장’을 선택하세요. 현재 주 전체를 저장합니다.</small></div><h1>${esc(g.name)}</h1><p>주간 타임테이블 · ${esc(ds[0])} ~ ${esc(ds.at(-1))} · 09:00–24:00 (KST)</p><div class="grid"><div><h2>시간</h2><div class="times">${Array.from({length:15},(_,i)=>`<span>${time(540+i*60)}</span>`).join('')}</div></div>${columns}</div><div class="end">24:00</div>${notes?`<div class="notes"><strong>특이사항</strong><div>${esc(notes)}</div></div>`:''}<section class="details"><h2>일정 상세 · ${events.length}개</h2>${events.map(e=>`<article><strong>${esc(dateLabel(e.date))} ${time(e.start)}–${time(e.end)} · ${esc(e.title)}</strong><div>참여자: ${esc(names(e.members).join(', '))}</div>${e.description?`<p>${esc(e.description)}</p>`:''}</article>`).join('')||'<p>등록된 일정이 없습니다.</p>'}</section></body></html>`);
 popup.document.close();
}
function toolbar(){const g=group(),ds=dates();return `<div class="toolbar"><button data-action="prev" ${week===0?'disabled':''} aria-label="이전 주">‹</button><span class="range">${dateLabel(ds[0])} — ${dateLabel(ds.at(-1))}</span><button data-action="next" ${addDays(g.start,(week+1)*7)>g.end?'disabled':''} aria-label="다음 주">›</button><span class="spacer"></span>${view==='timetable'?'<button data-action="export-pdf">↓ PDF 저장</button><span class="muted">1시간 단위 · 드래그로 일정 생성</span>':view==='availability'?'<span class="muted">클릭 / 드래그로 선택 · 1시간 단위</span><button data-action="clear-slots">이번 주 해제</button>':'<span class="muted">시간 칸을 선택해 일정 생성</span>'}<select class="mobile-day" id="mobile-date" aria-label="표시 날짜">${ds.map(d=>`<option value="${d}" ${mobileDate===d?'selected':''}>${dateLabel(d)}</option>`).join('')}</select></div>`;}
function renderCalendar(){const g=group(),ds=displayedDates(),isFinal=view==='timetable',cols=ds.length;const done=g.members.filter(m=>m.submitted).length;
let html=toolbar();html+=view==='heatmap'?`<div class="stats"><span>전체 <strong>${g.members.length}명</strong></span><span>입력 완료 <strong>${done}명</strong></span><span>미입력 <strong>${g.members.length-done}명</strong></span><span>미입력은 가능 인원에 포함하지 않습니다.</span></div><div class="legend">가능 인원 적음 ${['#f8fafc','#eff6ff','#bae6fd','#60a5fa','#2563eb','#1d4ed8'].map(c=>`<span style="background:${c};width:22px;height:12px;border:1px solid #cbd5e1"></span>`).join('')} 전원 가능</div>`:isFinal?`<div class="legend"><span style="margin-left:auto">확정 일정 ${g.events.length}개</span></div>`:`<div class="stats">${esc(member()?.name||'참여자를 선택하세요')} · 선택 <strong id="slot-count">${selectedHours()}</strong>칸 <span id="draft-status">${member()?.submitted?'저장된 입력을 수정할 수 있습니다.':'아직 저장하지 않았습니다.'}</span></div>`;
html+=`<div class="calendar-scroll"><div class="calendar ${!isFinal?'availability':''}" style="grid-template-columns:56px repeat(${cols},minmax(${isFinal?134:100}px,1fr));grid-template-rows:${isFinal?'38px 960px':'38px repeat(15,64px)'}"><div class="corner" style="grid-row:1">TIME<br><small>KST</small></div>`;
ds.forEach((d,i)=>{html+=`<div class="dayhead ${d===today()?'today':''}" style="grid-column:${2+i};grid-row:1">${dateLabel(d)}</div>`;});
if(isFinal){html+='<div style="grid-column:1;grid-row:2;z-index:3;position:sticky;left:0">'+Array.from({length:15},(_,i)=>`<div class="time hour" style="height:64px">${time(540+i*60)}</div>`).join('')+'</div>';ds.forEach((d,i)=>{const events=g.events.filter(e=>e.date===d&&e.end>540&&e.start<1440).sort((a,b)=>a.start-b.start||a.end-b.end);const layout=layoutEvents(events);html+=`<div class="lane" data-lane-date="${d}" style="grid-row:2;grid-column:${2+i}">${layout.map(({event:e,column,total})=>`<button class="event" data-event="${e.id}" style="${eventColorStyle(e)};top:${(Math.max(540,e.start)-540)/60*64}px;height:${(Math.min(1440,e.end)-Math.max(540,e.start))/60*64-2}px;left:calc(${column/total*100}% + 2px);width:calc(${100/total}% - 4px)" title="${esc(`${e.title} / ${time(e.start)}-${time(e.end)} / ${names(e.members).join(', ')}${e.description?' / '+e.description:''}`)}"><strong>${esc(e.title)}</strong><span class="event-summary">${time(e.start)}-${time(e.end)} · ${esc(names(e.members).join(', '))}</span>${e.description?`<span class="event-description">${esc(e.description)}</span>`:''}</button>`).join('')}</div>`;});}
else for(let n=540;n<1440;n+=60){html+=`<div class="time ${n%60?'':'hour'}">${time(n)}</div>`;for(const d of ds){const selected=hourAvailable(draft,d,n),count=g.members.filter(m=>hourAvailable(m.slots,d,n)).length,r=count/g.members.length;const color=r===1?'#1d4ed8':r>=.75?'#2563eb':r>=.5?'#60a5fa':r>=.25?'#bae6fd':r>0?'#eff6ff':'#f8fafc';const slot=`<button class="slot ${view==='availability'&&selected?'selected':''} ${view==='heatmap'&&r===1?'full':''}" data-date="${d}" data-minute="${n}" ${view==='availability'?`aria-pressed="${selected}"`:`style="background:${color};color:${r>=.75?'white':'#334155'}"`} aria-label="${dateLabel(d)} ${time(n)} ${view==='heatmap'?count+'/'+g.members.length+'명 가능':selected?'선택됨':'선택 안 됨'}">${view==='availability'?(selected?'✓':''):count+'/'+g.members.length}</button>`;html+=view==='heatmap'?`<div class="heatmap-cell">${slot}${heatmapEvents(d,n)}</div>`:slot;}}
return html+'</div></div>'+(isFinal&&!g.events.length?'<div class="notice">시간표의 빈칸을 클릭하거나 ‘일정 만들기’로 첫 일정을 추가하세요.</div>':'');}
// Overlapping events share their venue lane without covering each other.
function layoutEvents(events){const result=[];let cluster=[],end=-1;const flush=()=>{const ends=[];for(const e of cluster){let c=ends.findIndex(n=>n<=e.start);if(c<0)c=ends.length;ends[c]=e.end;result.push({event:e,column:c,cluster});}const total=ends.length;result.filter(x=>x.cluster===cluster).forEach(x=>x.total=total);cluster=[];};for(const e of events){if(cluster.length&&e.start>=end)flush();cluster.push(e);end=Math.max(cluster.length===1?0:end,e.end);}flush();return result;}
function names(ids){return group().members.filter(m=>ids.includes(m.id)).map(m=>m.name);}
// Show saved schedules inside each affected heatmap hour without hiding its availability count.
function heatmapEvents(date,start){
 const events=group().events.filter(e=>e.date===date&&e.start<start+60&&e.end>start).sort((a,b)=>a.start-b.start);
 if(!events.length)return '';
 return `<div class="heatmap-events">${events.map(e=>`<button class="heatmap-event" data-event="${e.id}" style="${eventColorStyle(e)}" title="${esc(`${e.title} · ${time(e.start)}–${time(e.end)} · ${names(e.members).join(', ')}${e.description?' / '+e.description:''}`)}" aria-label="${esc(e.title)} ${time(e.start)}–${time(e.end)} 수정"><strong>${esc(e.title)}</strong><span>${time(e.start)}–${time(e.end)}</span></button>`).join('')}</div>`;
}
function renderList(query=''){const events=[...group().events].sort((a,b)=>a.date.localeCompare(b.date)||a.start-b.start);const filtered=events.filter(e=>[e.title,...names(e.members)].join(' ').toLowerCase().includes(query.toLowerCase()));let last='',rows='';for(const e of filtered){if(e.date!==last){last=e.date;rows+=`<h3 class="list-day">${dateLabel(e.date)}</h3>`;}rows+=`<article class="list-event" style="${eventColorStyle(e)}"><span>${time(e.start)}–${time(e.end)}</span><div class="details"><strong>${esc(e.title)}</strong><span class="muted">${esc(names(e.members).join(', '))}</span></div><div class="actions"><button data-event="${e.id}">수정</button><button class="danger" data-delete="${e.id}">삭제</button></div></article>`;}return `<input id="search" class="search" placeholder="일정명, 참여자 검색" aria-label="일정 검색" value="${esc(query)}"><div class="stats">확정 일정 <strong>${events.length}개</strong> · 총 운영 시간 <strong>${events.reduce((s,e)=>s+(e.end-e.start)/60,0)}시간</strong></div><div id="list-results">${rows||'<div class="empty">표시할 일정이 없습니다.</div>'}</div>`;}
function timeOptions(value,end=false){const values=Array.from({length:end?16:15},(_,i)=>540+i*60);if(Number(value)>=540&&Number(value)<=1440&&!values.includes(Number(value)))values.push(Number(value));return values.sort((a,b)=>a-b).map(n=>`<option value="${n}" ${Number(value)===n?'selected':''}>${time(n)}</option>`).join('');}
function eventForm(id=null,date=null,start=540,selectedEnd=null){const g=group(),e=g.events.find(e=>e.id===id);date=e?.date||date||dates()[0];start=e?.start??start;const end=e?.end??selectedEnd??Math.min(start+60,1440);const members=e?.members||g.members.map(m=>m.id);modal(e?'일정 수정':'새 일정 만들기',`<form id="event-form" data-id="${e?.id||''}" class="form-stack"><label>일정명<input name="title" value="${esc(e?.title||'')}" required maxlength="100" placeholder="일정명 입력"></label><label>일정 설명<textarea name="description" rows="3" maxlength="2000" placeholder="준비물, 진행 내용 등을 입력하세요.">${esc(e?.description||'')}</textarea></label><div class="form-grid"><label>날짜<input type="date" name="date" min="${g.start}" max="${g.end}" value="${date}" required></label>${colorChoices(e)}<label>시작 시간<select name="start">${timeOptions(start)}</select></label><label>종료 시간<select name="end">${timeOptions(end,true)}</select></label></div><label>참여자</label><div class="checks">${g.members.map(m=>`<label><input type="checkbox" name="members" value="${m.id}" ${members.includes(m.id)?'checked':''}>${esc(m.name)}</label>`).join('')}</div><div id="conflict" aria-live="polite"></div><p id="form-error" class="error" role="alert"></p><div class="modal-footer">${e?`<button type="button" class="danger" data-delete="${e.id}">일정 삭제</button>`:''}<button type="button" data-action="close">취소</button><button class="primary" id="event-save">저장</button></div></form>`);updateConflict();}
function eventData(){const f=$('#event-form'),data=new FormData(f);return {id:f.dataset.id||uid(),title:String(data.get('title')).trim(),description:String(data.get('description')||'').trim(),date:data.get('date'),start:Number(data.get('start')),end:Number(data.get('end')),color:eventColor({color:data.get('color')}),members:data.getAll('members')};}
// Availability is checked across every half-hour, never only the starting cell.
function conflicts(e){const g=group(),unavailable=g.members.filter(m=>e.members.includes(m.id)&&(!m.submitted||Array.from({length:Math.max(0,(e.end-e.start)/30)},(_,i)=>key(e.date,e.start+i*30)).some(k=>!m.slots.includes(k))));const overlaps=g.events.filter(x=>x.id!==e.id&&x.date===e.date&&x.start<e.end&&e.start<x.end&&x.members.some(id=>e.members.includes(id)));return {unavailable,overlaps};}
function updateConflict(){const e=eventData(),{unavailable,overlaps}=conflicts(e),warn=unavailable.length||overlaps.length;$('#conflict').innerHTML=warn?`<div class="warning"><strong>${e.members.length}명 중 ${e.members.length-unavailable.length}명 가능</strong>${unavailable.length?`<p>불가능 / 미입력: ${esc(unavailable.map(m=>m.name+(m.submitted?'':' (미입력)')).join(', '))}</p>`:''}${overlaps.length?`<p>참여자 일정 겹침: ${esc(overlaps.map(x=>x.title).join(', '))}</p>`:''}<button type="button" data-action="other-time">다른 시간 선택</button></div>`:`<div class="notice">${e.members.length}명 중 ${e.members.length}명 가능</div>`;$('#event-save').textContent=warn?'그래도 저장':'저장';}
function deleteEvent(id){const e=group().events.find(e=>e.id===id);modal('일정 삭제',`<p>‘${esc(e.title)}’ 일정을 삭제할까요?</p><div class="modal-footer"><button data-action="close">취소</button><button class="danger" data-confirm-delete="${id}">삭제</button></div>`);}
async function saveSlots(){const m=member();if(!m)return joinForm(group().code);await api('/groups/'+groupId+'/participants/'+m.id+'/availability','PUT',{slots:[...draft].filter(k=>Number(k.split('|')[1])>=540)});await refreshGroup();loadDraft();render();toast('Saved');}

function allowNavigation(){return !dirty||confirm('저장하지 않은 가능 시간이 있습니다. 변경 내용을 버리고 이동할까요?');}
// Pointer painting supports mouse, pen and touch; keyboard activation toggles one cell.
function paint(cell){if(!cell?.matches('.slot')||view!=='availability'||!member())return;const k=key(cell.dataset.date,Number(cell.dataset.minute));for(const n of [Number(cell.dataset.minute),Number(cell.dataset.minute)+30]){const slotKey=key(cell.dataset.date,n);if(painting.value)draft.add(slotKey);else draft.delete(slotKey);}cell.classList.toggle('selected',painting.value);cell.setAttribute('aria-pressed',String(painting.value));cell.textContent=painting.value?'✓':'';dirty=true;$('#slot-count').textContent=selectedHours();$('#draft-status').textContent='● 변경됨 · 저장 필요';}
function bindPainting(){const grid=$('.availability');if(!grid||view!=='availability')return;grid.addEventListener('pointerdown',e=>{const cell=e.target.closest('.slot');if(!cell)return;if(!member())return joinForm(group().code);painting={value:!hourAvailable(draft,cell.dataset.date,Number(cell.dataset.minute))};paint(cell);try{cell.releasePointerCapture(e.pointerId);}catch{}e.preventDefault();});grid.addEventListener('pointermove',e=>{if(painting)paint(document.elementFromPoint(e.clientX,e.clientY));});}
document.addEventListener('pointerup',()=>painting=null);document.addEventListener('pointercancel',()=>painting=null);
let scheduleDrag=null,suppressScheduleClick=false;
function scheduleRange(start,current){return {start:Math.min(start,current),end:Math.max(start,current)+60};}
function dragMinute(e,lane){return Math.max(540,Math.min(1380,540+Math.floor((e.clientY-lane.getBoundingClientRect().top)/64)*60));}
function showScheduleRange(){
 const drag=scheduleDrag,{start,end}=scheduleRange(drag.start,drag.current);
 document.querySelectorAll('.range-selected').forEach(c=>c.classList.remove('range-selected'));
 document.querySelector('.range-preview')?.remove();
 if(drag.lane){const preview=document.createElement('div');preview.className='range-preview';preview.style.top=((start-540)/60*64)+'px';preview.style.height=((end-start)/60*64)+'px';preview.textContent=time(start)+'–'+time(end);drag.lane.append(preview);}
 else document.querySelectorAll(`.slot[data-date="${drag.date}"]`).forEach(c=>{const n=Number(c.dataset.minute);c.classList.toggle('range-selected',n>=start&&n<end);});
}
function clearScheduleRange(){document.querySelectorAll('.range-selected').forEach(c=>c.classList.remove('range-selected'));document.querySelector('.range-preview')?.remove();scheduleDrag=null;}
// Capture the pointer so a fast drag, reverse drag, or release outside a cell keeps its range.
document.addEventListener('pointerdown',e=>{
 if(e.button!==0||!['timetable','heatmap'].includes(view)||$('#modal').open)return;
 const lane=e.target.closest('.lane'),cell=e.target.closest('.slot');
 if(e.target.closest('[data-event]')||(!lane&&!cell))return;
 const target=lane||cell,start=lane?dragMinute(e,lane):Number(cell.dataset.minute);
 scheduleDrag={date:lane?lane.dataset.laneDate:cell.dataset.date,start,current:start,lane,pointerId:e.pointerId,target,moved:false};
 target.setPointerCapture(e.pointerId);showScheduleRange();e.preventDefault();
});
document.addEventListener('pointermove',e=>{
 if(!scheduleDrag||scheduleDrag.pointerId!==e.pointerId)return;
 const drag=scheduleDrag;
 if(drag.lane)drag.current=dragMinute(e,drag.lane);
 else{const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.slot');if(cell?.dataset.date===drag.date)drag.current=Number(cell.dataset.minute);}
 drag.moved=drag.moved||drag.current!==drag.start;showScheduleRange();
});
document.addEventListener('pointerup',e=>{
 if(!scheduleDrag||scheduleDrag.pointerId!==e.pointerId)return;
 const drag=scheduleDrag,range=scheduleRange(drag.start,drag.current),create=!!drag.lane||drag.moved;
 if(drag.target.hasPointerCapture(e.pointerId))drag.target.releasePointerCapture(e.pointerId);
 clearScheduleRange();
 if(create){suppressScheduleClick=true;setTimeout(()=>suppressScheduleClick=false,400);eventForm(null,drag.date,range.start,range.end);}
});
document.addEventListener('pointercancel',clearScheduleRange);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&scheduleDrag)clearScheduleRange();});
document.addEventListener('click',safe(async e=>{if(suppressScheduleClick){suppressScheduleClick=false;return;}const b=e.target.closest('button');if(b){if(b.dataset.open){if(allowNavigation())await openGroup(b.dataset.open);return;}if(b.dataset.view){if(!allowNavigation())return;view=b.dataset.view;loadDraft();render();return;}if(b.dataset.event){eventForm(b.dataset.event);return;}if(b.dataset.delete){deleteEvent(b.dataset.delete);return;}if(b.dataset.confirmDelete){await api('/groups/'+groupId+'/events/'+b.dataset.confirmDelete,'DELETE');await refreshGroup();closeModal();render();toast('일정을 삭제했습니다.');return;}const a=b.dataset.action;if(a==='home'){if(allowNavigation())home();}else if(a==='create')createForm();else if(a==='join')joinForm();else if(a==='close')closeModal();else if(a==='switch'){if(allowNavigation())joinForm(group().code);}else if(a==='copy'){shareInvite();}else if(a==='save-notes')await saveNotes(true);else if(a==='save-slots')await saveSlots();else if(a==='export-pdf')exportTimetablePdf();else if(a==='new-event')eventForm();else if(a==='prev'||a==='next'){week+=a==='next'?1:-1;render();}else if(a==='clear-slots'){dates().forEach(d=>{for(let n=0;n<1440;n+=30)draft.delete(key(d,n));});dirty=true;render();}else if(a==='other-time'){$('#event-form [name="date"]').focus();}else if(b.matches('.slot')){if(view==='heatmap'){const d=b.dataset.date,n=Number(b.dataset.minute),g=group();const available=g.members.filter(m=>hourAvailable(m.slots,d,n));modal(`${dateLabel(d)} · ${time(n)}–${time(n+60)}`,`<div class="form-stack"><div class="notice"><strong>${available.length}/${g.members.length}명 가능</strong></div><div><h3>가능한 사람</h3><p>${esc(available.map(m=>m.name).join(', ')||'없음')}</p></div><div><h3>불가능한 사람 / 미입력</h3><p>${esc(g.members.filter(m=>!available.includes(m)).map(m=>m.name+(m.submitted?'':' (미입력)')).join(', ')||'없음')}</p></div><div class="modal-footer"><button data-action="close">닫기</button><button class="primary" data-create-date="${d}" data-create-minute="${n}">이 시간에 일정 생성</button></div></div>`);}else if(view==='availability'&&e.detail===0){painting={value:!hourAvailable(draft,b.dataset.date,Number(b.dataset.minute))};paint(b);painting=null;}}if(b.dataset.createDate)eventForm(null,b.dataset.createDate,Number(b.dataset.createMinute));}
}));
document.addEventListener('change',e=>{if(e.target.closest('#event-form'))updateConflict();if(e.target.id==='mobile-date'){mobileDate=e.target.value;render();}});
document.addEventListener('input',e=>{if(e.target.id==='search'){const val=e.target.value;const holder=document.createElement('div');holder.innerHTML=renderList(val);$('#list-results').innerHTML=holder.querySelector('#list-results').innerHTML;}});
document.addEventListener('submit',safe(async e=>{e.preventDefault();const f=e.target,data=new FormData(f),error=msg=>$('#form-error').textContent=msg;
try{
 if(f.id==='create-form'){const result=await api('/groups','POST',{name:String(data.get('name')).trim(),self:String(data.get('self')).trim(),start:data.get('start'),end:data.get('end')});db.identities[result.groupId]=result.participantId;persist();closeModal();await openGroup(result.groupId);view='availability';render();shareInvite();}
 else if(f.id==='join-form')await joinGroup(String(data.get('code')).trim(),String(data.get('name')).trim());
 else if(f.id==='event-form'){const ev=eventData();if(!ev.title)return error('Enter a schedule title');if(ev.end<=ev.start)return error('End time must follow start time');if(!ev.members.length)return error('Select participants');await api('/groups/'+groupId+'/events'+(f.dataset.id?'/'+f.dataset.id:''),f.dataset.id?'PUT':'POST',ev);await refreshGroup();closeModal();render();toast('Saved');}
}catch(err){error(err.message);}
}));
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
mobile.addEventListener('change',()=>{if(group())render();});
bootstrap();
window.addEventListener('hashchange',()=>{if(allowNavigation())receiveInvite();});

async function bootstrap(){
 $('#app').innerHTML='<div class="empty">Loading...</div>';
 try{const list=await api('/groups');const ids=new Set(db.recent);if(db.navigation?.groupId)ids.add(db.navigation.groupId);const available=list.filter(g=>ids.has(g.id));db.groups=await Promise.all(available.map(g=>api('/groups/'+g.id)));db.recent=db.recent.filter(id=>db.groups.some(g=>g.id===id));restoreNavigation();receiveInvite();}catch(err){loadError=err.message;home();}
}
// Refresh shared data when returning to the tab, without discarding unsaved availability.
window.addEventListener('focus',safe(async()=>{if(!groupId||dirty||$('#modal').open||document.activeElement?.id==='group-notes')return;await refreshGroup();loadDraft();render();}));
