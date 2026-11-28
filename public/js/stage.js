(function(){
  var box=document.querySelector('[data-stagebox]'); if(!box) return;
  var k='', code='', timer=null, last='';
  function el(t,c,x){ var e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; }
  function hm(ms){ return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',hour:'numeric',minute:'2-digit'}).format(new Date(ms)).replace(' ','').toLowerCase(); }
  function creds(){ try{ k=localStorage.getItem('os_team')||''; code=sessionStorage.getItem('os_eval')||''; }catch(e){} return k||code; }
  function section(title,hint,items,draw,empty){
    var s=el('section','stg'); var h=el('h3',null,title+' '); h.appendChild(el('b','stgn',String(items.length))); s.appendChild(h);
    if(hint) s.appendChild(el('p','hint',hint));
    var ul=el('ul','stglist'); if(!items.length) ul.appendChild(el('li','dempty',empty)); items.slice().reverse().forEach(function(x){ ul.appendChild(draw(x)); }); s.appendChild(ul); return s;
  }
  function draw(j){
    var raw=JSON.stringify(j); if(raw===last) return; last=raw;
    var out=box.querySelector('[data-stageout]'); out.textContent='';
    out.appendChild(section('Stage spots','Asked on the app to speak in Share. Newest first.',j.stage||[],function(x){
      var li=el('li','stgi'); var top=el('div','stgtop'); top.appendChild(el('b',null,x.name||'No name given')); top.appendChild(el('span','stgt',(x.minutes||'')+' · '+hm(x.at))); li.appendChild(top); return li; },'Nobody yet.'));
    out.appendChild(section('To read out for someone','Sent from Share by people who would rather stay in their seat.',j.read||[],function(x){
      var li=el('li','stgi'); var top=el('div','stgtop'); top.appendChild(el('b',null,x.name?'Read with: '+x.name:'No name to read with')); top.appendChild(el('span','stgt',hm(x.at))); li.appendChild(top);
      li.appendChild(el('p','stgtext',x.text)); return li; },'Nothing yet.'));
    out.appendChild(section('Stories sent','Everything sent through Share your story today.',j.stories||[],function(x){
      var li=el('li','stgi'); var top=el('div','stgtop'); top.appendChild(el('b',null,x.name||'Anonymous')); top.appendChild(el('span','stgt',hm(x.at))); li.appendChild(top);
      var p=el('span','dpills'); p.appendChild(el('span','dpill '+(x.name?'yes':'no'),x.nameAs||'')); if(x.portrait) p.appendChild(el('span','dpill yes','Wants a portrait')); if(x.adult && !/^yes/i.test(x.adult)) p.appendChild(el('span','dpill warn','Under 18')); if(x.pics.length) p.appendChild(el('span','dpill yes',x.pics.length+(x.pics.length>1?' pictures':' picture'))); li.appendChild(p);
      var d=el('details','stgd'); d.appendChild(el('summary',null,(x.text||'').split(/\r?\n/)[0].slice(0,90)||'Read the story')); d.appendChild(el('p','stgtext',x.text));
      x.pics.forEach(function(u,i){ var a=el('a',null,'Picture '+(i+1)); a.href=u; a.target='_blank'; a.rel='noopener'; d.appendChild(a); d.appendChild(document.createTextNode(' ')); });
      li.appendChild(d); return li; },'None yet.'));
  }
  function load(){
    if(!creds()){ box.querySelector('[data-stagemsg]').textContent='Sign in first.'; return; }
    fetch('/api/stage',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:k,code:code})})
      .then(function(r){ if(!r.ok) throw r; return r.json(); })
      .then(function(j){ var m=box.querySelector('[data-stagemsg]'); m.textContent='Updated '+hm(Date.now())+'. Updates every 15 seconds.'; draw(j); })
      .catch(function(){ box.querySelector('[data-stagemsg]').textContent='Waiting for the connection'; });
  }
  function go(){ load(); if(!timer) timer=setInterval(function(){ if(!document.hidden && !box.closest('[hidden]')) load(); },15000); }
  // Start once the page is unlocked (the gate sets the stored key or password)
  var tries=0, w=setInterval(function(){ tries++; if(creds() && !box.closest('[hidden]')){ clearInterval(w); go(); } if(tries>3600) clearInterval(w); },1000);
  document.addEventListener('visibilitychange',function(){ if(!document.hidden && timer) load(); });
})();
