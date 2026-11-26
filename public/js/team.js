(function(){
  var HOST='9792875ded1497999a4de46722835339cce9346191da1c1ebc4ec5c144d9d407', VOL='a3c4480df0d51a006ce17f5712259ec5b05bee492919163137b0d015222607fb', K='os_team';
  var gate=document.querySelector('[data-gate]'), inside=document.querySelector('[data-inside]');
  if(!gate||!inside) return;
  var want=gate.getAttribute('data-role');
  var form=gate.querySelector('[data-gateform]'), msg=gate.querySelector('[data-gatemsg]'), other=gate.querySelector('[data-gateother]'), input=form.querySelector('input');
  var next=''; try{ next=new URLSearchParams(location.search).get('next')||''; }catch(e){}
  if(next!=='/facilitators') next='';
  function roleOf(v){ return v===HOST?'host':(v===VOL?'vol':''); }
  function stored(){ try{ return roleOf(localStorage.getItem(K)); }catch(e){ return ''; } }
  function allowed(r){ return r==='host' || (want==='vol' && r==='vol'); }
  function open(){ if(next){ location.replace(next); return; } gate.hidden=true; inside.hidden=false; contacts(); if(location.hash){ var t=document.getElementById(location.hash.slice(1)); if(t) t.scrollIntoView(); } }
  var cur='';
  function contacts(){
    var box=document.querySelector('[data-contacts]'); if(!box||!window.fetch) return;
    var k=cur; try{ k=k||localStorage.getItem(K)||''; }catch(e){}
    fetch('/api/team',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({k:k})})
      .then(function(r){ return r.ok?r.json():null; })
      .then(function(j){
        if(!j||!j.contacts||!j.contacts.length) return;
        box.textContent='';
        j.contacts.forEach(function(c){
          var d=document.createElement('p'); d.className='contactcard';
          var b=document.createElement('b'); b.textContent=c.name; d.appendChild(b);
          var r=document.createElement('span'); r.textContent=c.role; d.appendChild(r);
          var t=document.createElement('a'); t.href='tel:'+String(c.phone).replace(/[^0-9+]/g,''); t.textContent=c.phone; d.appendChild(t);
          var m=document.createElement('a'); m.href='mailto:'+c.email; m.textContent=c.email; d.appendChild(m);
          box.appendChild(d);
        });
        box.hidden=false;
      }).catch(function(){});
  }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf),function(b){ return ('0'+b.toString(16)).slice(-2); }).join(''); }
  if(allowed(stored())){ open(); return; }
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=(input.value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(d){
      var h=hex(d), r=roleOf(h);
      msg.hidden=true; if(other) other.hidden=true;
      if(!r){ msg.hidden=false; input.value=''; input.focus(); return; }
      if(!allowed(r)){ if(other) other.hidden=false; input.value=''; input.focus(); return; }
      cur=h;
      try{ if(stored()!=='host') localStorage.setItem(K,h); }catch(e){}
      open();
    });
  });
})();
