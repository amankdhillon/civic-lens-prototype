const TITLES={feed:'Feed',find:'Find my districts',bodies:'Bodies',body:'Body',meetings:'Meetings',calendar:'My calendar',meeting:'Meeting',boards:'Your discussion boards',allboards:'All discussion boards',board:'Discussion board',thread:'Thread',item:'Agenda item',favorites:'Favorites'};
const NAV_ON={feed:'feed',find:'find',bodies:'bodies',body:'bodies',meetings:'meetings',meeting:'meetings',calendar:'calendar',boards:'boards',allboards:'boards',board:'boards',thread:'boards',item:'meetings',favorites:'favorites'};

const state={screen:'signin',user:'',error:'',addr:null,page:'feed',navOpen:true,toggles:{fed:true,county:true,city:true,school:true,cpg:true},
  bodyId:null,meetingId:null,boardKey:null,threadId:null,query:'',boardQuery:'',drafts:{},followed:{},seq:100,
  calendar:[],menuFor:null,itemId:null,customEx:{},favItems:{},favBoards:{},remote:{threads:[],posts:[]},me:null,ready:false,postError:''};

/* ---------- helpers ---------- */
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
const fmtShort=d=>d?new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
const isPast=m=>m.date<TODAY;
const byAsc=(a,b)=>a.date.localeCompare(b.date);
const byDesc=(a,b)=>b.date.localeCompare(a.date);
const splitKey=k=>{const i=k.indexOf(':');return [k.slice(0,i),k.slice(i+1)];};
const dbScope=k=>{const [t,id]=splitKey(k);return [t==='meet'?'meeting':t,id];};
const boardFor=k=>{
  const [scope,id]=dbScope(k);
  const threads=state.remote.threads.filter(t=>t.scope_kind===scope&&t.scope_id===id).map(t=>({
    id:t.id,title:t.title,kind:t.kind,
    posts:state.remote.posts.filter(p=>p.thread_id===t.id).map(p=>({who:p.author_name,text:p.body,t:p.created_at.slice(0,10)})),
  }));
  return {threads};
};
const threadLast=t=>t.posts.length?t.posts[t.posts.length-1].t:'';
const postCount=k=>boardFor(k).threads.reduce((n,t)=>n+t.posts.length,0);
const whenLabel=d=>{const x=new Date(d+'T12:00:00');return{wd:x.toLocaleDateString('en-US',{weekday:'short'}),day:x.toLocaleDateString('en-US',{month:'short',day:'numeric'})};};
const explainCount=k=>boardFor(k).threads.filter(x=>x.kind==='information').length;
const commentCount=k=>boardFor(k).threads.filter(x=>x.kind!=='information').length;
const actLine=k=>{const st=boardStats(k),n=postCount(k);return `${st.count} thread${st.count===1?'':'s'} · ${n} post${n===1?'':'s'}${st.last?` · last post ${fmtShort(st.last)}`:''}`;};
const boardStats=k=>{const th=boardFor(k).threads;const last=th.reduce((m,t)=>threadLast(t)>m?threadLast(t):m,'');return{count:th.length,last};};
const findMeeting=id=>MEETINGS.find(m=>m.id===id);
const findItem=id=>{for(const m of MEETINGS){const it=m.items.find(i=>i.id===id);if(it)return{m,it};}return null;};
const scopeBodyIds=()=>{
  if(!state.addr) return [];
  const base=WORKING.filter(l=>state.toggles[l]).map(l=>DIST[state.addr.d[l]].body);
  return Object.keys(BODIES).filter(b=>base.includes(b)||(BODIES[b].parent&&base.includes(BODIES[b].parent)));
};
const scopedMeetings=()=>{const s=scopeBodyIds();return MEETINGS.filter(m=>s.includes(m.body));};
const mine=id=>!!state.addr&&Object.values(state.addr.d).includes(id);

function boardInfo(k){
  const [type,id]=splitKey(k);
  if(type==='topic'){const t=TOPICS.find(x=>x.id===id);return{type,title:t?t.title:id,scope:'Citywide topic',sub:'A conversation on this topic across the city.'};}
  if(type==='body'){const b=BODIES[id];return{type,title:b.name,scope:kindLabel(b),sub:b.about};}
  if(type==='group'){const b=BODIES[id];return{type,title:b.name,scope:'Community group',sub:b.about};}
  if(type==='place'){return{type,title:DIST[id].label+' board',scope:'Council district',sub:'Neighbors in this district talk about local decisions.'};}
  if(type==='meet'){const m=findMeeting(id);return{type,title:`${BODIES[m.body].name}, ${fmtDate(m.date)}`,scope:'Meeting discussion',sub:meetingSummary(m)};}
  if(type==='item'){const f=findItem(id);return{type,title:f.it.title,scope:'Community review comments',sub:f.it.summary};}
  return{type,title:id,scope:type,sub:''};
}
function allBoardKeys(){
  const keys=new Set([
    ...TOPICS.map(t=>'topic:'+t.id),
    ...Object.keys(BODIES).filter(b=>BODIES[b].kind!=='community').map(b=>'body:'+b),
    ...Object.keys(BODIES).filter(b=>BODIES[b].kind==='community').map(b=>'group:'+b),
    ...Object.keys(DIST).filter(d=>d.startsWith('sdcc-')).map(d=>'place:'+d),
    ...MEETINGS.flatMap(m=>m.items.map(i=>'item:'+i.id)),
    ...state.remote.threads.map(t=>(t.scope_kind==='meeting'?'meet':t.scope_kind)+':'+t.scope_id)
  ]);
  return [...keys].filter(knownKey);
}
function inScope(k){
  const [type,id]=splitKey(k);
  if(type==='topic') return true;
  if(!state.addr) return false;
  if(type==='body'||type==='group') return scopeBodyIds().includes(id);
  if(type==='place') return Object.values(state.addr.d).includes(id);
  if(type==='meet') return scopeBodyIds().includes(findMeeting(id).body);
  if(type==='item') return scopeBodyIds().includes(findItem(id).m.body);
  return false;
}
const boardRow=k=>{
  const info=boardInfo(k);
  return `<div class="brow">
    <div class="brow-main"><button class="linkish" data-act="board" data-key="${esc(k)}">${esc(info.title)}</button>
      <div class="muted small">${esc(info.scope)} · ${actLine(k)}</div></div>
    <div class="brow-act">${inScope(k)?'<span class="tag">In your area</span>':''}
      <button class="${state.followed[k]?'':'ghost'}" data-act="follow" data-key="${esc(k)}" aria-pressed="${!!state.followed[k]}">${state.followed[k]?'Following':'Follow'}</button>${starBoardBtn(k)}</div>
  </div>`;
};

/* ---------- screens ---------- */
function viewSignin(){
  return `<div class="signin"><div class="card"><h1>Civic Lens</h1><p class="muted">Prototype sign-in. Enter a username. No password is needed.</p>
    <label for="username" class="small">Username</label>
    <input id="username" placeholder="For example, Dana" value="${esc(state.user)}" autocomplete="off">
    <div class="err" role="alert">${esc(state.error)}</div><div style="margin-top:6px"><button data-act="signin">Continue</button></div></div></div>`;
}

