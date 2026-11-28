(function(){
  var grid=document.querySelector('[data-qfgrid]'); if(!grid) return;
  var total=document.querySelector('[data-qftotal]'), status=document.querySelector('[data-status]'), locked=document.querySelector('[data-qflocked]');
  var k='', code=''; try{ k=localStorage.getItem('os_team')||''; code=sessionStorage.getItem('os_eval')||''; }catch(e){}
  if(!k && !code){ locked.hidden=false; grid.hidden=true; return; }
  var norm=function(s){ return String(s).replace(/[’']/g,"'").trim().toLowerCase(); };
  function draw(j){
    if(total) total.textContent=j.total||0;
    grid.querySelectorAll('[data-qf]').forEach(function(card){
      var c=(j.counts||{})[card.getAttribute('data-qf')]||{}, byNorm={}, sum=0;
      Object.keys(c).forEach(function(k){ byNorm[norm(k)]=(byNorm[norm(k)]||0)+c[k]; sum+=c[k]; });
      card.querySelectorAll('[data-opt]').forEach(function(row){
        var n=byNorm[norm(row.getAttribute('data-opt'))]||0, pct=sum?Math.round(n/sum*100):0;
        row.querySelector('i').style.width=pct+'%';
        row.querySelector('.qfn').textContent=sum?pct+'%':'0';
        row.querySelector('.qfn').title=n+' of '+sum;
        row.setAttribute('aria-label',row.getAttribute('data-opt')+': '+n+' of '+sum);
      });
    });
  }
  function load(){
    fetch('/api/eval',{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({tally:'quick-fire',k:k,code:code})})
      .then(function(r){ if(r.status===403){ locked.hidden=false; grid.hidden=true; throw 0; } if(!r.ok) throw r; return r.json(); })
      .then(function(j){ draw(j); if(status) status.hidden=true; })
      .catch(function(){ if(status){ status.textContent='Waiting for the connection'; status.hidden=false; } });
  }
  load(); setInterval(function(){ if(!document.hidden) load(); },4000);
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) load(); });
})();
