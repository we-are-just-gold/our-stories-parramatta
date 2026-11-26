(function(){
  var gate=document.querySelector('[data-deskgate]'), inside=document.querySelector('[data-deskinside]');
  if(!gate||!inside) return;
  var form=gate.querySelector('form'), input=form.querySelector('input'), msg=gate.querySelector('[data-gatemsg]');
  var K='os_desk', code='', timer=null, filter='', last=null;
  try{ code=sessionStorage.getItem(K)||''; }catch(e){}
  var $=function(s){ return inside.querySelector(s); };
  var todo=$('[data-todo]'), done=$('[data-done]'), doneWrap=$('[data-donewrap]'), doneCount=$('[data-donecount]'), run=$('[data-run]'), people=$('[data-people]'),
      status=$('[data-deskstatus]'), search=$('[data-search]'), saved=$('[data-saved]');
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
  function check(id,on,kind,label,sub){
    var li=el('li','dtask'+(on?' is-done':'')+(kind?' k-'+kind:''));
    var lab=el('label'), box=el('input'); box.type='checkbox'; box.checked=!!on;
    box.addEventListener('change',function(){ li.classList.toggle('is-done',box.checked); api({tick:id,on:box.checked}).then(load,load); });
    var txt=el('span','dt'); txt.appendChild(el('b',null,label)); if(sub) txt.appendChild(el('small',null,sub));
    lab.appendChild(box); lab.appendChild(txt); li.appendChild(lab); return li;
  }
  function draw(j){
    last=j;
    var open=j.tasks.filter(function(t){ return !t.done; }), fin=j.tasks.filter(function(t){ return t.done; });
    todo.textContent=''; done.textContent='';
    if(!open.length) todo.appendChild(el('li','dempty','Nothing waiting. New tasks appear here as consent forms come in.'));
    open.forEach(function(t){ todo.appendChild(check(t.id,false,t.kind,t.text)); });
    fin.forEach(function(t){ done.appendChild(check(t.id,true,t.kind,t.text)); });
    doneWrap.hidden=!fin.length; doneCount.textContent=fin.length;
    var now=sydneyNow(), today=now.day==='2026-11-28';
    run.textContent='';
    j.run.forEach(function(r,i){
      var next=j.run[i+1], state='';
      if(today){ if(now.min>=r.at && (!next || now.min<next.at)) state='Now'; else if(now.min>=r.at && !r.done) state='Due'; }
      var li=check(r.id,r.done,state?state.toLowerCase():'',clock(r.at)+'. '+r.title+(state?' ('+state+')':''),r.text);
      run.appendChild(li);
    });
    var q=filter.toLowerCase(), shown=0;
    people.textContent='';
    j.people.forEach(function(p){
      if(q && (p.name+' '+p.young).toLowerCase().indexOf(q)<0) return; shown++;
      var li=el('li','dperson'+(p.arrived?' is-here':''));
      var lab=el('label','darr'), box=el('input'); box.type='checkbox'; box.checked=p.arrived;
      box.addEventListener('change',function(){ li.classList.toggle('is-here',box.checked); api({arrived:p.key,on:box.checked}).then(load,load); });
      lab.appendChild(box); lab.appendChild(el('span',null,'Arrived'));
      var body=el('div','dbody'); body.appendChild(el('b',null,p.name));
      var pills=el('p','dpills');
      pills.appendChild(el('span','dpill '+(p.photos==='sticker'?'no':'yes'),p.photos==='sticker'?'Bright sticker':'Happy to be in photos'));
      if(p.desk) pills.appendChild(el('span','dpill yes','Signed at the desk'));
      if(p.forms>1) pills.appendChild(el('span','dpill yes',p.forms+' forms'));
      body.appendChild(pills);
      if(p.under18){
        var y=el('p','dyoung');
        y.appendChild(el('strong',null,'Signed for: '+(p.young||'a young person')+'. '));
        y.appendChild(document.createTextNode((p.permission?'Permission to take part: yes. ':'Permission to take part: not ticked. ')+(p.youngPhotos==='sticker'?'Their photos cannot be published: bright stickers.':'Their photos can be published.')));
        body.appendChild(y);
      }
      if(p.differs.length) body.appendChild(el('p','dwarn','Forms disagree on '+p.differs.join(' and ')+'. Ask them.'));
      li.appendChild(body); li.appendChild(lab); people.appendChild(li);
    });
    if(!shown) people.appendChild(el('li','dempty',q?'Nobody by that name has sent a consent form.':'No consent forms yet.'));
    var here=j.people.filter(function(p){ return p.arrived; }).length;
    var young=j.people.filter(function(p){ return p.under18; }).length;
    $('[data-n-people]').textContent=j.people.length;
    $('[data-n-here]').textContent=here;
    $('[data-n-stickers]').textContent=j.tasks.filter(function(t){ return t.kind==='sticker' && !t.done; }).length;
    $('[data-n-young]').textContent=young;
  }
  function load(){
    if(!code) return;
    api({list:true}).then(function(r){
      if(r.status===403){ lock('That password is not right. Try again, or ask Thom or Kyriakos.'); throw 0; }
      if(!r.ok) throw 1; return r.json();
    }).then(function(j){ gate.hidden=true; inside.hidden=false; status.hidden=true; draw(j); })
      .catch(function(e){ if(e!==0 && !inside.hidden){ status.textContent='Waiting for the connection'; status.hidden=false; } });
  }
  function lock(text){ code=''; try{ sessionStorage.removeItem(K); }catch(e){} clearInterval(timer); timer=null; inside.hidden=true; gate.hidden=false; if(text){ msg.textContent=text; msg.hidden=false; } }
  function start(){ load(); if(!timer) timer=setInterval(function(){ if(!document.hidden) load(); },5000); }
  form.addEventListener('submit',function(ev){ ev.preventDefault(); code=input.value; msg.hidden=true; try{ sessionStorage.setItem(K,code); }catch(e){} input.value=''; start(); });
  search.addEventListener('input',function(){ filter=search.value.trim(); if(last) draw(last); });
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) load(); });
  var lockBtn=$('[data-lock]'); if(lockBtn) lockBtn.addEventListener('click',function(){ lock(''); });
  try{ if(sessionStorage.getItem('desk_saved')){ sessionStorage.removeItem('desk_saved'); saved.hidden=false; setTimeout(function(){ saved.hidden=true; },8000); } }catch(e){}
  if(code) start();
})();