const knownKey=k=>{const [t,id]=splitKey(k);if(t==='topic')return TOPICS.some(x=>x.id===id);if(t==='body')return !!BODIES[id];if(t==='place')return !!DIST[id];if(t==='meet')return !!findMeeting(id);return false;};
const kindLabel=b=>b.label||(b.kind==='committee'?'Subcommittee':b.kind==='board'?'Board or commission':'Governing body');
const ICON={
  feed:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  pin:'<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  building:'<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h2M13 9h2M9 13h2M13 13h2M10 21v-4h4v4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 16l2 2 4-4"/>',
  star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
};
const svgIcon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const meetingSummary=m=>m.items.length?`${m.items.length} item${m.items.length===1?'':'s'} on the agenda: ${m.items.map(i=>i.title).join('; ')}.`:'Agenda items have not been checked yet.';
const parentMeeting=k=>{const [t,id]=splitKey(k);if(t==='meet')return findMeeting(id);if(t==='item'){const f=findItem(id);return f?f.m:null;}return null;};
function backLink(k){
  const pm=parentMeeting(k);
  return pm?`<button class="ghost" data-act="meeting" data-id="${pm.id}" style="margin-bottom:10px">← Back to meeting</button>`
           :`<button class="ghost" data-act="page" data-id="boards" style="margin-bottom:10px">← Your boards</button>`;
}
// A meeting can only be added to the calendar. Its discussion lives on the body's board.
function addControls(m){
  const cal=state.calendar.includes(m.id);
  return `<button class="${cal?'ghost':''}" data-act="tocal" data-id="${m.id}" aria-pressed="${cal}">${cal?'Remove from calendar':'Add to calendar'}</button>`;
}

function meetingRow(m){
  const cal=state.calendar.includes(m.id), w=whenLabel(m.date), n=m.items.length;
  return `<div class="mrow ${isPast(m)?'past':''}"><div class="mdate"><span>${esc(w.wd)}</span><b>${esc(w.day)}</b></div>
    <div class="mtext"><button class="linkish" data-act="meeting" data-id="${m.id}">${esc(m.title)}</button>
      <div class="muted small">${esc(BODIES[m.body].name)} · ${esc(m.time)} · ${n} agenda item${n===1?'':'s'}</div>
      ${cal?'<span class="tag cal">On your calendar</span>':''}</div>
    <div class="mact">${addControls(m)}</div></div>`;
}
function listMeetings(ms){return ms.map(meetingRow).join('');}
function persist(){
  try{ localStorage.setItem('civic.followed',JSON.stringify(state.followed)); localStorage.setItem('civic.calendar',JSON.stringify(state.calendar)); }catch(e){}
}

// Feed = what the person follows. Community groups are left out of the prototype feed.
const bodyOfKey=k=>{const [t,id]=splitKey(k);if(t==='body')return id;if(t==='place'&&DIST[id])return DIST[id].body;if(t==='meet'){const m=findMeeting(id);return m?m.body:null;}if(t==='item'){const f=findItem(id);return f?f.m.body:null;}return null;};
const isCommunityKey=k=>{const [t]=splitKey(k);if(t==='group')return true;const b=bodyOfKey(k);return !!b&&!!BODIES[b]&&BODIES[b].kind==='community';};
const feedKeys=()=>Object.keys(state.followed).filter(k=>state.followed[k]&&!isCommunityKey(k)&&knownKey(k));
const followedBodyIds=()=>[...new Set(feedKeys().map(bodyOfKey).filter(b=>b&&BODIES[b]))];
const feedMeetings=()=>{const ids=followedBodyIds();const direct=feedKeys().filter(k=>k.startsWith('meet:')).map(k=>splitKey(k)[1]);return MEETINGS.filter(m=>ids.includes(m.body)||direct.includes(m.id)||state.calendar.includes(m.id));};
// Baseline follows for a new person: county board, city council, and their council district.
const baselineFollows=addr=>({['body:'+DIST[addr.d.county].body]:true,['body:'+DIST[addr.d.city].body]:true,['place:'+addr.d.city]:true});

// Feed cards. Official records and community discussion look different: official cards have a navy rule and a label; discussion cards have a dashed rule and a label.
function feedMeetingCard(m){
  const w=whenLabel(m.date), n=m.items.length, fin=m.items.filter(i=>i.action==='Final decision').length, first=m.items[0], mk='meet:'+m.id;
  return `<article class="fi official">
    <div class="fi-date"><span>${esc(w.wd)}</span><b>${esc(w.day)}</b><span>${esc(m.time)}</span></div>
    <div class="fi-body">
      <p class="eyebrow">Upcoming meeting · ${esc(BODIES[m.body].name)}</p>
      <h3><button class="linkish" data-act="meeting" data-id="${m.id}">${esc(m.title)}</button></h3>
      <p>${n?`${n} agenda item${n===1?'':'s'}${fin?`, ${fin} final vote${fin===1?'':'s'} by this body`:''}: ${esc(m.items.slice(0,2).map(i=>i.title).join('; '))}${n>2?'; and more':''}.`:'The agenda has not been posted yet.'}</p>
      ${first?`<p class="small"><b>What it could do:</b> ${esc(first.stakes)}</p>`:''}
      <div class="fi-foot">${addControls(m)}<button class="ghost" data-act="meeting" data-id="${m.id}">Open meeting</button></div>
    </div></article>`;
}
function feedDecisionCard(m,i){
  const w=whenLabel(m.date), ik='item:'+i.id;
  return `<article class="fi official">
    <div class="fi-date"><span>${esc(w.wd)}</span><b>${esc(w.day)}</b></div>
    <div class="fi-body">
      <p class="eyebrow">Decision · ${esc(BODIES[m.body].name)}</p>
      <h3><button class="linkish" data-act="meeting" data-id="${m.id}">${esc(i.title)}</button></h3>
      <p>${esc(i.summary)}</p>
      <p class="small"><b>What it did:</b> ${esc(i.stakes)}</p>
      <div class="fi-foot"><span class="tag ok">Result: ${esc(i.result)}</span><button class="ghost" data-act="item" data-id="${i.id}">Explanations and comments (${explainCount(ik)} explanation${explainCount(ik)===1?'':'s'})</button></div>
    </div></article>`;
}
function feedDiscussionCard(k){
  const info=boardInfo(k), st=boardStats(k), threads=boardFor(k).threads;
  const last=threads.flatMap(t=>t.posts.map(p=>({...p,thread:t}))).sort((a,b)=>b.t.localeCompare(a.t))[0];
  return `<article class="fi community">
    <div class="fi-date"><b>${threads.length}</b><span>thread${threads.length===1?'':'s'}</span></div>
    <div class="fi-body">
      <p class="eyebrow">Community discussion · ${esc(info.scope)}</p>
      <h3><button class="linkish" data-act="board" data-key="${esc(k)}">${esc(info.title)}</button></h3>
      ${last?`<p class="small"><b>${esc(last.who)}</b>, ${esc(fmtShort(last.t))}: ${esc(last.text)}</p>`:'<p class="small muted">No posts yet. Start the first thread.</p>'}
      <div class="fi-foot"><span class="muted small">${actLine(k)}</span><button class="ghost" data-act="board" data-key="${esc(k)}">Open discussion</button></div>
    </div></article>`;
}

