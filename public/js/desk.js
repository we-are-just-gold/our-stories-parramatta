(function(){
  var gate=document.querySelector('[data-deskgate]'), inside=document.querySelector('[data-deskinside]');
  if(!gate||!inside) return;
  var form=gate.querySelector('form'), input=form.querySelector('input'), msg=gate.querySelector('[data-gatemsg]'), saved=gate.querySelector('[data-saved]');
  var K='os_desk', code='', timer=null, filter='', last=null, lastRaw='', show='all', fshow='all', tab='people', open={};
  try{ code=sessionStorage.getItem(K)||''; }catch(e){}
  var $=function(s){ return inside.querySelector(s); };
  var todo=$('[data-todo]'), done=$('[data-done]'), doneWrap=$('[data-donewrap]'), doneCount=$('[data-donecount]'), run=$('[data-run]'), people=$('[data-people]'),
      status=$('[data-deskstatus]'), search=$('[data-search]'), formsList=$('[data-forms]'), newList=$('[data-newforms]'), newWrap=$('[data-newwrap]');
  function api(body){ body.code=code; return fetch('/api/desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); }
  function el(tag,cls,text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
  function sydneyNow(){
    try{
      var p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()), v={};
      p.forEach(function(x){ v[x.type]=x.value; });
      return {day:v.year+'-'+v.month+'-'+v.day, min:parseInt(v.hour,10)%24*60+parseInt(v.minute,10)};
    }catch(e){ return {day:'',min:0}; }
  }
  function clock(m){ var h=Math.floor(m/60), mm=m%60, ap=h<12?'am':'pm'; h=h%12||12; return h+(mm?'.'+('0'+mm).slice(-2):'')+ap; }
  function setTab(t){
    tab=t;
    inside.querySelectorAll('[data-tab]').forEach(function(b){ var on=b.getAttribute('data-tab')===t; b.classList.toggle('is-on',on); b.setAttribute('aria-selected',on?'true':'false'); });
    inside.querySelectorAll('[data-panel]').forEach(function(p){ p.classList.toggle('is-on',p.getAttribute('data-panel')===t); });
  }
  function check(id,on,kind,label,sub){
    var li=el('li','dtask'+(on?' is-done':'')+(kind?' k-'+kind:''));
    var lab=el('label'), box=el('input'); box.type='checkbox'; box.checked=!!on;
    box.addEventListener('change',function(){ li.classList.toggle('is-done',box.checked); api({tick:id,on:box.checked}).then(function(){ load(true); },function(){ load(true); }); });
    var txt=el('span','dt'); txt.appendChild(el('b',null,label)); if(sub) txt.appendChild(el('small',null,sub));
    lab.appendChild(box); lab.appendChild(txt); li.appendChild(lab); return li;
  }
  function line(strong,text){ var y=el('p','dline'); if(strong) y.appendChild(el('strong',null,strong)); y.appendChild(document.createTextNode(text)); return y; }
  function person(p,on){
    var li=el('li','dperson'+(p.arrived?' is-here':'')+(open[p.key]?' is-open':''));
    var row=el('button','drow'); row.type='button'; row.setAttribute('aria-expanded',open[p.key]?'true':'false');
    row.appendChild(el('b',null,p.name));
    var pills=el('span','dpills');
    if(p.noConsent) pills.appendChild(el('span','dpill warn','No consent form'));
    else if(p.photos==='sticker') pills.appendChild(el('span','dpill no','Bright sticker'));
    else pills.appendChild(el('span','dpill yes','Signed'));
    if(p.under18) pills.appendChild(el('span','dpill '+(p.youngPhotos==='sticker'||p.differs.length?'no':'yes'),'Young people'));
    if(p.needs&&p.needs.length) pills.appendChild(el('span','dpill yes','Needs'));
    if(p.differs.length) pills.appendChild(el('span','dpill warn','Ask'));
    row.appendChild(pills);
    var more=el('div','dmore'); more.hidden=!open[p.key];
    if(p.noConsent){
      more.appendChild(line('','No consent form yet. They fill it in on their own phone or on this device.'));
      var fill=el('a','btn small dfill','Consent form on this device, with their name in'); fill.href='/consent?desk=1';
      fill.addEventListener('click',function(){ try{ sessionStorage.setItem('os_prefill',p.name); }catch(e){} handOver(); });
      var fp=el('p'); fp.appendChild(fill); more.appendChild(fp);
    }
    else more.appendChild(line('Photos and video: ',p.photos==='sticker'?'no. Give them a bright sticker.':'happy to be in them.'));
    if(p.sessions&&p.sessions.length) more.appendChild(line('Booked: ',p.sessions.map(function(s){ return s.name+(s.count>1?' ('+s.count+' tickets)':''); }).join(', ')+'.'));
    else if(on) more.appendChild(line('','No booking under this name.'));
    (p.needs||[]).forEach(function(n){ more.appendChild(line(n.label+': ',n.value)); });
    if(p.under18) more.appendChild(line('Signed for: ',(p.young||'a young person')+'. '+(p.permission?'Permission to take part: yes. ':'Permission to take part: not ticked. ')+(p.youngPhotos==='sticker'?'Their photos cannot be published: bright stickers.':'Their photos can be published.')));
    if(p.differs.length) more.appendChild(el('p','dwarn','Forms disagree on '+p.differs.join(' and ')+'. Ask them.'));
    var extra=[]; if(p.desk) extra.push('Signed at the desk'); if(p.forms>1) extra.push(p.forms+' forms sent'); if(p.checkedIn) extra.push('Checked in on Humanitix');
    if(extra.length) more.appendChild(line('',extra.join('. ')+'.'));
    row.addEventListener('click',function(){ open[p.key]=!open[p.key]; li.classList.toggle('is-open',!!open[p.key]); more.hidden=!open[p.key]; row.setAttribute('aria-expanded',open[p.key]?'true':'false'); });
    var lab=el('label','darr'), box=el('input'); box.type='checkbox'; box.checked=p.arrived;
    box.addEventListener('change',function(){ li.classList.toggle('is-here',box.checked); api({arrived:p.key,on:box.checked}).then(function(){ load(true); },function(){ load(true); }); });
    lab.appendChild(box); lab.appendChild(el('span',null,'Arrived'));
    li.appendChild(row); li.appendChild(lab); li.appendChild(more); return li;
  }
  function when(ms){
    try{
      var p=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true}).formatToParts(new Date(ms)), v={};
      p.forEach(function(x){ v[x.type]=x.value; });
      var t=v.hour+'.'+v.minute+String(v.dayPeriod||'').toLowerCase().replace(/\s|\./g,'');
      var d=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney'}).format(new Date(ms));
      return d===sydneyNow().day?'Today '+t:v.weekday+' '+v.day+' '+v.month+', '+t;
    }catch(e){ return ''; }
  }
  function consentForm(f,isNew){
    var li=el('li','dform'+(f.arrived?' is-here':'')+(isNew?' is-new':''));
    var top=el('div','dform-top'); top.appendChild(el('b',null,f.name));
    var tm=el('time',null,when(f.at)); try{ tm.dateTime=new Date(f.at).toISOString(); }catch(e){} top.appendChild(tm); li.appendChild(top);
    var pills=el('span','dpills');
    pills.appendChild(f.photos==='sticker'?el('span','dpill no','Bright sticker'):el('span','dpill yes','Photos ok'));
    if(f.under18) pills.appendChild(el('span','dpill '+(f.youngPhotos==='sticker'?'no':'yes'),'Young people'));
    if(f.under18&&!f.permission) pills.appendChild(el('span','dpill warn','Permission not ticked'));
    if(f.desk) pills.appendChild(el('span','dpill yes','Signed at the desk'));
    if(f.arrived) pills.appendChild(el('span','dpill yes','Arrived'));
    li.appendChild(pills);
    if(f.under18) li.appendChild(line('Signed for: ',(f.young||'a young person')+'. '+(f.permission?'Permission to take part: yes. ':'Permission to take part: not ticked. ')+(f.youngPhotos==='sticker'?'Their photos cannot be published: bright stickers.':'Their photos can be published.')));
    if(isNew){
      var b=el('button','btn small ghost dseen','Seen'); b.type='button';
      b.addEventListener('click',function(){ li.remove(); api({tick:'seen-'+f.id,on:true}).then(function(){ load(true); },function(){ load(true); }); });
      var bp=el('p','dseenrow'); bp.appendChild(b); li.appendChild(bp);
    }
    return li;
  }
  function drawForms(j){
    var all=j.forms||[], q=filter.toLowerCase(), shown=0;
    var fresh=all.filter(function(f){ return !f.seen; });
    newList.textContent='';
    fresh.forEach(function(f){ newList.appendChild(consentForm(f,true)); });
    newWrap.hidden=!fresh.length;
    $('[data-newcount]').textContent=fresh.length;
    var pass={all:function(){ return true; }, sticker:function(f){ return f.photos==='sticker'||(f.under18&&f.youngPhotos==='sticker'); },
              young:function(f){ return f.under18; }, desk:function(f){ return f.desk; }, nothere:function(f){ return !f.arrived; }}[fshow];
    inside.querySelectorAll('[data-fshow]').forEach(function(b){ var is=b.getAttribute('data-fshow')===fshow; b.classList.toggle('is-on',is); b.setAttribute('aria-pressed',is?'true':'false'); });
    formsList.textContent='';
    all.forEach(function(f){
      if(!pass(f)) return;
      if(q && (f.name+' '+f.young).toLowerCase().indexOf(q)<0) return;
      shown++; formsList.appendChild(consentForm(f,false));
    });
    if(!shown) formsList.appendChild(el('li','dempty',q?'No consent form under that name.':(fshow==='all'?'No consent forms yet.':'None in this group.')));
    $('[data-t-consent]').textContent=fresh.length?fresh.length+' new':all.length;
    $('[data-n-forms]').textContent=all.length;
  }
  function draw(j){
    last=j;
    var openT=j.tasks.filter(function(t){ return !t.done; }), fin=j.tasks.filter(function(t){ return t.done; });
    todo.textContent=''; done.textContent='';
    if(!openT.length) todo.appendChild(el('li','dempty','Nothing waiting. New tasks appear here as consent forms come in.'));
    openT.forEach(function(t){ todo.appendChild(check(t.id,false,t.kind,t.text)); });
    fin.forEach(function(t){ done.appendChild(check(t.id,true,t.kind,t.text,t.auto?'Ticked when they were signed in.':'')); });
    doneWrap.hidden=!fin.length; doneCount.textContent=fin.length;
    var now=sydneyNow(), today=now.day==='2026-11-28';
    run.textContent='';
    j.run.forEach(function(r,i){
      var next=j.run[i+1], state='';
      if(today){ if(now.min>=r.at && (!next || now.min<next.at)) state='Now'; else if(now.min>=r.at && !r.done) state='Due'; }
      run.appendChild(check(r.id,r.done,state?state.toLowerCase():'',clock(r.at)+'. '+r.title+(state?' ('+state+')':''),r.text));
    });
    var hx=j.humanitix||{status:'off'}, on=hx.status==='ok';
    inside.querySelectorAll('[data-hxonly]').forEach(function(e){ e.hidden=!on; });
    var hxnote=$('[data-hxnote]');
    if(hx.status==='error'){ hxnote.textContent='Humanitix did not answer'+(hx.code?' (error '+hx.code+')':'')+', so this shows consent forms only. It tries again every minute.'; hxnote.hidden=false; }
    else if(on && hx.stale){ hxnote.textContent='Humanitix is not answering right now. The bookings shown are from the last time it did.'; hxnote.hidden=false; }
    else hxnote.hidden=true;
    if(!on && (show==='noconsent'||show==='needs')) show='all';
    inside.querySelectorAll('[data-show]').forEach(function(b){ var is=b.getAttribute('data-show')===show; b.classList.toggle('is-on',is); b.setAttribute('aria-pressed',is?'true':'false'); });
    var q=filter.toLowerCase(), shown=0;
    var pass={all:function(){ return true; }, noconsent:function(p){ return p.noConsent; }, sticker:function(p){ return p.photos==='sticker'||(p.under18&&p.youngPhotos==='sticker'); },
              young:function(p){ return p.under18; }, needs:function(p){ return p.needs&&p.needs.length; }, here:function(p){ return p.arrived; }, nothere:function(p){ return !p.arrived; }}[show];
    people.textContent='';
    j.people.forEach(function(p){
      if(!q && !pass(p)) return;
      if(q && (p.name+' '+p.young).toLowerCase().indexOf(q)<0) return;
      shown++; people.appendChild(person(p,on));
    });
    if(!shown) people.appendChild(el('li','dempty',q?'Nobody by that name. They may be on someone else’s booking: ask who booked.':(show==='all'?'Nobody yet.':'Nobody in this group.')));
    var withForm=j.people.filter(function(p){ return !p.noConsent; });
    $('[data-n-people]').textContent=withForm.length;
    $('[data-n-here]').textContent=j.people.filter(function(p){ return p.arrived; }).length;
    $('[data-n-stickers]').textContent=j.tasks.filter(function(t){ return t.kind==='sticker' && !t.done; }).length;
    $('[data-n-young]').textContent=j.people.filter(function(p){ return p.under18; }).length;
    $('[data-n-booked]').textContent=j.people.filter(function(p){ return p.booked; }).length;
    $('[data-n-noconsent]').textContent=j.people.filter(function(p){ return p.noConsent; }).length;
    var tix=$('[data-tickets]'); tix.textContent='';
    var sold=0, cap=0, arr=0, allCap=true;
    function tixRow(name,s,c,a,total){
      var li=el('li','dtx'+(total?' is-total':''));
      li.appendChild(el('b','dtx-name',name));
      var top=el('div','dtx-top');
      top.appendChild(el('span','dtx-pct',c?Math.round(s/c*100)+'%':''));
      top.appendChild(el('span','dtx-n',c?s+' / '+c:String(s)));
      li.appendChild(top);
      var bar=el('div','dtx-bar'), fill=el('i'), here=el('i','here');
      var base=c||s||1; fill.style.width=Math.min(100,Math.round(s/base*100))+'%'; here.style.width=Math.min(100,Math.round(a/base*100))+'%';
      bar.appendChild(fill); bar.appendChild(here); li.appendChild(bar);
      li.appendChild(el('small',null,a+' arrived.'+(c&&s>=c?' Full.':c?' '+(c-s)+' left.':'')));
      return li;
    }
    (j.types||[]).forEach(function(x){ sold+=x.sold; cap+=x.capacity; arr+=x.arrived||0; if(!x.capacity) allCap=false; tix.appendChild(tixRow(x.name,x.sold,x.capacity,x.arrived||0)); });
    if((j.types||[]).length) tix.appendChild(tixRow('All tickets',sold,allCap?cap:0,arr,true));
    $('[data-t-people]').textContent=j.people.length;
    $('[data-t-todo]').textContent=openT.length;
    drawForms(j);
  }
  function load(force){
    if(!code) return;
    api({list:true}).then(function(r){
      if(r.status===403){ lock('That password is not right. Try again, or ask Thom or Kyriakos.'); throw 0; }
      if(!r.ok) throw 1; return r.text();
    }).then(function(raw){
      gate.hidden=true; inside.hidden=false; status.hidden=true;
      // Only redraw when something changed, so the list does not jump under a finger.
      if(raw===lastRaw && force!==true) return;
      lastRaw=raw; draw(JSON.parse(raw));
    }).catch(function(e){ if(e!==0 && !inside.hidden){ status.textContent='Waiting for the connection'; status.hidden=false; } });
  }
  function lock(text){
    code=''; lastRaw=''; try{ sessionStorage.removeItem(K); }catch(e){}
    clearInterval(timer); timer=null; inside.hidden=true; gate.hidden=false; people.textContent=''; todo.textContent=''; done.textContent=''; formsList.textContent=''; newList.textContent='';
    if(text){ msg.textContent=text; msg.hidden=false; }
  }
  function start(){ load(true); if(!timer) timer=setInterval(function(){ if(!document.hidden) load(); },5000); }
  form.addEventListener('submit',function(ev){ ev.preventDefault(); code=input.value; msg.hidden=true; saved.hidden=true; try{ sessionStorage.setItem(K,code); }catch(e){} input.value=''; start(); });
  search.addEventListener('input',function(){ filter=search.value.trim(); if(filter && tab!=='people' && tab!=='consent') setTab('people'); if(last) draw(last); });
  inside.querySelectorAll('[data-show]').forEach(function(b){ b.addEventListener('click',function(){ show=b.getAttribute('data-show'); if(last) draw(last); }); });
  inside.querySelectorAll('[data-fshow]').forEach(function(b){ b.addEventListener('click',function(){ fshow=b.getAttribute('data-fshow'); if(last) draw(last); }); });
  $('[data-seenall]').addEventListener('click',function(){ var ids=((last&&last.forms)||[]).filter(function(f){ return !f.seen; }).map(function(f){ return 'seen-'+f.id; }); newWrap.hidden=true; api({seen:ids}).then(function(){ load(true); },function(){ load(true); }); });
  inside.querySelectorAll('[data-tab]').forEach(function(b){ b.addEventListener('click',function(){ setTab(b.getAttribute('data-tab')); window.scrollTo(0,0); }); });
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) load(); });
  $('[data-lock]').addEventListener('click',function(){ lock(''); });
  // Handing the device to someone to sign: lock the desk first, so they cannot go back to the list.
  function handOver(){ try{ sessionStorage.removeItem(K); }catch(e){} code=''; clearInterval(timer); timer=null; people.textContent=''; todo.textContent=''; done.textContent=''; formsList.textContent=''; newList.textContent=''; inside.hidden=true; gate.hidden=false; }
  var hand=$('[data-handover]');
  if(hand) hand.addEventListener('click',function(){ try{ sessionStorage.removeItem('os_prefill'); }catch(e){} handOver(); });
  try{ if(sessionStorage.getItem('desk_saved')){ sessionStorage.removeItem('desk_saved'); saved.hidden=false; setTab('consent'); } }catch(e){}
  // Coming back with the browser's back button must not show the list either.
  window.addEventListener('pageshow',function(ev){ if(ev.persisted){ var c=''; try{ c=sessionStorage.getItem(K)||''; }catch(e){} if(!c) lock(''); } });
  if(code) start();
})();
