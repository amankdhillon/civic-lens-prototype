const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TODAY='2026-11-18';

/* ===== SAMPLE DATA. Fictional people, meetings, and boards. Officeholders and district numbers must be verified before any public test. ===== */
const TOPICS=[
  {id:'streets',title:'Streets and transportation'},
  {id:'housing',title:'Housing'},
  {id:'budget',title:'Budget and spending'},
  {id:'safety',title:'Public safety'},
  {id:'schools',title:'Schools and students'}
];
const LEVEL_LABEL={fed:'U.S. House',state:'State Senate',county:'County supervisor',city:'City council',school:'School board',local:'Neighborhood group'};
const WORKING=['county','city','school','local'];
const ADDRESSES=[
  {id:'a1',full:'1200 Sample Ave, San Diego, CA 92101',d:{fed:'fed-sd',state:'state-sd',county:'bos-3',city:'sdcc-3',school:'sdusd-c',local:'grp-d3'}},
  {id:'a2',full:'850 Sample Rd, San Diego, CA 92117',d:{fed:'fed-sd',state:'state-sd',county:'bos-2',city:'sdcc-6',school:'sdusd-a',local:'grp-east'}},
  {id:'a3',full:'330 Sample St, San Diego, CA 92105',d:{fed:'fed-sd',state:'state-sd',county:'bos-4',city:'sdcc-4',school:'sdusd-e',local:'grp-coast'}}
];

/* Discussion boards. A board is a named place for conversation. Each holds threads. Keys: topic:, body:, group:, place:, meet:, item: */
const T=(id,title,kind,posts)=>({id,title,kind,posts});
const P=(who,text,t)=>({who,text,t});
const SEED_BOARDS={
  'topic:streets':{threads:[T('t1','Which streets are next for repaving?','question',[P('Marcus T.','Anyone know if the street repair amendment covers my block?','2026-11-15'),P('Priya S.','The staff list is in the December 8 agenda packet, page 12.','2026-11-16')])]},
  'topic:housing':{threads:[T('t2','Does the noise ordinance affect construction hours?','question',[P('Renee B.','Asking for my building. Does this change weekend construction limits?','2026-11-14')])]},
  'topic:budget':{threads:[T('t3','Where can I see the budget amendment in plain terms?','information',[P('Dana K.','Staff summary, page 2: funds move from reserves to repairs. Source link in the thread.','2026-11-16')])]},
  'topic:schools':{threads:[]},
  'topic:safety':{threads:[]},
  'body:bos':{threads:[T('t4','Question for the next supervisor meeting','question',[P('Renee B.','Will public comment time change for the December meeting?','2026-11-13')])]},
  'body:sdcc':{threads:[T('t5','Council meetings and public comment','opinion',[P('Dana K.','Shorter comment periods make it hard to speak. Who else has noticed?','2026-11-12')])]},
  'place:sdcc-3':{threads:[T('t6','Park cleanup Saturday, who is coming?','question',[P('Marcus T.','Meeting at the north entrance at 9. Bring gloves.','2026-11-15')])]},
  'group:grp-d3':{threads:[T('t7','Speaker invitation for January','opinion',[P('Priya S.','I would like to invite a transit planner. Who can help organize?','2026-11-16')])]},
};