const persistFavs=()=>{try{localStorage.setItem('civic.favItems',JSON.stringify(state.favItems));localStorage.setItem('civic.favBoards',JSON.stringify(state.favBoards));}catch(e){}};
const starItemBtn=id=>{const on=!!state.favItems[id];const l=on?'Remove from favorites':'Save to favorites';return `<button class="star ${on?'on':''}" data-act="staritem" data-id="${esc(id)}" aria-pressed="${on}" aria-label="${l}" title="${l}">${on?'★':'☆'}</button>`;};

const starBoardBtn=k=>{if(k.startsWith('item:'))return '';const on=!!state.favBoards[k];const l=on?'Remove from favorites':'Save to favorites';return `<button class="star ${on?'on':''}" data-act="starboard" data-key="${esc(k)}" aria-pressed="${on}" aria-label="${l}" title="${l}">${on?'★':'☆'}</button>`;};

const legendHtml=()=>`<div class="legend" aria-label="Color key"><span class="tag up">Upcoming</span><span class="tag ok">Passed or result</span><span class="tag final">Final vote</span><span class="tag adv">Advisory</span><span class="tag exp">Explanation</span><span class="tag">Comment</span></div>`;

function viewFeed(){
  if(!state.addr) return `<section class="card"><h1>Welcome, ${esc(state.user)}</h1><p class="muted">Find your districts first. Your feed shows meetings and decisions for the bodies that represent you.</p><div class="bar"><button data-act="page" data-id="find">Find my districts</button></div></section>`;
  const ms=feedMeetings();
  const up=ms.filter(m=>!isPast(m)).sort(byAsc).slice(0,3);
  const decisions=ms.filter(isPast).sort(byDesc).flatMap(m=>m.items.filter(i=>i.result).map(i=>({m,i}))).slice(0,2);
  return `${legendHtml()}
    <section class="card"><h2>Coming up</h2>${up.length?up.map(feedMeetingCard).join(''):'<p class="muted">No upcoming meetings for what you follow. <button class="linkish" data-act="page" data-id="meetings">Browse meetings</button></p>'}</section>
    <section class="card"><h2>Recent decisions</h2>${decisions.length?decisions.map(({m,i})=>feedDecisionCard(m,i)).join(''):'<p class="muted">No recent decisions for what you follow yet.</p>'}</section>`;
}

function viewFavorites(){
  const items=Object.keys(state.favItems).filter(id=>state.favItems[id]).map(id=>findItem(id)).filter(Boolean).sort((x,y)=>x.m.date.localeCompare(y.m.date));
  const boards=Object.keys(state.favBoards).filter(k=>state.favBoards[k]&&knownKey(k)&&!k.startsWith('item:'));
  const itemRows=items.map(({m,it})=>{
    const ik='item:'+it.id, past=isPast(m), ex=explainCount(ik), cm=commentCount(ik);
    return `<div class="fav-row"><div class="fav-main"><p class="eyebrow">${esc(BODIES[m.body].name)} · ${fmtDate(m.date)}</p>
      <button class="linkish" data-act="item" data-id="${it.id}">${esc(it.title)}</button>
      <p class="tags"><span class="tag ${past?'prev':'up'}">${past?'Previous':'Upcoming'}</span>${it.result?`<span class="tag ok">Result: ${esc(it.result)}</span>`:''}</p>
      <div class="muted small">${ex} explanation${ex===1?'':'s'} · ${cm} comment${cm===1?'':'s'}</div></div>
      <div class="fav-act"><button data-act="item" data-id="${it.id}">Open item</button>${starItemBtn(it.id)}</div></div>`;
  }).join('');
  const boardRows=boards.map(k=>{const info=boardInfo(k);return `<div class="fav-row"><div class="fav-main"><button class="linkish" data-act="board" data-key="${esc(k)}">${esc(info.title)}</button><div class="muted small">${esc(info.scope)} · ${actLine(k)}</div></div><div class="fav-act"><button data-act="board" data-key="${esc(k)}">Open board</button>${starBoardBtn(k)}</div></div>`;}).join('');
  return `<section class="card"><h1>Favorites</h1><p class="muted">Agenda items and discussion boards you saved for quick access. Saving is separate from following a board. Saving does not send updates.</p></section>
    <section class="card"><h2>Saved agenda items</h2>${itemRows||'<p class="muted">No saved items yet. Open an agenda item and choose Save item.</p>'}</section>
    <section class="card"><h2>Saved discussion boards</h2>${boardRows||'<p class="muted">No saved boards yet. Open a board and choose Save board.</p>'}</section>`;
}

function viewFind(){
  return `<div class="card"><h1>Find my districts</h1><p class="muted">Search a San Diego address. Prototype: only the sample addresses match until the geocoder is added.</p>
    <label for="q" class="small">Address</label>
    <input id="q" placeholder="Type a San Diego address" value="${esc(state.query)}" autocomplete="off">
    <div id="results" style="margin-top:10px">${findResults()}</div></div>`;
}
function findResults(){
  const q=state.query.trim().toLowerCase();
  const rows=ADDRESSES.filter(a=>!q||a.full.toLowerCase().includes(q));
  if(!rows.length) return '<p class="muted">No sample address matches. Try "Sample".</p>';
  return rows.map(a=>`<div class="card"><b>${esc(a.full)}</b>
    <div class="small" style="margin:8px 0">${Object.keys(LEVEL_LABEL).map(l=>`${esc(LEVEL_LABEL[l])}: ${esc(DIST[a.d[l]].rep)} <span class="muted">(${esc(DIST[a.d[l]].label)})</span>`).join('<br>')}</div>
    <button data-act="choose" data-id="${a.id}">Use this address</button></div>`).join('');
}

function bodyRow(id,nested=false){
  const b=BODIES[id];
  const badge=inScope('body:'+id)||inScope('group:'+id)?'<span class="tag ok">Your area</span>':'';
  return `<div class="row ${nested?'nested':''}"><div><button class="linkish" data-act="body" data-id="${id}">${esc(b.name)}</button>
    <div class="muted small">${esc(b.about)}</div></div><span>${badge}</span></div>`;
}
function viewBodies(){
  const levels=['Federal','State','County','City','School'];
  const intro='<div class="card"><h1>Your bodies</h1><p class="muted">The governing bodies that represent you. Each one has meetings, agenda items, and a discussion board.</p><p class="muted small">'+esc(DATA_NOTICE)+'</p></div>';
  return intro+levels.map(level=>{
    const ids=Object.keys(BODIES).filter(b=>BODIES[b].level.toLowerCase()===level.toLowerCase()&&!BODIES[b].parent&&BODIES[b].kind!=='community');
    if(!ids.length) return '';
    return `<div class="card"><h2>${esc(level)}</h2>${ids.map(id=>bodyRow(id)+Object.keys(BODIES).filter(c=>BODIES[c].parent===id).map(c=>bodyRow(c,true)).join('')).join('')}</div>`;
  }).join('');
}

