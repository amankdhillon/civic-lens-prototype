const TITLES={feed:'Feed',find:'Find my districts',bodies:'Bodies',body:'Body',meetings:'Meetings',agenda:'Agenda',boards:'Discussion boards',board:'Discussion board',thread:'Thread'};
const NAV_ON={feed:'feed',find:'find',bodies:'bodies',body:'bodies',meetings:'meetings',agenda:'meetings',boards:'boards',board:'boards',thread:'boards'};

const state={screen:'signin',user:'',error:'',addr:null,page:'feed',navOpen:true,toggles:{county:true,city:true,school:true,local:true},
  bodyId:null,meetingId:null,boardKey:null,threadId:null,query:'',boardQuery:'',drafts:{},followed:{},seq:100,
  remote:{threads:[],posts:[]},me:null,ready:false,postError:''};

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
  if(type==='topic'){const t=TOPICS.find(x=>x.id===id);return{type,title:t?t.title:id,scope:'Topic',sub:'A citywide conversation on this topic.'};}
  if(type==='body'){const b=BODIES[id];return{type,title:b.name,scope:b.kind==='committee'?'Subcommittee':'Government body',sub:b.about};}
  if(type==='group'){const b=BODIES[id];return{type,title:b.name,scope:'Community group',sub:b.about};}
  if(type==='place'){return{type,title:DIST[id].label+' board',scope:'Council district',sub:'Neighbors in this district talk about local decisions.'};}
  if(type==='meet'){const m=findMeeting(id);return{type,title:`${BODIES[m.body].name}, ${fmtDate(m.date)}`,scope:'Meeting',sub:`${m.title} · ${m.time}`};}
  if(type==='item'){const f=findItem(id);return{type,title:f.it.title,scope:'Agenda item',sub:`${BODIES[f.m.body].name} · ${fmtDate(f.m.date)}`};}
  return{type,title:id,scope:type,sub:''};
}
function allBoardKeys(){
  const keys=new Set([
    ...TOPICS.map(t=>'topic:'+t.id),
    ...Object.keys(BODIES).filter(b=>BODIES[b].kind!=='community').map(b=>'body:'+b),
    ...Object.keys(BODIES).filter(b=>BODIES[b].kind==='community').map(b=>'group:'+b),
    ...Object.keys(DIST).filter(d=>d.startsWith('sdcc-')).map(d=>'place:'+d),
    ...MEETINGS.map(m=>'meet:'+m.id),
    ...MEETINGS.flatMap(m=>m.items.map(i=>'item:'+i.id)),
    ...state.remote.threads.map(t=>(t.scope_kind==='meeting'?'meet':t.scope_kind)+':'+t.scope_id)
  ]);
  return [...keys];
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
  const info=boardInfo(k), st=boardStats(k);
  return `<div class="row">
    <div><button class="linkish" data-act="board" data-key="${esc(k)}">${esc(info.title)}</button>
      <div class="muted small">${esc(info.scope)} · ${st.count} thread${st.count===1?'':'s'} · last activity ${st.last?esc(fmtShort(st.last)):'none yet'}</div></div>
    <span class="bar">${inScope(k)?'<span class="tag ok">In your area</span>':''}
      <button class="${state.followed[k]?'':'ghost'}" data-act="follow" data-key="${esc(k)}" aria-pressed="${!!state.followed[k]}">${state.followed[k]?'Following':'Follow'}</button></span>
  </div>`;
};

/* ---------- screens ---------- */
function viewSignin(){
  return `<div class="signin"><div class="card"><h1>Civic Lens</h1><p class="muted">Prototype sign-in. Enter a username. No password is needed.</p>
    <label for="username" class="small">Username</label>
    <input id="username" placeholder="For example, Dana" value="${esc(state.user)}" autocomplete="off">
    <div class="err" role="alert">${esc(state.error)}</div><div style="margin-top:6px"><button data-act="signin">Continue</button></div></div></div>`;
}

function listMeetings(ms){
  return ms.map(m=>`<div class="row"><div><b>${fmtDate(m.date)} · ${esc(m.time)}</b>
    <div class="muted small">${esc(BODIES[m.body].name)} · ${esc(m.title)} · ${m.items.length} items</div></div>
    <button class="ghost" data-act="open" data-id="${m.id}">Open agenda</button></div>`).join('');
}

