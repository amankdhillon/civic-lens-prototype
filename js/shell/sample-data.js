const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TODAY='2026-11-18';

/* ===== SAMPLE DATA. Fictional people, threads, and addresses. Officeholders, agenda items, and district numbers must be verified before any public test. ===== */
const TOPICS=[
  {id:'streets',title:'Streets and transportation'},
  {id:'housing',title:'Housing'},
  {id:'budget',title:'Budget and spending'},
  {id:'safety',title:'Public safety'},
  {id:'schools',title:'Schools and students'}
];
const LEVEL_LABEL={fed:'U.S. House',state:'State Senate',county:'County supervisor',city:'City council',school:'School board',cpg:'Planning group'};
const WORKING=['fed','county','city','school','cpg'];
const ADDRESSES=[
  {id:'a1',full:'1200 Sample Ave, San Diego, CA 92101',d:{fed:'fed-sd',state:'state-sd',county:'bos-3',city:'sdcc-3',school:'sdusd-c',cpg:'cpg-uptown'}},
  {id:'a2',full:'850 Sample Rd, San Diego, CA 92117',d:{fed:'fed-sd',state:'state-sd',county:'bos-2',city:'sdcc-6',school:'sdusd-a',cpg:'cpg-uptown'}},
  {id:'a3',full:'330 Sample St, San Diego, CA 92105',d:{fed:'fed-sd',state:'state-sd',county:'bos-4',city:'sdcc-4',school:'sdusd-e',cpg:'cpg-uptown'}}
];