// Join vs follow. Follow: anyone can follow any board. Join: your address puts you in the district, so you can post there.
const canPost=k=>{
  if(!state.addr) return false;
  const [t,id]=splitKey(k);
  if(t==='topic') return true;
  if(t==='place') return mine(id);
  const body=t==='body'?id:bodyOfKey(k);
  return !!body && Object.values(state.addr.d).some(p=>DIST[p].body===body);
};
const joinTag=k=>canPost(k)?'<span class="tag ok">Joined: you can post</span>':'<span class="tag">Follow only</span>';
function districtSection(p){
  const d=DIST[p], yours=mine(p), key='place:'+p, fol=!!state.followed[key];
  return `<details class="dist" ${yours?'open':''}>
    <summary><b>${esc(d.label)}</b><span class="muted"> · ${esc(d.rep)}</span> ${yours?'<span class="tag ok">Joined: your district</span>':'<span class="tag">Follow only</span>'}</summary>
    <div class="dist-body">${d.note?`<p class="small">${esc(d.note)}</p>`:''}
      <div class="bar"><button data-act="board" data-key="${esc(key)}">Open district board</button>
      <button class="${fol?'':'ghost'}" data-act="follow" data-key="${esc(key)}" aria-pressed="${fol}">${fol?'Following':'Follow'}</button></div>
      ${yours?'':'<p class="muted small">You can read and follow this board. Only people in this district can post.</p>'}
    </div></details>`;
}
function viewBody(){
  const b=BODIES[state.bodyId];
  const ms=MEETINGS.filter(m=>m.body===state.bodyId);
  const key='body:'+state.bodyId, fol=!!state.followed[key];
  const up=ms.filter(m=>!isPast(m)).sort(byAsc), prev=ms.filter(isPast).sort(byDesc);
  const districts=Object.keys(DIST).filter(p=>DIST[p].body===state.bodyId);
  const roster=b.roster&&b.roster.length
    ? `<h2 style="margin-top:14px">Members</h2>`+b.roster.map(r=>`<div class="row"><div><b>${esc(r.name)}</b><div class="muted small">${esc(r.role)}</div></div></div>`).join('')
    : '';
  const facts=[b.schedule&&`<b>Schedule:</b> ${esc(b.schedule)}`, b.where&&`<b>Where:</b> ${esc(b.where)}`, b.address&&`<b>Address:</b> ${esc(b.address)}`]
    .filter(Boolean).map(x=>`<p class="small">${x}</p>`).join('');
  const src=b.source
    ? `<p class="muted small">Source: <a href="${esc(b.source)}" target="_blank" rel="noopener">official page</a>, checked ${esc(b.checked||'')}. Verify before relying on it.</p>`
    : '<p class="muted small">Sample or not yet checked. Verify before relying on it.</p>';
  const seats=districts.length
    ? `<h2 style="margin-top:14px">Districts</h2><p class="muted small">Every district board can be read and followed. You are joined to your own district by your address, so only those boards accept your posts.</p>${districts.map(districtSection).join('')}`
    : '';
  return `<div class="card"><button class="ghost" data-act="page" data-id="bodies" style="margin-bottom:10px">← Back to bodies</button>
    <h1>${esc(b.name)}</h1><p>${esc(b.about)}</p>
    <span class="tag">${esc(kindLabel(b))}</span>
    ${inScope(key)?'<span class="tag ok">In your area</span>':''}
    ${facts}
    <div class="bar" style="margin-top:10px">
      <button data-act="board" data-key="${esc(key)}">Open discussion board</button>
      <button class="ghost" data-act="follow" data-key="${esc(key)}" aria-pressed="${fol}">${fol?'Following':'Follow'}</button>
    </div>
    ${seats}
    <h2 style="margin-top:14px">Upcoming meetings</h2>${up.length?listMeetings(up):'<p class="muted">No upcoming meetings listed on the checked calendar.</p>'}
    <h2 style="margin-top:14px">Previous meetings</h2>${prev.length?listMeetings(prev):'<p class="muted">No previous meetings listed on the checked calendar.</p>'}
    ${roster}
    ${src}</div>`;
}

function viewMeetings(){
  if(!state.addr) return `<div class="card"><p class="muted">Set your address on Find my districts to see meetings for your bodies.</p></div>`;
  const ms=scopedMeetings();
  if(!ms.length) return `<div class="card"><p class="muted">Turn on at least one district in the sidebar to see meetings.</p></div>`;
  const up=ms.filter(m=>!isPast(m)).sort(byAsc);
  const prev=ms.filter(isPast).sort(byDesc);
  return `<div class="card"><h2>Upcoming</h2>${listMeetings(up)||'<p class="muted">No upcoming meetings.</p>'}</div>
    <div class="card"><h2>Previous</h2>${listMeetings(prev)||'<p class="muted">No previous meetings.</p>'}</div>`;
}

// Threads about a meeting are on its body's board, titled "Dec 1 meeting: ...".
function meetingThreads(m){return boardFor('body:'+m.body).threads.filter(th=>th.title.startsWith(fmtShort(m.date)+' meeting:'));}
function viewMeeting(){
  const m=findMeeting(state.meetingId);
  if(!m) return `<section class="card"><p class="muted">No meeting selected. Open one from Meetings.</p></section>`;
  const past=isPast(m), b=BODIES[m.body], cal=state.calendar.includes(m.id);
  const fin=m.items.filter(i=>i.action==='Final decision').length;
  const resulted=m.items.filter(i=>i.result).length;
  const overview=m.items.length
    ? `${m.items.length} agenda item${m.items.length===1?'':'s'}: ${fin} final vote${fin===1?'':'s'} by this body and ${m.items.length-fin} advisory.${past&&resulted?` ${resulted} ${resulted===1?'has a':'have'} a recorded result.`:''}`
    : 'The agenda has not been loaded for this meeting.';
  const items=m.items.map((it,i)=>{
    const ik='item:'+it.id, isFinal=it.action==='Final decision', ex=explainCount(ik), cm=commentCount(ik);
    return `<li class="agenda-item"><span class="ai-num" aria-hidden="true">${i+1}</span><div class="ai-main">
      <h3>${esc(it.title)}</h3>
      <p class="tags"><span class="tag ${isFinal?'final':'adv'}">${isFinal?'Final vote by this body':'Advisory'}</span>${past?(it.result?`<span class="tag ok">Passed or result: ${esc(it.result)}</span>`:''):'<span class="tag up">Upcoming</span>'}</p>
      <p>${esc(it.summary)}</p>
      <p class="small"><b>${past?'What it did':'What it could do'}:</b> ${esc(it.stakes)}</p>
      <p class="small"><b>Accountable:</b> ${esc(it.accountable||'Not yet recorded.')}</p>
      <div class="bar">${starItemBtn(it.id)}<button data-act="item" data-id="${it.id}">Open item: ${ex} explanation${ex===1?'':'s'}, ${cm} comment${cm===1?'':'s'}</button></div>
    </div></li>`;
  }).join('');
  const threads=meetingThreads(m);
  const tl=threads.length?threads.map(th=>`<div class="brow"><div class="brow-main"><button class="linkish" data-act="thread" data-key="body:${esc(m.body)}" data-id="${esc(th.id)}">${esc(th.title)}</button>
      <div class="muted small">${th.posts.length} post${th.posts.length===1?'':'s'} · last post ${esc(fmtShort(threadLast(th)))}</div></div></div>`).join('')
    :'<p class="muted">No threads about this meeting yet.</p>';
  return `<section class="card">
      <button class="ghost" data-act="page" data-id="meetings" style="margin-bottom:14px">← Back to meetings</button>
      <p class="eyebrow">${esc(b.name)}</p>
      <h1>${esc(m.title)}</h1>
      <p class="meta">${fmtDate(m.date)} · ${esc(m.time)}${b.where?` · ${esc(b.where)}`:''}</p>
      <p class="tags"><span class="tag ${past?'prev':'up'}">${past?'Previous':'Upcoming'}</span>${cal?'<span class="tag cal">On your calendar</span>':''}</p>
      <div class="bar">${addControls(m)}</div>
    </section>
    <section class="card"><h2>Overview</h2><p>${esc(overview)}</p>
      <p class="muted small">${m.source?`Source: <a href="${esc(m.source)}" target="_blank" rel="noopener">City Clerk meetings calendar</a>, checked ${esc(m.checked||'')}. Verify before relying on it.`:'Sample schedule and agenda for this prototype. Not from an official source.'}</p></section>
    <section class="card"><h2>Agenda</h2><p class="muted small">Open an item to read its plain summary, who is accountable, and residents' explanations. Comments on an item stay with that item.</p>
      ${items?`<ol class="agenda">${items}</ol>`:'<p class="muted">Agenda items have not been loaded for this meeting yet.</p>'}</section>
    <section class="card zone-community"><h2>Discussion about this meeting</h2>
      <p class="muted small">Threads about the whole meeting are on the ${esc(b.name)} board.</p>
      ${tl}
      <div class="bar"><button class="ghost" data-act="meetthread" data-id="${m.id}">Start a thread about this meeting</button></div></section>`;
}