// Feed = what the person follows. Community groups are left out of the prototype feed.
const bodyOfKey=k=>{const [t,id]=splitKey(k);if(t==='body')return id;if(t==='place'&&DIST[id])return DIST[id].body;if(t==='meet'){const m=findMeeting(id);return m?m.body:null;}if(t==='item'){const f=findItem(id);return f?f.m.body:null;}return null;};
const isCommunityKey=k=>{const [t]=splitKey(k);if(t==='group')return true;const b=bodyOfKey(k);return !!b&&!!BODIES[b]&&BODIES[b].kind==='community';};
const feedKeys=()=>Object.keys(state.followed).filter(k=>state.followed[k]&&!isCommunityKey(k));
const followedBodyIds=()=>[...new Set(feedKeys().map(bodyOfKey).filter(b=>b&&BODIES[b]))];
const feedMeetings=()=>{const ids=followedBodyIds();const direct=feedKeys().filter(k=>k.startsWith('meet:')).map(k=>splitKey(k)[1]);return MEETINGS.filter(m=>ids.includes(m.body)||direct.includes(m.id));};
// Baseline follows for a new person: county board, city council, and their council district.
const baselineFollows=addr=>({['body:'+DIST[addr.d.county].body]:true,['body:'+DIST[addr.d.city].body]:true,['place:'+addr.d.city]:true});

function viewFeed(){
  if(!state.addr) return `<div class="card"><h1>Welcome, ${esc(state.user)}</h1><p class="muted">Find your districts first. Your feed shows meetings, decisions, and discussions for the bodies that represent you.</p><button data-act="page" data-id="find">Find my districts</button></div>`;
  const ms=feedMeetings();
  const up=ms.filter(m=>!isPast(m)).sort(byAsc).slice(0,4);
  const past=ms.filter(isPast).sort(byDesc);
  const decisions=past.flatMap(m=>m.items.filter(i=>i.result).map(i=>({m,i}))).map(({m,i})=>
    `<div class="row"><div><b>${esc(i.title)}</b><div class="muted small">${esc(BODIES[m.body].name)} · ${fmtDate(m.date)}</div></div><span class="tag ok">${esc(i.result)}</span></div>`).join('')||'<p class="muted">No recent decisions for what you follow.</p>';
  const boards=feedKeys().sort((a,b)=>boardStats(b).last.localeCompare(boardStats(a).last)).slice(0,6);
  return `<div class="card"><h2>Coming up</h2>${listMeetings(up)||'<p class="muted">No upcoming meetings for what you follow.</p>'}</div>
    <div class="card"><h2>Active discussions</h2>${boards.length?boards.map(boardRow).join(''):'<p class="muted">Nothing followed yet. Follow a body, meeting, or item to see its discussion here.</p>'}
      <div class="row"><span class="muted small">Start a thread on any board.</span><button class="ghost" data-act="page" data-id="boards">All discussion boards</button></div></div>
    <div class="card"><h2>Recent decisions</h2>${decisions}</div>`;
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
  const levels=['Federal','State','County','City','School','Community groups'];
  const sections=levels.map(level=>{
    const ids=Object.keys(BODIES).filter(b=>BODIES[b].level===level&&!BODIES[b].parent);
    if(!ids.length) return '';
    return `<div class="card"><h2>${esc(level)}</h2>${ids.map(id=>bodyRow(id)+Object.keys(BODIES).filter(c=>BODIES[c].parent===id).map(c=>bodyRow(c,true)).join('')).join('')}
      ${level==='Community groups'?'<p class="muted small">Community groups are not government bodies. They organize residents and host discussions.</p>':''}</div>`;
  }).join('');
  return sections;
}