/* Discussion boards. Keys: topic:, body:, place:, meet:, item:. Each holds threads with posts. */
const T=(id,title,kind,posts)=>({id,title,kind,posts});
const P=(who,text,t)=>({who,text,t});
const SEED_BOARDS={
  'topic:streets':{threads:[
    T('t1','Which streets are next for repaving?','question',[P('Marcus T.','Anyone know if the street repair amendment covers my block?','2026-11-15'),P('Priya S.','The staff list is in the December 1 agenda packet, page 12.','2026-11-16')]),
    T('t7','Is the 30th Street speed hump plan final on December 1?','question',[P('Owen M.','The 30th Street item goes to council December 1. Is that the final vote?','2026-11-17'),P('Helen W.','That vote approves the design and funding. Construction timing comes later, so check the item page.','2026-11-18')])]},
  'topic:housing':{threads:[
    T('t2','Does the noise ordinance affect construction hours?','question',[P('Renee B.','Asking for my building. Does this change weekend construction limits?','2026-11-14'),P('Greg H.','Yes. Saturdays now start at 8 a.m. with 48 hours of permit notice.','2026-11-15')]),
    T('t8','ADU impact fees should look at small units','opinion',[P('Sofia L.','Impact fees per square foot hit small units hardest. The study should look at that.','2026-11-12'),P('Greg H.','Agree. Compare a 400 square foot unit and an 800 square foot unit side by side.','2026-11-13')])]},
  'topic:budget':{threads:[
    T('t3','Where can I see the budget amendment in plain terms?','information',[P('Dana K.','Staff summary, page 2: funds move from reserves to repairs. Source link in the thread.','2026-11-16')]),
    T('t9','How much is left in reserves after the road repair move?','question',[P('Ben C.','The $18 million move leaves how much in reserves?','2026-11-11'),P('Dana K.','The staff summary says the reserve stays above the policy minimum. Page 4 has the table.','2026-11-12')])]},
  'topic:schools':{threads:[
    T('t10','Bus route changes for the new middle school','question',[P('Aaron D.','Are the Route 14 changes going to the school board on December 1?','2026-11-09'),P('Nadia K.','That is a district item, not a city one. Check the district board agenda for the date.','2026-11-10')]),
    T('t11','Holiday break schedule for after-school programs','question',[P('Sofia L.','Do the after-school programs run during the winter break week?','2026-11-16')])]},
  'topic:safety':{threads:[
    T('t12','Police response times in our district','information',[P('Jamal R.','A monthly response-time report by council district is proposed for January. It is on the December 7 agenda.','2026-11-18')]),
    T('t13','Lighting on the Park Boulevard trail','question',[P('Lena G.','Is the north entrance lighting in the November 10 funding?','2026-11-16'),P('Ben C.','Yes, the $650,000 includes trail lighting. Crews start in spring.','2026-11-16')])]},
  'body:sdcc':{threads:[
    T('t5','Council meetings and public comment','opinion',[P('Dana K.','Shorter comment periods make it hard to speak. Who else has noticed?','2026-11-12'),P('Owen M.','Two minutes is tight for a complex item. I hope the December 1 vote gets it right.','2026-11-13')]),
    T('t14','What gets discussed in closed session?','question',[P('Helen W.','Closed sessions are at 10 a.m. Monday. How do I read the litigation items?','2026-11-10'),P('Greg H.','The clerk posts the closed session agenda before the meeting. Item numbers match the public list.','2026-11-11')]),
    T('t15','Thank you for the noise ordinance vote','opinion',[P('Renee B.','Thank you for the Saturday construction window change. It helps our block.','2026-11-10'),P('Owen M.','Glad it passed 7-2, but the permit notice still needs work.','2026-11-11')])]},
  'body:bos':{threads:[
    T('t4','Question for the next supervisor meeting','question',[P('Renee B.','Will public comment time change for the December meeting?','2026-11-13'),P('Tomas V.','Public comment is set by the board chair. Check the December 8 agenda notes.','2026-11-14')]),
    T('t16','Winter shelter capacity for 2026-27','information',[P('Nadia K.','The contract approved November 17 keeps 600 winter beds, up from last season according to the staff summary.','2026-11-17'),P('Tomas V.','Good news. The summary does not say where the new beds are located.','2026-11-17')])]},
  'body:cpg-uptown':{threads:[
    T('t18','How do I attend the next planning meeting?','question',[P('Lena G.','New here. Can anyone in the planning area attend without being a member?','2026-11-12'),P('Ben C.','Yes, meetings are open to the public. Only elected voting members vote on recommendations.','2026-11-12')]),
    T('t19','What should the Park Boulevard plan include?','opinion',[P('Dana K.','We need protected bike lanes, not paint. Who agrees?','2026-11-15'),P('Aaron D.','Protected lanes and a crossing at Quince would help kids walk to school.','2026-11-16')])]},
  'place:sdcc-3':{threads:[
    T('t6','Park cleanup Saturday, who is coming?','question',[P('Marcus T.','Meeting at the north entrance at 9. Bring gloves.','2026-11-15'),P('Helen W.','I can bring extra bags and a rake.','2026-11-16')])]},
  'place:cpg-uptown':{threads:[
    T('t20','Short-term rental complaints on our blocks','question',[P('Jamal R.','Who handles noise complaints at short-term rentals?','2026-11-13'),P('Helen W.','Code enforcement handles the rental permits. Police handle loud parties. The group hears a quarterly report.','2026-11-14')])]},
  'meet:cal-2026-11-17-council-pm':{threads:[
    T('t21','What does the stormwater report mean for my street?','question',[P('Greg H.','The annual report lists runoff sites. Any way to check ours?','2026-11-17'),P('Priya S.','The report has a map on page 9. Look up your address range.','2026-11-18')])]},
  'meet:cal-2026-12-01-council-pm':{threads:[
    T('t22','Who is speaking on the public comment rules?','question',[P('Renee B.','Planning to speak December 1 about the two-minute limit. Tips?','2026-11-17'),P('Owen M.','Sign up with the clerk before the item is called. Bring a written copy too.','2026-11-18')])]},
  'meet:cal-2026-11-19-cpg':{threads:[
    T('t23','Questions to ask about the Park Boulevard presentation','question',[P('Dana K.','Our November 19 meeting includes the corridor plan. Suggested questions?','2026-11-17'),P('Aaron D.','Ask about parking loss and the construction timeline.','2026-11-18')])]},
  'item:it-1110-2':{threads:[
    T('t24','Reserves move: is this a good use?','opinion',[P('Marcus T.','Moving reserves to roads makes sense if the amount is one-time.','2026-11-10'),P('Dana K.','Staff says it is one-time, but the reserve target still needs watching.','2026-11-11')])]},
  'item:it-1201-1':{threads:[
    T('t25','Public comment: two minutes or three?','opinion',[P('Helen W.','Two minutes is too short for complex items. Three minutes minimum, please.','2026-11-18'),P('Lena G.','Two minutes is enough if you write a summary and bring the rest in writing.','2026-11-18')])]},
  'item:it-1208-1':{threads:[
    T('t17','Transit fare pilot: support or not?','opinion',[P('Marcus T.','A youth and senior fare pilot would help my commute. Hoping the December 8 item passes.','2026-11-18'),P('Priya S.','Wait for the cost estimate before deciding. Pilot costs matter.','2026-11-18')])]},
};