function viewCalendar(){
  const ms=state.calendar.map(id=>findMeeting(id)).filter(Boolean).sort(byAsc);
  if(!ms.length) return `<div class="card"><h1>My calendar</h1><p class="muted">Meetings you add appear here and in your feed. Use the + beside any meeting, then choose Add to calendar.</p><button class="ghost" data-act="page" data-id="meetings">Browse meetings</button></div>`;
  return `<div class="card"><h1>My calendar</h1><p class="muted">Meetings you added. They also appear in your feed.</p>${listMeetings(ms)}</div>`;
}

function boardsHtml(){
  const q=state.boardQuery.trim().toLowerCase();
  const order=['body','topic','place'];
  const titles={body:'Bodies',meet:'Meetings',topic:'Citywide topics',place:'Your districts'};
  return order.map(type=>{
    const keys=allBoardKeys().filter(k=>k.startsWith(type+':')).filter(k=>!q||boardInfo(k).title.toLowerCase().includes(q));
    if(!keys.length) return '';
    return `<div class="card"><h2>${esc(titles[type])}</h2>${keys.map(boardRow).join('')}</div>`;
  }).join('')||'<div class="card"><p class="muted">No boards match that search.</p></div>';
}
function viewBoards(){
  const keys=feedKeys().sort((a,b)=>boardStats(b).last.localeCompare(boardStats(a).last));
  const list=keys.length?keys.map(boardRow).join(''):'<p class="muted">You are not following any boards yet. Follow a body, a meeting, or a topic and it appears here.</p>';
  return `<div class="card"><h1>Your discussion boards</h1><p class="muted">The boards you follow, most recent activity first.</p>${list}
    <div class="bar" style="margin-top:12px"><button class="ghost" data-act="page" data-id="allboards">See all boards</button></div></div>`;
}
function viewAllBoards(){
  return `<div class="card"><button class="ghost" data-act="page" data-id="boards" style="margin-bottom:10px">← Your boards</button>
      <h1>All discussion boards</h1><p class="muted">Boards are where people talk. Follow a board to see it on your boards page. You can post only in boards that cover your districts.</p>
      <label for="bq" class="small">Search boards</label>
      <input id="bq" value="${esc(state.boardQuery)}" placeholder="For example, streets or budget" autocomplete="off"></div>
    <div id="board-list">${boardsHtml()}</div>`;
}

// Explanation prompts. Every prompt is optional except the official link. Answer what you know; skip the rest.
const EX_FIELDS=[
  ['who','Who is affected','Groups or places most affected, such as renters on one block.',false],
  ['acc','Who is accountable','Who decides and who carries it out. The item page lists this too.',false],
  ['change','What will change','What would be built, funded, or changed, in plain words.',false],
  ['where','Where you will see it','Streets, parks, or services where people will notice.',false],
  ['when','When you will see it','The timeline from the official item, or that it is not known yet.',false],
  ['goal','The stated goal','What problem the item says it solves.',false],
  ['how','How to take part','Where to speak, send a written comment, or check the record.',false],
  ['source','Official link','Link to the agenda item or staff report. Must start with https://',true]
];
const EX_LABEL=Object.fromEntries(EX_FIELDS.map(([f,l])=>[f,l]));
const exKey=(k,f)=>'ex:'+k+':'+f;

async function postEx(k){
  const err=document.getElementById('newerr');
  const get=f=>(state.drafts[exKey(k,f)]||'').trim();
  if(!get('source')){ if(err) err.textContent='Add the official link. Every other question is optional.'; return; }
  if(!/^https:\/\/\S+$/.test(get('source'))){ if(err) err.textContent='The official link must start with https://'; return; }
  const f=findItem(splitKey(k)[1]); if(!f) return;
  const answered=EX_FIELDS.filter(([fl])=>get(fl)).map(([fl])=>EX_LABEL[fl]+': '+get(fl));
  const extra=(state.customEx[k]||[]).map(c=>c.q+': '+c.a);
  const body=[...answered,...extra].join('\n\n');
  // Keep whatever the person had typed in the comment form, and put it back after posting.
  const saved={t:state.drafts['newtitle:'+k],b:state.drafts['newbody:'+k],kd:state.drafts['newkind:'+k]};
  state.drafts['newtitle:'+k]='Explanation: '+f.it.title;
  state.drafts['newbody:'+k]=body;
  state.drafts['newkind:'+k]='information';
  await postNewThread(k);
  const posted=state.drafts['newbody:'+k]===undefined;
  for(const [key,val] of [['newtitle:'+k,saved.t],['newbody:'+k,saved.b],['newkind:'+k,saved.kd]]){ if(val===undefined) delete state.drafts[key]; else state.drafts[key]=val; }
  if(posted){ EX_FIELDS.forEach(([fl])=>delete state.drafts[exKey(k,fl)]); delete state.customEx[k]; }
  else render();
}