function viewBody(){
  const b=BODIES[state.bodyId];
  const subs=Object.keys(BODIES).filter(c=>BODIES[c].parent===state.bodyId);
  const ms=MEETINGS.filter(m=>m.body===state.bodyId||subs.includes(m.body));
  const members=b.members.length?b.members.map(m=>`<div class="row"><div><b>${esc(DIST[m].rep)}</b><div class="muted small">${esc(DIST[m].label)}</div></div>${mine(m)?'<span class="tag ok">Your rep</span>':''}</div>`).join(''):'<p class="muted small">Members are set by the group.</p>';
  const key='body:'+state.bodyId;
  return `<div class="card"><button class="ghost" data-act="page" data-id="bodies" style="margin-bottom:10px">← Back to bodies</button>
    <h1>${esc(b.name)}</h1><p>${esc(b.about)}</p>
    <span class="tag">${esc(b.kind==='community'?'Community group':b.kind==='committee'?'Subcommittee':'Government body')}</span>
    ${inScope('body:'+state.bodyId)||inScope('group:'+state.bodyId)?'<span class="tag ok">In your area</span>':''}
    <div class="bar" style="margin-top:10px">
      ${ms.length?'<button class="ghost" data-act="page" data-id="meetings">See meetings</button>':''}
      <button data-act="board" data-key="${esc(b.kind==='community'?'group:'+state.bodyId:key)}">Open discussion board</button>
      <button class="ghost" data-act="follow" data-key="${esc(b.kind==='community'?'group:'+state.bodyId:key)}" aria-pressed="${!!state.followed[b.kind==='community'?'group:'+state.bodyId:key]}">${state.followed[b.kind==='community'?'group:'+state.bodyId:key]?'Following':'Follow'}</button>
    </div>
    <h2 style="margin-top:14px">Members</h2>${members}
    ${subs.length?`<h2 style="margin-top:14px">Subcommittees</h2>${subs.map(s=>bodyRow(s)).join('')}`:''}
    ${ms.length?`<h2 style="margin-top:14px">Meetings</h2>${listMeetings(ms.slice().sort(byAsc))}`:''}
    <p class="muted small">Sample data. Replace with official information before any public test.</p></div>`;
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

function viewAgenda(){
  const m=findMeeting(state.meetingId);
  if(!m) return `<div class="card"><p class="muted">No meeting selected. Open one from Meetings.</p></div>`;
  const past=isPast(m);
  const mk='meet:'+m.id;
  const items=m.items.map(it=>{
    const ik='item:'+it.id, st=boardStats(ik);
    return `<details class="item"><summary>${esc(it.title)}</summary>
      <div style="margin-top:8px"><span class="tag ${it.action==='Final decision'?'final':''}">${it.action==='Final decision'?'Final: this body':'Advisory'}</span>
      <span class="tag">${esc(it.action)}</span>${past&&it.result?`<span class="tag ok">${esc(it.result)}</span>`:''}</div>
      <p>${esc(it.summary)}</p>
      <div class="bar"><span class="muted small">${st.count} thread${st.count===1?'':'s'} on this item</span>
        <button data-act="board" data-key="${esc(ik)}">Open item discussion</button></div></details>`;
  }).join('');
  const ms=boardStats(mk);
  return `<div class="card"><button class="ghost" data-act="page" data-id="meetings" style="margin-bottom:10px">← Back to meetings</button>
      <h1>${esc(BODIES[m.body].name)}</h1><div class="muted">${fmtDate(m.date)} · ${esc(m.time)} · ${esc(m.title)}</div>
      <span class="tag ${past?'':'ok'}">${past?'Previous':'Upcoming'}</span></div>
    <div class="card"><h2>Agenda items</h2>${items}</div>
    <div class="card"><h2>Meeting discussion</h2><p class="muted small">${ms.count} thread${ms.count===1?'':'s'} about this meeting.</p>
      <button data-act="board" data-key="${esc(mk)}">Open meeting discussion board</button></div>`;
}

function boardsHtml(){
  const q=state.boardQuery.trim().toLowerCase();
  const order=['topic','place','body','group','meet','item'];
  const titles={topic:'Citywide topics',place:'Council districts',body:'Government bodies',group:'Community groups',meet:'Meetings',item:'Agenda items'};
  return order.map(type=>{
    const keys=allBoardKeys().filter(k=>k.startsWith(type+':')).filter(k=>!q||boardInfo(k).title.toLowerCase().includes(q));
    if(!keys.length) return '';
    return `<div class="card"><h2>${esc(titles[type])}</h2>${keys.map(boardRow).join('')}</div>`;
  }).join('')||'<div class="card"><p class="muted">No boards match that search.</p></div>';
}
function viewBoards(){
  return `<div class="card"><h1>Discussion boards</h1>
      <p class="muted">Boards are where people talk. Each board holds threads. Start a thread to ask a question, share information with a source, or give an opinion.</p>
      <label for="bq" class="small">Search boards</label>
      <input id="bq" value="${esc(state.boardQuery)}" placeholder="For example, streets or budget" autocomplete="off"></div>
    <div id="board-list">${boardsHtml()}</div>`;
}

const KINDS=[['question','Question'],['information','Information, with a source'],['opinion','Opinion']];
const KIND_LABEL=Object.fromEntries(KINDS);
function viewBoard(){
  const info=boardInfo(state.boardKey), st=boardStats(state.boardKey);
  const f=state.boardKey;
  const threads=boardFor(f).threads;
  const list=threads.length?threads.map(t=>`<div class="thread"><button class="linkish" data-act="thread" data-key="${esc(f)}" data-id="${t.id}">${esc(t.title)}</button>
      <div class="bar" style="margin-top:4px"><span class="tag">${esc(KIND_LABEL[t.kind])}</span><span class="muted small">${t.posts.length} post${t.posts.length===1?'':'s'} · last activity ${esc(fmtShort(threadLast(t)))}</span></div></div>`).join('')
    :'<p class="muted">No threads yet. Start the first one below.</p>';
  const dt=state.drafts['newtitle:'+f]||'', db=state.drafts['newbody:'+f]||'', dk=state.drafts['newkind:'+f]||'question';
  return `<div class="card"><button class="ghost" data-act="page" data-id="boards" style="margin-bottom:10px">← All discussion boards</button>
      <span class="tag">${esc(info.scope)}</span>${inScope(f)?'<span class="tag ok">In your area</span>':''}
      <h1 style="margin-top:6px">${esc(info.title)}</h1><p>${esc(info.sub)}</p>
      <div class="bar"><span class="muted small">${st.count} thread${st.count===1?'':'s'}</span>
        <button class="${state.followed[f]?'':'ghost'}" data-act="follow" data-key="${esc(f)}" aria-pressed="${!!state.followed[f]}">${state.followed[f]?'Following':'Follow this board'}</button></div></div>
    <div class="card"><h2>Start a thread</h2>
      <label for="nt" class="small">Title</label>
      <input id="nt" data-draft="newtitle:${esc(f)}" value="${esc(dt)}" placeholder="What do you want to talk about?" autocomplete="off">
      <label for="nk" class="small" style="display:block;margin-top:8px">Type</label>
      <select id="nk" data-draft="newkind:${esc(f)}">${KINDS.map(([v,l])=>`<option value="${v}" ${v===dk?'selected':''}>${esc(l)}</option>`).join('')}</select>
      <label for="nb" class="small" style="display:block;margin-top:8px">Your post</label>
      <textarea id="nb" rows="3" data-draft="newbody:${esc(f)}">${esc(db)}</textarea>
      <div class="err" id="newerr"></div>
      <div style="margin-top:6px"><button data-act="newthread" data-key="${esc(f)}">Post thread</button></div></div>
    <div class="card"><h2>Threads</h2>${list}</div>`;
}

function viewThread(){
  const t=boardFor(state.boardKey).threads.find(x=>x.id===state.threadId);
  if(!t) return `<div class="card"><p class="muted">That thread could not be found.</p></div>`;
  const info=boardInfo(state.boardKey);
  const rk='reply:'+t.id;
  return `<div class="card"><button class="ghost" data-act="board" data-key="${esc(state.boardKey)}" style="margin-bottom:10px">← ${esc(info.title)}</button>
      <span class="tag">${esc(KIND_LABEL[t.kind])}</span>
      <h1 style="margin-top:6px">${esc(t.title)}</h1></div>
    <div class="card"><h2>Posts</h2>${t.posts.map(p=>`<div class="post"><b>${esc(p.who)}</b> <span class="muted small">${esc(fmtShort(p.t))}</span><div>${esc(p.text)}</div></div>`).join('')}</div>
    <div class="card"><h2>Reply</h2>
      <label for="rp" class="small">Your reply</label>
      <textarea id="rp" rows="3" data-draft="${esc(rk)}">${esc(state.drafts[rk]||'')}</textarea>
      <div class="err" role="alert">${esc(state.postError||'')}</div><div style="margin-top:6px"><button data-act="reply" data-key="${esc(state.boardKey)}" data-id="${esc(t.id)}">Post reply</button></div></div>`;
}

/* ---------- shell ---------- */
function sidebarBody(){
  const nav=[['feed','Feed'],['find','Find my districts'],['bodies','Bodies'],['meetings','Meetings'],['boards','Discussion boards']]
    .map(([id,l])=>`<button class="navbtn ${NAV_ON[state.page]===id?'on':''}" data-act="page" data-id="${id}" ${NAV_ON[state.page]===id?'aria-current="page"':''}>${l}</button>`).join('');
  const districts=state.addr
    ? `<div class="sidebox"><h2>Your districts</h2>${WORKING.map(l=>`<label class="tg"><input type="checkbox" data-act="toggle" data-id="${l}" ${state.toggles[l]?'checked':''}><span><b>${esc(LEVEL_LABEL[l])}</b><br><span class="muted small">${esc(DIST[state.addr.d[l]].label)}</span></span></label>`).join('')}
        <p class="muted small">Show meetings and boards for each area. State and U.S. House info pages are not working yet.</p></div>`
    : `<div class="sidebox"><p class="muted small">No address set. Use Find my districts.</p></div>`;
  return `<div class="brand">Civic Lens</div>${nav}${districts}`;
}

function viewApp(){
  const pages={feed:viewFeed,find:viewFind,bodies:viewBodies,body:viewBody,meetings:viewMeetings,agenda:viewAgenda,boards:viewBoards,board:viewBoard,thread:viewThread};
  const sub=state.page==='board'||state.page==='thread'?(boardInfo(state.boardKey).title):'';
  return `<div class="shell ${state.navOpen?'':'closed'}">
    <aside class="side" aria-label="Main navigation">${sidebarBody()}</aside>
    <div class="main">
      <header><button class="ghost" data-act="nav" aria-expanded="${state.navOpen}" aria-label="Show or hide menu">☰</button><b>${esc(TITLES[state.page])}</b><span class="spacer"></span>
        <span class="muted small">${esc(state.user)}${state.addr?' · '+esc(state.addr.full):''}</span>
        <button class="ghost" data-act="signout">Sign out</button></header>
      <main id="main" class="wrap">${pages[state.page]()}</main>
      <footer>Prototype. Sample meetings, boards, and addresses. Officeholders and district numbers must be verified before any public test.${sub?'':''}</footer>
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
  Object.assign(state,{page:'feed',toggles:{county:true,city:true,school:true,local:true},meetingId:null,postError:''});
  state.followed=baselineFollows(state.addr);
  const places=Object.values(state.addr.d);
  const bodies=[...new Set(places.map(p=>DIST[p].body))];
  try{ localStorage.setItem('civic.addr',id); }catch(e){}
  if(state.me){ try{ await dbSaveLocation(state.me.id,places,bodies); }catch(e){ state.postError='Could not save your districts: '+e.message; } }
  render();
}
async function signOutApp(){
  try{ await dbSignOut(); }catch(e){}
  try{ localStorage.removeItem('civic.addr'); }catch(e){}
  Object.assign(state,{screen:'signin',user:'',addr:null,error:'',page:'feed',me:null,remote:{threads:[],posts:[]}});
  render();
}
async function postNewThread(key){
  const title=(state.drafts['newtitle:'+key]||'').trim();
  const body=(state.drafts['newbody:'+key]||'').trim();
  const kind=state.drafts['newkind:'+key]||'question';
  const err=document.getElementById('newerr');
  if(!title||!body){ if(err) err.textContent='Add a title and your post first.'; return; }
  if(!state.me){ if(err) err.textContent='Sign in again to post.'; return; }
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
      if(state.addr) state.followed=baselineFollows(state.addr);
    }
    await reloadBoards();
  }catch(e){ state.error='Could not connect to the database. '+e.message; }
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
  if(act==='open') return go('agenda',{meetingId:id});
  if(act==='body') return go('body',{bodyId:id});
  if(act==='board') return go('board',{boardKey:key,threadId:null});
  if(act==='thread') return go('thread',{boardKey:key,threadId:id});
  if(act==='follow'){state.followed[key]=!state.followed[key];return render();}
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
