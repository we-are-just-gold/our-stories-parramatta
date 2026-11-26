(function(){
  var box=document.querySelector('[data-counts]'); if(!box) return;
  function load(){
    fetch('/api/count',{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(j){
      box.querySelectorAll('[data-c]').forEach(function(b){ b.textContent=(j.counts||{})[b.getAttribute('data-c')]||0; });
    }).catch(function(){});
  }
  load(); setInterval(load,30000);
})();