// One collapsible row per prompt. Open a row to answer it. A row you leave empty is simply not answered.
function exComposer(k){
  const rows=EX_FIELDS.map(([f,label,help,req])=>{
    const v=(state.drafts[exKey(k,f)]||'').trim();
    const status=v?'<span class="tag ok">Answered</span>':(req?'<span class="tag no">Required</span>':'<span class="tag">Optional</span>');
    return `<details class="prompt" ${v?'open':''}>
      <summary><span>${esc(label)}</span>${status}</summary>
      <div class="prompt-body"><p class="muted small">${esc(help)}</p>
        <textarea rows="2" aria-label="${esc(label)}" data-draft="${esc(exKey(k,f))}">${esc(state.drafts[exKey(k,f)]||'')}</textarea>
        <div class="bar"><button class="ghost" data-act="exskip" data-key="${esc(k)}" data-id="${f}">Skip this question</button></div></div></details>`;
  }).join('');
  const mine=(state.customEx[k]||[]).map((c,i)=>`<div class="exq"><b>${esc(c.q)}</b><p class="small">${esc(c.a)}</p><button class="ghost" data-act="exdel" data-key="${esc(k)}" data-id="${i}">Remove</button></div>`).join('');
  const add=`<details class="prompt"><summary><span>Add your own question and answer</span><span class="tag">Optional</span></summary>
      <div class="prompt-body">
        <label for="cq-${esc(k)}">Question</label>
        <input id="cq-${esc(k)}" data-draft="excq:${esc(k)}" value="${esc(state.drafts['excq:'+k]||'')}" autocomplete="off">
        <label for="ca-${esc(k)}" style="display:block;margin-top:8px">Answer</label>
        <textarea id="ca-${esc(k)}" rows="2" data-draft="exca:${esc(k)}">${esc(state.drafts['exca:'+k]||'')}</textarea>
        <div class="bar"><button class="ghost" data-act="excadd" data-key="${esc(k)}">Add to explanation</button></div></div></details>`;
  return rows+mine+add;
}

function viewItem(){
  const f=findItem(state.itemId);
  if(!f) return `<section class="card"><p class="muted">That agenda item could not be found.</p></section>`;
  const {m,it}=f, k='item:'+it.id, past=isPast(m), final=it.action==='Final decision';
  const threads=boardFor(k).threads;
  const ex=threads.filter(x=>x.kind==='information'), com=threads.filter(x=>x.kind!=='information');
  const canWrite=canPost(k);
  const exList=ex.length?ex.map(x=>`<details class="ex">
      <summary><span class="tag exp">Explanation</span> ${esc(x.title)} <span class="muted small">· ${esc(x.posts[0]?.who||'')}, ${esc(fmtShort(x.posts[0]?.t||''))}</span></summary>
      <div class="ex-body">${x.posts.map(p=>`<div class="pre">${esc(p.text)}</div>`).join('')}
        <p class="muted small">Replies to an explanation stay in its thread.</p>
        <button class="ghost" data-act="thread" data-key="${esc(k)}" data-id="${x.id}">Open thread and reply</button></div></details>`).join('')
    :'<p class="muted">No explanations yet. Write the first one below.</p>';
  const comList=com.length?com.map(x=>`<div class="brow"><div class="brow-main"><button class="linkish" data-act="thread" data-key="${esc(k)}" data-id="${x.id}">${esc(x.title)}</button>
      <div class="muted small">${esc(KIND_LABEL[x.kind])} · ${x.posts.length} post${x.posts.length===1?'':'s'} · last post ${esc(fmtShort(threadLast(x)))}</div></div></div>`).join('')
    :'<p class="muted">No comments yet.</p>';
  const canWriteEx=canWrite;
  const writeBlock=canWriteEx
    ? `${exComposer(k)}<div class="bar"><button data-act="postex" data-key="${esc(k)}">Post explanation</button></div>`
    : '<p class="muted small">Only people whose districts cover this item can post. You can read explanations and follow the item.</p>';
  const kindNow=state.drafts['newkind:'+k]||'question';
  const commentBlock=canWrite
    ? `<div class="exf"><label for="nt">Title</label><input id="nt" data-draft="newtitle:${esc(k)}" value="${esc(state.drafts['newtitle:'+k]||'')}" placeholder="Your question or comment" autocomplete="off"></div>
       <div class="exf"><label for="nk">Type</label><select id="nk" data-draft="newkind:${esc(k)}">${[['question','Question'],['opinion','Opinion']].map(([v,l])=>`<option value="${v}" ${kindNow===v?'selected':''}>${l}</option>`).join('')}</select></div>
       <div class="exf"><label for="nb">Comment</label><textarea id="nb" rows="3" data-draft="newbody:${esc(k)}">${esc(state.drafts['newbody:'+k]||'')}</textarea></div>
       <div class="bar"><button class="ghost" data-act="newthread" data-key="${esc(k)}">Post comment</button></div>`
    : '';
  return `<div id="newerr" class="err" role="alert"></div>
    <section class="card">
      <button class="ghost" data-act="meeting" data-id="${m.id}" style="margin-bottom:14px">← Back to the ${esc(fmtDate(m.date))} meeting</button>
      <p class="eyebrow">${esc(BODIES[m.body].name)} · ${esc(m.title)} · ${fmtDate(m.date)}</p>
      <h1>${esc(it.title)}</h1><div class="bar">${starItemBtn(it.id)}</div>
      <p class="tags"><span class="tag ${final?'final':'adv'}">${final?'Final vote by this body':'Advisory'}</span>${past?(it.result?`<span class="tag ok">Passed or result: ${esc(it.result)}</span>`:''):'<span class="tag up">Upcoming</span>'}</p>
    </section>
    <section class="card zone-official"><h2>What this item does</h2>
      <p>${esc(it.summary)}</p>
      <p><b>${past?'What it did':'What it could do'}:</b> ${esc(it.stakes)}</p>
      <p class="muted small">The plain summary was written for this prototype. Check the official agenda item before relying on it.</p></section>
    <section class="card"><h2>Who is accountable</h2><p>${esc(it.accountable||'Not yet recorded for this item.')}</p></section>
    <section class="card zone-community"><h2>Explanations from residents</h2>
      <p class="muted small">Answer the questions you can. Only the official link is required. Residents write explanations, not the city.</p>
      ${exList}
      <h3 style="margin-top:22px">Write an explanation</h3>
      ${writeBlock}</section>
    <section class="card zone-community"><h2>Comments and questions</h2>
      <p class="muted small">Comments are open conversation for questions and opinions. An explanation sets out what the item does. Replies go in the thread.</p>
      ${comList}
      <h3 style="margin-top:22px">Start a comment</h3>
      ${commentBlock}</section>`;
}

