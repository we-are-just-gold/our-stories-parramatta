(function(){
  var QS=[['i_like','In my community, I like'],['i_do_not_like','In my community, I do not like'],['i_wish','In my community, I wish']];
  // Sending: the three questions form on the Hear page
  var f=document.querySelector('form[name="in-my-community"]');
  if(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=f.querySelector('button[type=submit]'), data={}, any=false;
      QS.forEach(function(q){ var v=(f.querySelector('[name="'+q[0]+'"]').value||'').trim(); if(v){ data[q[0]]=v; any=true; } });
      var msg=f.querySelector('[data-pollmsg]');
      if(!any){ if(msg){ msg.textContent='Finish at least one sentence first.'; msg.hidden=false; } return; }
      if(btn){ btn.disabled=true; btn.textContent='Sending'; }
      var record=fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(f)).toString()}).catch(function(){});
      var live=fetch('/api/poll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){ return r.ok; }).catch(function(){ return false; });
      Promise.all([record,live]).then(function(r){ location.href = r[1] ? '/results' : '/thanks'; });
    });
  }
  // Showing: the results page on a phone and the big screen
  var wall=document.querySelector('[data-wall]');
  if(!wall) return;
  var host=location.hash==='#host', code='', seen={}, first=true;
  var cols={};
  QS.forEach(function(q){ cols[q[0]]={list:wall.querySelector('[data-col="'+q[0]+'"] .answers'),count:wall.querySelector('[data-col="'+q[0]+'"] .count')}; });
  var total=document.querySelector('[data-total]'), status=document.querySelector('[data-status]'), note=document.querySelector('[data-waitnote]');
  var bar=document.querySelector('[data-hostbar]'), waitcount=bar&&bar.querySelector('[data-waitcount]'), holdbox=bar&&bar.querySelector('[data-hold]');
  function button(text,cls,fn){ var b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=text; b.addEventListener('click',fn); return b; }
  function card(a){
    var li=document.createElement('li'); li.className='ans'+(first?'':' is-new')+(a.w?' is-waiting':''); li.setAttribute('data-id',a.id);
    var p=document.createElement('p'); p.textContent=a.t; li.appendChild(p);
    if(host){
      var acts=document.createElement('span'); acts.className='acts';
      if(a.w) acts.appendChild(button('Show','hide show',function(){ send({show:a.id,code:code}); }));
      acts.appendChild(button('Hide','hide',function(){ send({hide:a.id,code:code}); }));
      li.appendChild(acts);
    }
    return li;
  }
  function draw(j){
    var list=j.answers||[], ids={}, n={}, shown=0;
    list.forEach(function(a){ ids[a.id]=1; var state=a.w?'w':'s';
      if(!a.w){ n[a.q]=(n[a.q]||0)+1; shown++; }
      if(!cols[a.q]) return;
      if(seen[a.id] && seen[a.id]!==state){ var old=wall.querySelector('[data-id="'+a.id+'"]'); if(old) old.replaceWith(card(a)); seen[a.id]=state; }
      else if(!seen[a.id]){ seen[a.id]=state; cols[a.q].list.insertBefore(card(a),cols[a.q].list.firstChild); } });
    Object.keys(seen).forEach(function(id){ if(!ids[id]){ delete seen[id]; var el=wall.querySelector('[data-id="'+id+'"]'); if(el) el.remove(); } });
    QS.forEach(function(q){ cols[q[0]].count.textContent=n[q[0]]||0; });
    if(total) total.textContent=shown;
    wall.classList.toggle('is-empty',!list.length);
    var w=j.waiting||0;
    if(waitcount) waitcount.textContent=w+' waiting';
    if(holdbox && typeof j.hold==='boolean' && document.activeElement!==holdbox) holdbox.checked=j.hold;
    if(note){
      if(w && !(host && code)){ note.textContent=(w===1?'1 answer is':w+' answers are')+' waiting for a host to show '+(w===1?'it':'them')+'.'; note.hidden=false; }
      else note.hidden=true;
    }
    first=false;
  }
  function fail(r){ if(status){ status.textContent=(r&&r.status===403)?'That code did not work':'Waiting for the connection'; status.hidden=false; } }
  function load(){
    var req=(host&&code)
      ? fetch('/api/poll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pending:true,code:code})})
      : fetch('/api/poll',{cache:'no-store'});
    req.then(function(r){ if(!r.ok) throw r; return r.json(); })
      .then(function(j){ draw(j); if(status) status.hidden=true; })
      .catch(fail);
  }
  function send(body){ return fetch('/api/poll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){ if(!r.ok) fail(r); load(); }).catch(fail); }
  if(host && bar){
    bar.hidden=false;
    var timer;
    bar.querySelector('input[type=password]').addEventListener('input',function(e){ code=e.target.value; clearTimeout(timer); timer=setTimeout(load,500); });
    bar.querySelector('[data-showall]').addEventListener('click',function(){ send({showAll:true,code:code}); });
    holdbox.addEventListener('change',function(){ send({hold:holdbox.checked,code:code}); });
    var armed=false, clr=bar.querySelector('[data-clear]');
    clr.addEventListener('click',function(){ if(!armed){ armed=true; clr.textContent='Tap again to clear every answer'; setTimeout(function(){ armed=false; clr.textContent='Clear all answers'; },4000); return; } armed=false; clr.textContent='Clear all answers'; send({clear:true,code:code}); });
  }
  load(); setInterval(load,3000);
})();
