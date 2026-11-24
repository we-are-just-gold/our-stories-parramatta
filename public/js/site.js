(function(){
  // Remember on this phone which of the three things are done, and show it on the buttons
  var KEY='os_done';
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function write(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  document.querySelectorAll('form[data-form]').forEach(function(f){ f.addEventListener('submit',function(){ var d=read(); d[f.getAttribute('name')]=1; write(d); }); });
  var d=read();
  document.querySelectorAll('[data-key]').forEach(function(a){
    if(d[a.getAttribute('data-key')]){ var t=a.querySelector('.done'); if(t) t.hidden=false; a.classList.add('is-done'); }
  });
  // On the day, mark the session that is on now or up next (Sydney time)
  try{
    var p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
    var v={}; p.forEach(function(x){ v[x.type]=x.value; });
    if(v.year+'-'+v.month+'-'+v.day==='2026-11-28'){
      var m=parseInt(v.hour,10)%24*60+parseInt(v.minute,10), key, label;
      if(m<600){ key='hear'; label='Up next'; }
      else if(m<720){ key='hear'; label='On now'; }
      else if(m<765){ key='lunch'; label='On now'; }
      else if(m<885){ key='create'; label='On now'; }
      else if(m<900){ key='share'; label='Up next'; }
      else if(m<1020){ key='share'; label='On now'; }
      if(key){
        document.querySelectorAll('.tile[data-session="'+key+'"] .now, .lunchbar[data-session="'+key+'"] .lt').forEach(function(n){ n.textContent=label; n.hidden=false; });
        if(label==='On now') document.querySelectorAll('.tabs a[data-session="'+key+'"]').forEach(function(t){ t.classList.add('is-now'); });
      }
    }
  }catch(e){}
})();
(function(){
  var form=document.querySelector('form[data-form]');
  if(!form) return;
  var submit=form.querySelector('button[type=submit]');
  function show(el,on){ if(el){ el.hidden=!on; el.querySelectorAll('input,textarea,select').forEach(function(i){ i.disabled=!on; if(i.hasAttribute('data-req')) i.required=on; }); } }

  // Age screen: 15 years or less ends the survey
  var rest=form.querySelector('[data-after-age]');
  var out=form.querySelector('[data-screen-out]');
  form.querySelectorAll('input[name=age]').forEach(function(r){
    r.addEventListener('change',function(){
      var under=r.checked && r.value==='15 years or less';
      if(rest) show(rest,!under);
      if(out) out.hidden=!under;
      if(submit) submit.hidden=under;
    });
  });

  // Reveal a field when one option is chosen: data-reveal="name=value" on the target
  form.querySelectorAll('[data-reveal]').forEach(function(target){
    var parts=target.getAttribute('data-reveal').split('=');
    var name=parts[0], values=parts[1].split('|');
    function sync(){
      var picked=form.querySelector('input[name="'+name+'"]:checked');
      show(target, !!picked && values.indexOf(picked.value)>-1);
    }
    form.querySelectorAll('input[name="'+name+'"]').forEach(function(r){ r.addEventListener('change',sync); });
    sync();
  });

  // Consent: a person under 18 cannot sign for themselves
  var minor=form.querySelector('[data-minor-stop]');
  if(minor){
    form.querySelectorAll('input[name=under_18]').forEach(function(r){
      r.addEventListener('change',function(){
        var self=r.checked && r.value==='Yes, I am under 18 myself';
        minor.hidden=!self;
        var sign=form.querySelector('[data-sign]');
        if(sign) show(sign,!self);
        if(submit) submit.hidden=self;
      });
    });
  }

  // Postcode: four digits only
  var pc=form.querySelector('input[name=postcode]');
  if(pc){ pc.addEventListener('input',function(){ pc.value=pc.value.replace(/\D/g,'').slice(0,4); }); }
})();

(function(){
  // Share your story: shrink a phone photo before sending, so it uploads quickly on venue Wi-Fi
  var form=document.querySelector('form[name="share-your-story"]'); if(!form) return;
  var input=form.querySelector('input[type=file]'); var msg=form.querySelector('[data-filemsg]');
  if(!input || !window.FormData || !window.fetch) return;
  function say(t){ if(msg){ msg.textContent=t; msg.hidden=!t; } }
  function shrink(file){
    return new Promise(function(resolve){
      var url=URL.createObjectURL(file), img=new Image();
      img.onload=function(){
        var max=1800, w=img.naturalWidth, h=img.naturalHeight, k=Math.min(1,max/Math.max(w,h));
        var c=document.createElement('canvas'); c.width=Math.round(w*k); c.height=Math.round(h*k);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url);
        c.toBlob(function(b){ resolve(b||file); },'image/jpeg',0.82);
      };
      img.onerror=function(){ URL.revokeObjectURL(url); resolve(file); };
      img.src=url;
    });
  }
  input.addEventListener('change',function(){ say(input.files[0] ? 'Picture added: '+input.files[0].name : ''); });
  form.addEventListener('submit',function(ev){
    var file=input.files && input.files[0]; if(!file) return;   // no picture: send the normal way
    ev.preventDefault();
    var btn=form.querySelector('button[type=submit]'); if(btn){ btn.disabled=true; btn.textContent='Sending'; }
    say('Sending your story and picture.');
    shrink(file).then(function(blob){
      if(blob.size>7*1024*1024){ throw new Error('big'); }
      var fd=new FormData(form); fd.delete('picture'); fd.append('picture',blob,'picture.jpg');
      return fetch('/',{method:'POST',body:fd});
    }).then(function(r){
      if(!r.ok) throw new Error('send');
      window.location.href='/thanks';
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.textContent='Send my story'; }
      say(e.message==='big' ? 'That picture is too large to send. Please choose a smaller one, or send your story without it.'
                            : 'That did not send. Check your connection and try again.');
    });
  });
})();