const KINDS=[['question','Question'],['information','Information, with a source'],['opinion','Opinion']];
const KIND_LABEL=Object.fromEntries(KINDS);
function viewBoard(){
  const info=boardInfo(state.boardKey), st=boardStats(state.boardKey);
  const f=state.boardKey, post=canPost(f);
  const threads=boardFor(f).threads;
  const list=threads.length?threads.map(t=>`<div class="thread"><button class="linkish" data-act="thread" data-key="${esc(f)}" data-id="${t.id}">${esc(t.title)}</button>
      <div class="bar" style="margin-top:4px"><span class="tag">${esc(KIND_LABEL[t.kind])}</span><span class="muted small">${t.posts.length} post${t.posts.length===1?'':'s'} · last activity ${esc(fmtShort(threadLast(t)))}</span></div></div>`).join('')
    :`<p class="muted">No threads yet.${post?' Start the first one below.':''}</p>`;
  const dt=state.drafts['newtitle:'+f]||'', db=state.drafts['newbody:'+f]||'', dk=state.drafts['newkind:'+f]||'question';
  const form=post
    ? `<div class="card"><h2>Start a thread</h2>
      <label for="nt" class="small">Title</label>
      <input id="nt" data-draft="newtitle:${esc(f)}" value="${esc(dt)}" placeholder="What do you want to talk about?" autocomplete="off">
      <label for="nk" class="small" style="display:block;margin-top:8px">Type</label>
      <select id="nk" data-draft="newkind:${esc(f)}">${KINDS.map(([v,l])=>`<option value="${v}" ${v===dk?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <label for="nb" class="small" style="display:block;margin-top:8px">Your post</label>
      <textarea id="nb" rows="3" data-draft="newbody:${esc(f)}">${esc(db)}</textarea>
      <div class="err" id="newerr"></div>
      <div style="margin-top:6px"><button data-act="newthread" data-key="${esc(f)}">Post thread</button></div></div>`
    : `<div class="card"><h2>Follow only</h2><p class="muted">You can read and follow this board. Posting is limited to people whose districts cover it.</p></div>`;
  return `<div class="card">${backLink(f)}
      <span class="tag">${esc(info.scope)}</span> ${joinTag(f)}
      <h1 style="margin-top:6px">${esc(info.title)}</h1><p>${esc(info.sub)}</p>
      <div class="bar"><span class="muted small">${st.count} thread${st.count===1?'':'s'}</span>
        <button class="${state.followed[f]?'':'ghost'}" data-act="follow" data-key="${esc(f)}" aria-pressed="${!!state.followed[f]}">${state.followed[f]?'Following':'Follow this board'}</button>${starBoardBtn(f)}</div></div>
    ${form}
    <div class="card"><h2>Threads</h2>${list}</div>`;
}

function viewThread(){
  const t=boardFor(state.boardKey).threads.find(x=>x.id===state.threadId);
  if(!t) return `<div class="card"><p class="muted">That thread could not be found.</p></div>`;
  const info=boardInfo(state.boardKey), rk='reply:'+t.id;
  const reply=canPost(state.boardKey)
    ? `<div class="card"><h2>Reply</h2>
      <label for="rp" class="small">Your reply</label>
      <textarea id="rp" rows="3" data-draft="${esc(rk)}">${esc(state.drafts[rk]||'')}</textarea>
      <div class="err" role="alert">${esc(state.postError||'')}</div>
      <div style="margin-top:6px"><button data-act="reply" data-key="${esc(state.boardKey)}" data-id="${esc(t.id)}">Post reply</button></div></div>`
    : `<div class="card"><h2>Follow only</h2><p class="muted">Replies are limited to people whose districts cover this board.</p></div>`;
  return `<div class="card"><button class="ghost" data-act="board" data-key="${esc(state.boardKey)}" style="margin-bottom:10px">← ${esc(info.title)}</button>
      <span class="tag">${esc(KIND_LABEL[t.kind])}</span>
      <h1 style="margin-top:6px">${esc(t.title)}</h1><div class="bar"><button class="${state.followed['thread:'+t.id]?'':'ghost'}" data-act="follow" data-key="${esc('thread:'+t.id)}" aria-pressed="${!!state.followed['thread:'+t.id]}">${state.followed['thread:'+t.id]?'Following this thread':'Follow this thread'}</button></div></div>
    <div class="card"><h2>Posts</h2>${t.posts.map(p=>`<div class="post"><b>${esc(p.who)}</b> <span class="muted small">${esc(fmtShort(p.t))}</span><div class="pre">${esc(p.text)}</div></div>`).join('')}</div>
    ${reply}`;
}

/* ---------- shell ---------- */
function sidebarBody(){
  const item=(id,label,icon)=>`<button class="navbtn ${NAV_ON[state.page]===id?'on':''}" data-act="page" data-id="${id}" ${NAV_ON[state.page]===id?'aria-current="page"':''}>${svgIcon(icon)}<span>${label}</span></button>`;
  const nav=`<div class="navgroup"><div class="navhead">Home</div>${item('feed','Feed','feed')}${item('favorites','Favorites','star')}</div>
    <div class="navgroup"><div class="navhead">Your districts</div>${item('find','Find my districts','pin')}</div>
    <div class="navgroup"><div class="navhead">Government</div>${item('bodies','Bodies','building')}${item('meetings','Meetings','calendar')}${item('calendar','My calendar','check')}</div>
    <div class="navgroup"><div class="navhead">Talk</div>${item('boards','Discussion boards','chat')}</div>`;
  const districts=state.addr
    ? `<div class="sidebox"><h2>Your districts</h2>${WORKING.map(l=>`<label class="tg"><input type="checkbox" data-act="toggle" data-id="${l}" ${state.toggles[l]?'checked':''}><span><b>${esc(LEVEL_LABEL[l])}</b><br><span class="muted small">${esc(DIST[state.addr.d[l]].label)}</span></span></label>`).join('')}
        <p class="muted small">Show meetings and boards for each area. State and U.S. House info pages are not working yet.</p></div>`
    : `<div class="sidebox"><p class="muted small">No address set. Use Find my districts.</p></div>`;
  return `<div class="brand">Civic Lens</div>${nav}${districts}`;
}

function viewApp(){
  const pages={feed:viewFeed,find:viewFind,bodies:viewBodies,body:viewBody,meetings:viewMeetings,calendar:viewCalendar,meeting:viewMeeting,boards:viewBoards,allboards:viewAllBoards,board:viewBoard,thread:viewThread,item:viewItem,favorites:viewFavorites};
  const sub=state.page==='board'||state.page==='thread'?(boardInfo(state.boardKey).title):'';
  return `<div class="shell ${state.navOpen?'':'closed'}">
    <aside class="side" aria-label="Main navigation">${sidebarBody()}</aside>
    <div class="main">
      <header><button class="ghost" data-act="nav" aria-expanded="${state.navOpen}" aria-label="Show or hide menu">☰</button><b>${esc(TITLES[state.page])}</b><span class="spacer"></span>
        <span class="muted small">${esc(state.user)}${state.addr?' · '+esc(state.addr.full):''}</span>
        <button class="ghost" data-act="signout">Sign out</button></header>
      <main id="main" class="wrap">${pages[state.page]()}</main>
      <footer>${esc(DATA_NOTICE)} Checked ${esc(DATA_CHECKED)}. Addresses, community groups, and discussions are sample data.</footer>
    </div></div>`;
}
function render(){
  const app=document.getElementById('app');
  const y=window.scrollY;
  app.innerHTML=!state.ready?'<p class="muted" style="padding:16px">Loading…</p>':state.screen==='signin'?viewSignin():viewApp();
  window.scrollTo(0,y);
}
async function reloadBoards(){ state.remote=await dbLoadBoards(); }
async function signin(){
  const name=state.user.trim();
  if(!name){state.error='Enter a nickname to continue.';render();return;}
  try{
    if(!state.me) state.me=await dbCreateProfile(name);
    state.user=state.me.nickname; state.error=''; state.screen='app'; state.page='feed';
    await reloadBoards();
  }catch(e){ state.error=e.message; }
  render();
}
async function chooseAddress(id){
  state.addr=ADDRESSES.find(a=>a.id===id);
  Object.assign(state,{page:'feed',toggles:{fed:true,county:true,city:true,school:true,cpg:true},meetingId:null,postError:''});
  state.followed=baselineFollows(state.addr);persist();
  const places=Object.values(state.addr.d);
  const bodies=[...new Set(places.map(p=>DIST[p].body))].filter(Boolean);
  try{ localStorage.setItem('civic.addr',id); }catch(e){}
  if(state.me){ try{ await dbSaveLocation(state.me.id,places,bodies); }catch(e){ state.postError='Could not save your districts: '+e.message; } }
  render();
}
async function signOutApp(){
  try{ await dbSignOut(); }catch(e){}
  try{ localStorage.removeItem('civic.addr'); localStorage.removeItem('civic.followed'); localStorage.removeItem('civic.calendar'); }catch(e){}
  Object.assign(state,{screen:'signin',user:'',addr:null,error:'',page:'feed',me:null,calendar:[],followed:{},menuFor:null,remote:{threads:[],posts:[]}});
  render();
}
async function postNewThread(key){
  const title=(state.drafts['newtitle:'+key]||'').trim();
  const body=(state.drafts['newbody:'+key]||'').trim();
  const kind=state.drafts['newkind:'+key]||'question';
  const err=document.getElementById('newerr');
  if(!title||!body){ if(err) err.textContent='Add a title and your post first.'; return; }
  if(!state.me){ if(err) err.textContent='Sign in again to post.'; return; }
  if(!canPost(key)){ if(err) err.textContent='Only people whose districts cover this board can post. You can follow it.'; return; }
  const [scope,id]=dbScope(key);
  try{
    const threadId=await dbPostThread({userId:state.me.id,scope,id,title,kind,body});
    delete state.drafts['newtitle:'+key]; delete state.drafts['newbody:'+key]; delete state.drafts['newkind:'+key];
    await reloadBoards();
    return go('thread',{boardKey:key,threadId});
  }catch(e){ if(err) err.textContent=e.message; }
}
async function postReply(key,threadId){
  const rk='reply:'+threadId;
  const text=(state.drafts[rk]||'').trim();
  if(!text) return;
  if(!canPost(key)){ state.postError='Only people whose districts cover this board can post.'; return render(); }
  try{
    await dbPostReply({userId:state.me.id,threadId,body:text});
    delete state.drafts[rk]; state.postError='';
    await reloadBoards();
  }catch(e){ state.postError=e.message; }
  render();
}
async function boot(){
  try{
    state.me=await dbStart();
    if(state.me){
      state.user=state.me.nickname; state.screen='app';
      let saved=null; try{ saved=localStorage.getItem('civic.addr'); }catch(e){}
      state.addr=ADDRESSES.find(a=>a.id===saved)||null;
      try{const f=JSON.parse(localStorage.getItem('civic.followed')||'null');const c=JSON.parse(localStorage.getItem('civic.calendar')||'null');if(c)state.calendar=c;state.followed=f||(state.addr?baselineFollows(state.addr):{});}catch(e){if(state.addr)state.followed=baselineFollows(state.addr);}
    }
    await reloadBoards();
  }catch(e){ state.error='Could not connect to the database. '+e.message; }
  try{state.favItems=JSON.parse(localStorage.getItem('civic.favItems')||'{}');state.favBoards=JSON.parse(localStorage.getItem('civic.favBoards')||'{}');}catch(e){}
  state.navOpen=window.matchMedia('(min-width:761px)').matches;
  state.ready=true;
  render();
}function go(page,extra={}){Object.assign(state,{page},extra);render();}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]'); if(!t) return;
  const act=t.dataset.act, id=t.dataset.id, key=t.dataset.key;
  if(act==='signin') return signin();
  if(act==='nav'){state.navOpen=!state.navOpen;return render();}
  if(act==='choose') return chooseAddress(id);
  if(act==='signout') return signOutApp();
  if(act==='page') return go(id,{meetingId:null,boardKey:null,threadId:null});
  if(act==='meeting') return go('meeting',{meetingId:id,menuFor:null});
  if(act==='tocal'){const i=state.calendar.indexOf(id);if(i>=0)state.calendar.splice(i,1);else state.calendar.push(id);state.menuFor=id;persist();return render();}
  if(act==='body') return go('body',{bodyId:id});
  if(act==='item') return go('item',{itemId:id,threadId:null});
  if(act==='postex') return postEx(key);
  if(act==='meetthread'){const m=findMeeting(id);state.drafts['newtitle:body:'+m.body]=fmtShort(m.date)+' meeting: ';return go('board',{boardKey:'body:'+m.body,threadId:null});}
  if(act==='staritem'){if(state.favItems[id]) delete state.favItems[id]; else state.favItems[id]=true; persistFavs(); return render();}
  if(act==='starboard'){if(state.favBoards[key]) delete state.favBoards[key]; else state.favBoards[key]=true; persistFavs(); return render();}
  if(act==='exskip'){state.drafts[exKey(key,id)]='';return render();}
  if(act==='excadd'){const q=(state.drafts['excq:'+key]||'').trim(),a=(state.drafts['exca:'+key]||'').trim();
    if(!q||!a){const e=document.getElementById('newerr');if(e) e.textContent='Add both a question and an answer.';return;}
    (state.customEx[key]=state.customEx[key]||[]).push({q,a});delete state.drafts['excq:'+key];delete state.drafts['exca:'+key];return render();}
  if(act==='exdel'){(state.customEx[key]||[]).splice(Number(id),1);return render();}
  if(act==='board'){ if(key&&key.startsWith('item:')) return go('item',{itemId:key.slice(5),threadId:null}); return go('board',{boardKey:key,threadId:null}); }
  if(act==='thread') return go('thread',{boardKey:key,threadId:id});
  if(act==='follow'){state.followed[key]=!state.followed[key];persist();return render();}
  if(act==='newthread') return postNewThread(key);
  if(act==='reply') return postReply(key,id);
});
document.addEventListener('input',e=>{
  if(e.target.id==='username') state.user=e.target.value;
  if(e.target.id==='q'){state.query=e.target.value;const r=document.getElementById('results');if(r) r.innerHTML=findResults();}
  if(e.target.id==='bq'){state.boardQuery=e.target.value;const r=document.getElementById('board-list');if(r) r.innerHTML=boardsHtml();}
  if(e.target.dataset.draft) state.drafts[e.target.dataset.draft]=e.target.value;
});
document.addEventListener('change',e=>{
  if(e.target.dataset.act==='toggle'){state.toggles[e.target.dataset.id]=e.target.checked;return render();}
  if(e.target.dataset.draft) state.drafts[e.target.dataset.draft]=e.target.value;
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='username') signin();
});
boot();
