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
  var total=document.querySelector('[data-total]'), status=document.querySelector('[data-status]');
  function card(a){
    var li=document.createElement('li'); li.className='ans'+(first?'':' is-new'); li.setAttribute('data-id',a.id);
    var p=document.createElement('p'); p.textContent=a.t; li.appendChild(p);
    if(host){ var b=document.createElement('button'); b.type='button'; b.className='hide'; b.textContent='Hide';
      b.addEventListener('click',function(){ send({hide:a.id,code:code}); }); li.appendChild(b); }
    return li;
  }
  function draw(list){
    var ids={}, n={};
    list.forEach(function(a){ ids[a.id]=1; n[a.q]=(n[a.q]||0)+1;
      if(!seen[a.id] && cols[a.q]){ seen[a.id]=1; cols[a.q].list.insertBefore(card(a),cols[a.q].list.firstChild); } });
    Object.keys(seen).forEach(function(id){ if(!ids[id]){ delete seen[id]; var el=wall.querySelector('[data-id="'+id+'"]'); if(el) el.remove(); } });
    QS.forEach(function(q){ cols[q[0]].count.textContent=n[q[0]]||0; });
    if(total) total.textContent=list.length;
    wall.classList.toggle('is-empty',!list.length);
    first=false;
  }
  function load(){
    fetch('/api/poll',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(j){ draw(j.answers||[]); if(status) status.hidden=true; })
      .catch(function(){ if(status){ status.textContent='Waiting for the connection'; status.hidden=false; } });
  }
  function send(body){ return fetch('/api/poll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){ if(!r.ok && status){ status.textContent='That code did not work'; status.hidden=false; } load(); }); }
  if(host){
    var bar=document.querySelector('[data-hostbar]');
    if(bar){ bar.hidden=false;
      bar.querySelector('input').addEventListener('input',function(e){ code=e.target.value; });
      var armed=false, clr=bar.querySelector('[data-clear]');
      clr.addEventListener('click',function(){ if(!armed){ armed=true; clr.textContent='Tap again to clear every answer'; setTimeout(function(){ armed=false; clr.textContent='Clear all answers'; },4000); return; } armed=false; clr.textContent='Clear all answers'; send({clear:true,code:code}); });
    }
  }
  load(); setInterval(load,3000);
})();
