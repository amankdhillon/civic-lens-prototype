const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TODAY='2026-11-17';

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
const DIST={
  'fed-sd':{label:'U.S. House, San Diego County district',rep:'Placeholder (verify)',body:'fed'},
  'state-sd':{label:'State Senate, San Diego County district',rep:'Placeholder (verify)',body:'state'},
  'bos-1':{label:'Supervisor, District 1',rep:'Nora Vargas',body:'bos'},
  'bos-2':{label:'Supervisor, District 2',rep:'Joel Anderson',body:'bos'},
  'bos-3':{label:'Supervisor, District 3',rep:'Terra Lawson-Remer',body:'bos'},
  'bos-4':{label:'Supervisor, District 4',rep:'Monica Montgomery Steppe',body:'bos'},
  'bos-5':{label:'Supervisor, District 5',rep:'Jim Desmond',body:'bos'},
  'sdcc-1':{label:'Council, District 1',rep:'Joe LaCava',body:'sdcc'},
  'sdcc-2':{label:'Council, District 2',rep:'Jennifer Campbell',body:'sdcc'},
  'sdcc-3':{label:'Council, District 3',rep:'Stephen Whitburn',body:'sdcc'},
  'sdcc-4':{label:'Council, District 4',rep:'Henry Foster III',body:'sdcc'},
  'sdcc-5':{label:'Council, District 5',rep:'Marni von Wilpert',body:'sdcc'},
  'sdcc-6':{label:'Council, District 6',rep:'Kent Lee',body:'sdcc'},
  'sdcc-7':{label:'Council, District 7',rep:'Raul Campillo',body:'sdcc'},
  'sdcc-8':{label:'Council, District 8',rep:'Vivian Moreno',body:'sdcc'},
  'sdcc-9':{label:'Council, District 9',rep:'Sean Elo-Rivera',body:'sdcc'},
  'sdusd-a':{label:'Board, Area A',rep:'Trustee (verify)',body:'sdusd'},
  'sdusd-b':{label:'Board, Area B',rep:'Trustee (verify)',body:'sdusd'},
  'sdusd-c':{label:'Board, Area C',rep:'Trustee (verify)',body:'sdusd'},
  'sdusd-d':{label:'Board, Area D',rep:'Trustee (verify)',body:'sdusd'},
  'sdusd-e':{label:'Board, Area E',rep:'Trustee (verify)',body:'sdusd'},
  'grp-d3':{label:'Neighborhood group, District 3',rep:'Organized by residents (sample)',body:'grp-d3'},
  'grp-east':{label:'Neighborhood group, Eastside',rep:'Organized by residents (sample)',body:'grp-east'},
  'grp-coast':{label:'Neighborhood group, Coastal',rep:'Organized by residents (sample)',body:'grp-coast'}
};
const BODIES={
  fed:{name:'U.S. House of Representatives',level:'Federal',kind:'governing',about:'Members represent congressional districts, pass federal laws, and approve federal spending.',members:['fed-sd'],meets:false},
  state:{name:'California State Senate',level:'State',kind:'governing',about:'Senators represent districts, pass state laws, and approve the state budget.',members:['state-sd'],meets:false},
  bos:{name:'Board of Supervisors, County of San Diego',level:'County',kind:'governing',about:'Elected supervisors, one per district, set the county budget, run county services, and decide land-use rules in unincorporated areas.',members:['bos-1','bos-2','bos-3','bos-4','bos-5'],meets:true},
  sdcc:{name:'San Diego City Council',level:'City',kind:'governing',about:'Nine elected council members, one per district, set the city budget, pass ordinances, and approve city contracts.',members:['sdcc-1','sdcc-2','sdcc-3','sdcc-4','sdcc-5','sdcc-6','sdcc-7','sdcc-8','sdcc-9'],meets:true},
  'sdcc-budget':{name:'Budget and Government Efficiency Committee (sample)',level:'City',kind:'committee',parent:'sdcc',about:'Reviews the city budget before the full council votes.',members:[],meets:true},
  sdusd:{name:'San Diego Unified School District Board of Education',level:'School',kind:'governing',about:'Elected trustees set district policy, approve the budget, and oversee the superintendent.',members:['sdusd-a','sdusd-b','sdusd-c','sdusd-d','sdusd-e'],meets:true},
  'grp-d3':{name:'District 3 Neighborhood Council (sample)',level:'Community groups',kind:'community',about:'A community group, not a government body. Residents discuss local issues and invite speakers.',members:[],meets:false},
  'grp-east':{name:'Eastside Neighbors Coalition (sample)',level:'Community groups',kind:'community',about:'A community group, not a government body. Organizes walks, cleanups, and public comment training.',members:[],meets:false},
  'grp-coast':{name:'Coastal Community Forum (sample)',level:'Community groups',kind:'community',about:'A community group, not a government body. Hosts open forums on coastal planning.',members:[],meets:false}
};
const I=(id,title,action,summary,result)=>({id,title,action,summary,result});
const MEETINGS=[
  {id:'m1',body:'bos',date:'2026-11-10',time:'9:00 a.m.',title:'Regular meeting',items:[
    I('i-bos-1','Consent calendar (sample)','Final decision','Routine approvals voted together. Any item can be pulled for discussion.','Approved (sample)'),
    I('i-bos-2','Park fee schedule update (sample)','Final decision','Updates recreation fees for county parks after a public hearing.','Approved 4-1 (sample)')]},
  {id:'m2',body:'bos',date:'2026-12-01',time:'9:00 a.m.',title:'Regular meeting',items:[
    I('i-bos-3','Fifth Street bike lane corridor (sample)','Final decision','Staff recommends a protected lane with one parking change. Comment is accepted before the vote.'),
    I('i-bos-4','Groundwater monitoring contract (sample)','Final decision','Approves a three-year monitoring contract. Scope and cost are in the attachment.')]},
  {id:'m3',body:'sdcc',date:'2026-11-10',time:'10:00 a.m.',title:'Regular meeting',items:[
    I('i-sdc-1','Short-term rental rules (sample)','Final decision','Updates permit rules for short-term rentals citywide.','Continued (sample)'),
    I('i-sdc-2','Library hours update (sample)','Recommendation','Staff asks for direction on weekend hours. No final vote today.','Direction given (sample)')]},
  {id:'m4',body:'sdcc',date:'2026-12-08',time:'10:00 a.m.',title:'Regular meeting',items:[
    I('i-sdc-3','Street repair budget amendment (sample)','Final decision','Moves funds to repair arterial streets. Needs a simple majority.'),
    I('i-sdc-4','Noise ordinance update (sample)','First reading','Changes nighttime noise limits. A second reading comes later.')]},
  {id:'m7',body:'sdcc-budget',date:'2026-12-03',time:'1:30 p.m.',title:'Committee meeting',items:[
    I('i-bud-1','Mid-year budget review (sample)','Recommendation','Staff presents the mid-year budget and asks the committee for direction.')]},
  {id:'m5',body:'sdusd',date:'2026-11-12',time:'5:00 p.m.',title:'Regular board meeting',items:[
    I('i-sd-1','Quarterly budget report (sample)','Information item','Reports spending through the first quarter. No vote.','Received (sample)'),
    I('i-sd-2','Attendance boundary review (sample)','Recommendation','Staff presents boundary options for two schools.','Direction given (sample)')]},
  {id:'m6',body:'sdusd',date:'2026-12-10',time:'5:00 p.m.',title:'Regular board meeting',items:[
    I('i-sd-3','Facilities bond project list (sample)','Final decision','Approves the list of projects a bond would fund. Voter approval is separate.'),
    I('i-sd-4','Superintendent search update (sample)','Information item','Update on the recruiting timeline. Closed session may follow.')]}
];
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
  'item:i-bos-3':{threads:[T('t8','Will the bike lane change my parking?','question',[P('Dana K.','Worth attending. Bike lanes on that corridor keep coming back.','2026-11-15'),P('Priya S.','Staff report page 4 covers the parking spaces.','2026-11-16')])]},
  'item:i-bos-4':{threads:[T('t9','Where can I read the contract scope?','question',[P('Renee B.','Where can I read the contract scope before the vote?','2026-11-14')])]},
  'item:i-sd-3':{threads:[T('t10','A superintendent search timeline would help families plan.','opinion',[P('Priya S.','Families need to know when decisions about leadership will be made.','2026-11-15')])]}
};
