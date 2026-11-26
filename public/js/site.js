(function(){
  // Remember on this phone which of the three things are done, and show it on the buttons
  var KEY='os_done';
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ return {}; } }
  function write(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  document.querySelectorAll('form[data-form]').forEach(function(f){ f.addEventListener('submit',function(){ var d=read(); d[f.getAttribute('name')]=1; write(d);
    try{ navigator.sendBeacon('/api/count',new Blob([JSON.stringify({form:f.getAttribute('name')})],{type:'application/json'})); }catch(e){} }); });
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
  // Any form with pictures: up to five, each shrunk before sending so they upload quickly on venue Wi-Fi
  var box=document.querySelector('[data-pics]'); if(!box || !window.FormData || !window.fetch) return;
  var form=box.closest('form'), list=form.querySelector('[data-piclist]'), msg=form.querySelector('[data-filemsg]');
  var sendBtn=form.querySelector('button[type=submit]'), sendLabel=sendBtn ? sendBtn.textContent : 'Send';
  var NAMES=['picture','picture_2','picture_3','picture_4','picture_5'], MAX=NAMES.length, files=[];
  var picker=box.querySelector('input[type=file]'), lab=box.querySelector('label'), firstLabel=lab.getAttribute('data-first')||lab.textContent; picker.multiple=true; picker.removeAttribute('name');
  box.classList.add('js-pics');
  box.querySelectorAll('[data-extra]').forEach(function(d){ d.remove(); });
  function say(t){ if(msg){ msg.textContent=t; msg.hidden=!t; } }
  function draw(){
    list.innerHTML=''; list.hidden=!files.length;
    files.forEach(function(f,n){
      var li=document.createElement('li'), im=document.createElement('img'), s=document.createElement('span'), b=document.createElement('button');
      im.alt=''; im.src=URL.createObjectURL(f); im.onload=function(){ URL.revokeObjectURL(im.src); };
      s.textContent=f.name; b.type='button'; b.textContent='Remove';
      b.addEventListener('click',function(){ files.splice(n,1); draw(); say(''); });
      li.appendChild(im); li.appendChild(s); li.appendChild(b); list.appendChild(li);
    });
    lab.textContent=files.length ? (files.length<MAX ? 'Add another picture' : 'Five pictures added') : firstLabel;
    picker.disabled=files.length>=MAX;
    box.classList.toggle('is-full',files.length>=MAX);
  }
  picker.addEventListener('change',function(){
    var extra=false;
    Array.prototype.forEach.call(picker.files,function(f){ if(files.length<MAX) files.push(f); else extra=true; });
    picker.value=''; draw(); say(extra ? 'Five pictures is the most we can take. The first five are added.' : '');
  });
  function shrink(file,max){
    return new Promise(function(resolve){
      var url=URL.createObjectURL(file), img=new Image();
      img.onload=function(){
        var w=img.naturalWidth, h=img.naturalHeight, k=Math.min(1,max/Math.max(w,h));
        var c=document.createElement('canvas'); c.width=Math.round(w*k); c.height=Math.round(h*k);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url);
        c.toBlob(function(b){ resolve(b||file); },'image/jpeg',0.82);
      };
      img.onerror=function(){ URL.revokeObjectURL(url); resolve(file); };
      img.src=url;
    });
  }
  function pack(sizes){
    var max=sizes.shift();
    return Promise.all(files.map(function(f){ return shrink(f,max); })).then(function(blobs){
      var total=blobs.reduce(function(t,b){ return t+b.size; },0);
      if(total>7*1024*1024){ if(sizes.length) return pack(sizes); throw new Error('big'); }
      return blobs;
    });
  }
  form.addEventListener('submit',function(ev){
    if(!files.length) return;   // no pictures: send the normal way
    ev.preventDefault();
    var btn=form.querySelector('button[type=submit]'); if(btn){ btn.disabled=true; btn.textContent='Sending'; }
    say(files.length>1 ? 'Sending with '+files.length+' pictures.' : 'Sending with your picture.');
    pack([1800,1400,1000]).then(function(blobs){
      var fd=new FormData(form); NAMES.forEach(function(n){ fd.delete(n); });
      blobs.forEach(function(b,n){ fd.append(NAMES[n],b,'picture-'+(n+1)+'.jpg'); });
      return fetch('/',{method:'POST',body:fd});
    }).then(function(r){
      if(!r.ok) throw new Error('send');
      window.location.href='/thanks';
    }).catch(function(e){
      if(btn){ btn.disabled=false; btn.textContent=sendLabel; }
      say(e.message==='big' ? 'Those pictures are too large to send together. Remove one, or send without them.'
                            : 'That did not send. Check your connection and try again.');
    });
  });
})();
