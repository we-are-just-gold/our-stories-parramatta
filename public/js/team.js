(function(){
  var H='a3c4480df0d51a006ce17f5712259ec5b05bee492919163137b0d015222607fb', K='os_team';
  var gate=document.querySelector('[data-gate]'), inside=document.querySelector('[data-inside]');
  if(!gate||!inside) return;
  var form=gate.querySelector('[data-gateform]'), msg=gate.querySelector('[data-gatemsg]'), input=form.querySelector('input');
  var next=''; try{ next=new URLSearchParams(location.search).get('next')||''; }catch(e){}
  if(!/^\/(facilitators|volunteers)$/.test(next)) next='';
  function ok(){ try{ return localStorage.getItem(K)===H; }catch(e){ return false; } }
  function open(){ if(next){ location.replace(next); return; } gate.hidden=true; inside.hidden=false; }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf),function(b){ return ('0'+b.toString(16)).slice(-2); }).join(''); }
  if(ok()){ open(); return; }
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var v=(input.value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(d){
      if(hex(d)===H){ try{ localStorage.setItem(K,H); }catch(e){} msg.hidden=true; open(); }
      else{ msg.hidden=false; input.value=''; input.focus(); }
    });
  });
})();
