(function(){
  // Evaluation: live results from every survey and session form, and the team's notes, audio and pictures.
  var $=function(s,r){ return (r||document).querySelector(s); }, $$=function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  function el(t,c,x){ var e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; }
  var K='os_eval', code='', timer=null, tab='results', lastRaw='', lastNotes='', labels=null, nfilter='All';
  var gate=$('[data-evgate]'), inside=$('[data-evinside]'), form=$('[data-evform]'), input=$('#evpw'), msg=$('[data-evmsg]');
  var up=$('[data-evup]'), tiles=$('[data-evtiles]'), body=$('[data-evbody]'), jump=$('[data-evjump]'), cmp=$('[data-evcompare]');

  var FORMS=[
    {f:'arrival-survey',t:'Start your day',page:'/arrival-survey'},
    {f:'in-my-community',t:'Dr Ru’s three questions',page:'/hear'},
    {f:'quick-fire',t:'Quick fire, Hear',page:'/hear'},
    {f:'through-the-day',t:'Add your voice',page:'/during'},
    {f:'circle-message',t:'Circle messages, Share',page:'/share'},
    {f:'share-your-story',t:'Stories sent',page:'/share-your-story'},
    {f:'end-of-day-survey',t:'End your day',page:'/end-of-day-survey'}
  ];
  var TILES=[['arrival-survey','Start your day'],['consent','Consent forms'],['in-my-community','Dr Ru’s questions'],['quick-fire','Quick fire'],['through-the-day','Add your voice'],['circle-message','Circle messages'],['share-your-story','Stories'],['end-of-day-survey','End your day']];
  var PAIRS=[
    ['Connected to my community','i_feel_connected_to_my_community','feel_more_connected_to_my_community'],
    ['Belonging','i_feel_like_i_belong_in_my_community','greater_sense_of_belonging'],
    ['Engage with people with different experiences','i_engage_regularly_with_people_with_different_experiences_and_worldview','engage_more_regularly_with_different_people'],
    ['Can make a valuable contribution','i_believe_i_can_make_a_valuable_contribution','now_believe_i_can_make_a_valuable_contribution'],
    ['Comfortable sharing a story','comfort_sharing_a_story','comfort_sharing_a_story']
  ];
  var POSITIVE={'Agree':1,'Strongly agree':1,'Comfortable':1,'Very comfortable':1};

  function hm(ms){ return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',hour:'numeric',minute:'2-digit'}).format(new Date(ms)).replace(' ','').toLowerCase(); }
  function api(url,b){ b.code=code; return fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b),cache:'no-store'}).then(function(r){ if(r.status===403){ lock('That password is not right. Try again, or ask Kyriakos.'); throw 0; } return r; }); }

  // Read each question and its answer options from the form pages, so the results use the same words and order.
  function loadLabels(){
    if(labels) return Promise.resolve(labels);
    var pages={}; FORMS.forEach(function(x){ pages[x.page]=1; });
    return Promise.all(Object.keys(pages).map(function(p){ return fetch(p).then(function(r){ return r.text(); }).then(function(h){ return [p,new DOMParser().parseFromString(h,'text/html')]; }).catch(function(){ return [p,null]; }); }))
    .then(function(docs){
      var byPage={}; docs.forEach(function(d){ byPage[d[0]]=d[1]; }); labels={};
      FORMS.forEach(function(x){
        var doc=byPage[x.page], f=doc&&doc.querySelector('form[name="'+x.f+'"]'), out=[], seen={};
        if(f) $$('[name]',f).forEach(function(e){
          var n=e.getAttribute('name'); if(!n||n==='bot-field'||n==='form-name'||/^picture/.test(n)||e.type==='file') return;
          if(!seen[n]){ seen[n]={name:n,opts:[],label:''}; out.push(seen[n]); }
          var q=seen[n];
          if(e.type==='radio'||e.type==='checkbox'){ q.opts.push(e.value); if(!q.label){ var fs=e.closest('fieldset'), lg=fs&&fs.querySelector('legend'); q.label=lg?lg.textContent.trim():n; } }
          else if(!q.label){ var lb=e.id&&f.querySelector('label[for="'+e.id+'"]'); q.label=lb?lb.textContent.trim():n.replace(/_/g,' '); }
        });
        labels[x.f]=out;
      });
      return labels;
    });
  }
  function counts(list,name){ var c={},n=0; list.forEach(function(a){ var v=a.data[name]; if(v==null||v==='') return; (Array.isArray(v)?v:[v]).forEach(function(x){ c[x]=(c[x]||0)+1; }); n++; }); return {c:c,n:n}; }
  function pos(list,name){ var r=counts(list,name), p=0; Object.keys(r.c).forEach(function(k){ if(POSITIVE[k]) p+=r.c[k]; }); return {p:p,n:r.n,pct:r.n?Math.round(100*p/r.n):null}; }
  function bars(q,list){
    var r=counts(list,q.name), box=el('div','evq');
    box.appendChild(el('h3',null,q.label)); box.appendChild(el('p','evn',r.n+' answered'));
    var opts=q.opts.slice(); Object.keys(r.c).forEach(function(k){ if(opts.indexOf(k)<0) opts.push(k); });
    if(q.name==='postcode'){ opts=Object.keys(r.c).sort(function(a,b){ return r.c[b]-r.c[a]; }); }
    var ul=el('ul','evbars');
    opts.forEach(function(o){ var n=r.c[o]||0; if(q.name==='postcode'&&!n) return; var pc=r.n?Math.round(100*n/r.n):0;
      var li=el('li'); li.appendChild(el('span','evo',o)); var b=el('span','evb'); var fill=el('i'); fill.style.width=pc+'%'; b.appendChild(fill); li.appendChild(b); li.appendChild(el('span','evc',n+(r.n?'  ('+pc+'%)':''))); ul.appendChild(li); });
    box.appendChild(ul);
    var pp=pos(list,q.name);
    if(q.opts.some(function(o){ return POSITIVE[o]; })&&pp.n) box.appendChild(el('p','evpos',pp.pct+'% '+(q.opts.indexOf('Comfortable')>=0?'comfortable or very comfortable':'agree or strongly agree')));
    return box;
  }
  function texts(q,list){
    var items=list.filter(function(a){ return a.data[q.name]; }).slice().reverse(), box=el('div','evq');
    box.appendChild(el('h3',null,q.label)); box.appendChild(el('p','evn',items.length+' answered'));
    var ol=el('ul','evtexts'), more=null, LIM=12;
    items.forEach(function(a,i){ var li=el('li'); li.appendChild(el('p',null,a.data[q.name])); var meta=hm(a.at)+(a.data.session?'. '+a.data.session:'')+(a.data.table?'. Table '+a.data.table:''); li.appendChild(el('small',null,meta)); if(i>=LIM) li.hidden=true; ol.appendChild(li); });
    box.appendChild(ol);
    if(items.length>LIM){ more=el('button','btn ghost small','Show all '+items.length); more.type='button'; more.addEventListener('click',function(){ $$('li',ol).forEach(function(li){ li.hidden=false; }); more.remove(); }); box.appendChild(more); }
    return box;
  }
  function drawResults(j,cnt){
    var now=hm(Date.now()); up.textContent='Updated '+now+'. '+(j.day||'');
    tiles.textContent='';
    TILES.forEach(function(t){ var li=el('li'); li.appendChild(el('b',null,String((cnt&&cnt.counts&&cnt.counts[t[0]])||0))); li.appendChild(el('span',null,t[1])); tiles.appendChild(li); });
    var A=j.forms['arrival-survey']||[], E=j.forms['end-of-day-survey']||[];
    cmp.textContent='';
    var cb=el('section','evcmp'); cb.appendChild(el('h2',null,'Start of day and end of day'));
    cb.appendChild(el('p','evnote','Share who agree or strongly agree (comfortable or very comfortable for sharing a story), out of everyone who answered. '+A.length+' start surveys, '+E.length+' end surveys. The end survey asks whether the day changed this, so the two are close but not the same question.'));
    var t=el('table','evtable'), hd=el('tr'); ['','Start of day','End of day'].forEach(function(x){ hd.appendChild(el('th',null,x)); }); t.appendChild(hd);
    PAIRS.forEach(function(p){ var a=pos(A,p[1]), e=pos(E,p[2]), tr=el('tr'); tr.appendChild(el('th',null,p[0])); tr.appendChild(el('td',null,a.n?a.pct+'%  ('+a.p+' of '+a.n+')':'None yet')); tr.appendChild(el('td',null,e.n?e.pct+'%  ('+e.p+' of '+e.n+')':'None yet')); t.appendChild(tr); });
    cb.appendChild(t); cmp.appendChild(cb);
    body.textContent=''; jump.textContent='';
    FORMS.forEach(function(x){
      var list=j.forms[x.f]||[], sec=el('section','evform'); sec.id='ev-'+x.f;
      var h=el('h2',null,x.t+'  '); h.appendChild(el('span','evcount',list.length+(list.length?', latest '+hm(list[list.length-1].at):''))); sec.appendChild(h);
      var a=el('a',null,x.t+' ('+list.length+')'); a.href='#ev-'+x.f; jump.appendChild(a);
      if(!list.length){ sec.appendChild(el('p','evnote','Nothing yet.')); body.appendChild(sec); return; }
      var qs=(labels&&labels[x.f])||[], known={};
      qs.forEach(function(q){ known[q.name]=1; var any=list.some(function(a){ return a.data[q.name]; }); if(!any) return; sec.appendChild(q.opts.length||q.name==='postcode'?bars(q,list):texts(q,list)); });
      var extra={}; list.forEach(function(a){ Object.keys(a.data).forEach(function(k){ if(!known[k]) extra[k]=1; }); });
      Object.keys(extra).forEach(function(k){ sec.appendChild(texts({name:k,label:k.replace(/_/g,' '),opts:[]},list)); });
      body.appendChild(sec);
    });
  }
  function loadResults(force){
    return Promise.all([loadLabels(), api('/api/eval',{list:true}).then(function(r){ return r.text(); }), fetch('/api/count',{cache:'no-store'}).then(function(r){ return r.json(); }).catch(function(){ return null; })])
    .then(function(v){ var raw=v[1]+JSON.stringify(v[2]); if(!force&&raw===lastRaw) { up.textContent='Updated '+hm(Date.now())+'.'; return; } lastRaw=raw; drawResults(JSON.parse(v[1]),v[2]); });
  }

  // ---------- notes ----------
  var nform=$('[data-noteform]'), nlist=$('[data-nlist]'), nmsg=$('[data-nmsg]'), npend=$('[data-npend]'), nfiles=$('[data-nfiles]'), nrec=$('[data-nrec]'), nrecst=$('[data-nrecstate]'), nfilt=$('[data-nfilter]');
  var pending=[], rec=null, recChunks=[], recStart=0, recTick=null;
  try{ $('[data-nby]').value=localStorage.getItem('os_eval_by')||''; }catch(e){}
  function kb(n){ return n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB'; }
  function drawPending(){ npend.textContent=''; pending.forEach(function(p,i){ var li=el('li',null,p.name+', '+kb(p.blob.size)+' '); var x=el('button','evx','Remove'); x.type='button'; x.addEventListener('click',function(){ pending.splice(i,1); drawPending(); }); li.appendChild(x); npend.appendChild(li); }); }
  function shrink(file){
    if(!/^image\/(jpeg|png|webp|heic|heif)/.test(file.type)) return Promise.resolve({blob:file,name:file.name,type:file.type||'application/octet-stream'});
    return new Promise(function(res){
      var url=URL.createObjectURL(file), img=new Image();
      img.onload=function(){ var s=Math.min(1,2000/Math.max(img.width,img.height)), c=document.createElement('canvas'); c.width=Math.round(img.width*s); c.height=Math.round(img.height*s); c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url);
        c.toBlob(function(b){ res(b&&b.size<file.size?{blob:b,name:file.name.replace(/\.\w+$/,'')+'.jpg',type:'image/jpeg'}:{blob:file,name:file.name,type:file.type}); },'image/jpeg',0.85); };
      img.onerror=function(){ URL.revokeObjectURL(url); res({blob:file,name:file.name,type:file.type||'application/octet-stream'}); };
      img.src=url;
    });
  }
  nfiles.addEventListener('change',function(){ var fs=Array.prototype.slice.call(nfiles.files); nfiles.value=''; Promise.all(fs.map(shrink)).then(function(ps){ pending=pending.concat(ps); drawPending(); }); });
  nrec.addEventListener('click',function(){
    if(rec&&rec.state==='recording'){ rec.stop(); return; }
    if(!navigator.mediaDevices||!window.MediaRecorder){ nmsg.textContent='This browser cannot record. Use your phone’s voice recorder and add the file instead.'; nmsg.hidden=false; return; }
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      recChunks=[]; rec=new MediaRecorder(stream); recStart=Date.now();
      rec.ondataavailable=function(e){ if(e.data&&e.data.size) recChunks.push(e.data); };
      rec.onstop=function(){ stream.getTracks().forEach(function(t){ t.stop(); }); clearInterval(recTick); nrec.textContent='Record audio'; nrecst.hidden=true;
        var type=rec.mimeType||'audio/webm', ext=/mp4|m4a|aac/.test(type)?'m4a':(/ogg/.test(type)?'ogg':'webm');
        pending.push({blob:new Blob(recChunks,{type:type}),name:'Recording '+hm(recStart).replace(':','.')+'.'+ext,type:type.split(';')[0]}); drawPending(); };
      rec.start(1000); nrec.textContent='Stop recording'; nrecst.hidden=false;
      recTick=setInterval(function(){ var s=Math.round((Date.now()-recStart)/1000); nrecst.textContent='Recording '+Math.floor(s/60)+':'+('0'+s%60).slice(-2); },500);
    }).catch(function(){ nmsg.textContent='The microphone is blocked. Allow it in the browser, or add a recording as a file.'; nmsg.hidden=false; });
  });
  function b64(buf){ var s='', u=new Uint8Array(buf), step=0x8000; for(var i=0;i<u.length;i+=step) s+=String.fromCharCode.apply(null,u.subarray(i,i+step)); return btoa(s); }
  function upload(id,p,report){
    var PART=3*1024*1024, n=Math.max(1,Math.ceil(p.blob.size/PART)), fid=Date.now()+'-'+Math.random().toString(36).slice(2,8), i=0;
    function next(){ if(i>=n) return Promise.resolve();
      return p.blob.slice(i*PART,(i+1)*PART).arrayBuffer().then(function(buf){
        return api('/api/evnotes',{op:'part',id:id,fid:fid,i:i,n:n,name:p.name,type:p.type,size:p.blob.size,b64:b64(buf)}).then(function(r){ if(!r.ok) throw new Error('upload'); i++; report(p.name+': '+Math.round(100*i/n)+'%'); return next(); });
      }); }
    return next();
  }
  nform.addEventListener('submit',function(ev){
    ev.preventDefault(); if(rec&&rec.state==='recording'){ rec.stop(); setTimeout(function(){ nform.requestSubmit(); },400); return; }
    var text=$('[data-ntext]').value.trim(); if(!text&&!pending.length){ nmsg.textContent='Write something or add a file first.'; nmsg.hidden=false; return; }
    var by=$('[data-nby]').value.trim(); try{ localStorage.setItem('os_eval_by',by); }catch(e){}
    var kind=$('[data-nkind]').value; if(kind==='Note'&&pending.length&&!text) kind=/^audio/.test(pending[0].type)?'Audio':(/^image/.test(pending[0].type)?'Picture':kind);
    var save=$('[data-nsave]'); save.disabled=true; nmsg.hidden=false; nmsg.textContent='Saving';
    api('/api/evnotes',{op:'add',session:$('[data-nsession]').value,kind:kind,text:text,by:by}).then(function(r){ return r.json(); }).then(function(j){
      var files=pending.slice(), k=0;
      function one(){ if(k>=files.length) return Promise.resolve(); return upload(j.id,files[k],function(t){ nmsg.textContent='Uploading '+t; }).then(function(){ k++; return one(); }); }
      return one();
    }).then(function(){ pending=[]; drawPending(); $('[data-ntext]').value=''; nmsg.textContent='Saved.'; save.disabled=false; loadNotes(true); setTimeout(function(){ nmsg.hidden=true; },3000); })
    .catch(function(e){ if(e===0) return; save.disabled=false; nmsg.textContent='That did not save. Check the connection and try again. What you wrote is still here.'; });
  });
  function fetchFile(f){
    var parts=[], i=0;
    function next(){ if(i>=f.n) return Promise.resolve(); return api('/api/evnotes',{op:'get',fid:f.fid,i:i}).then(function(r){ return r.arrayBuffer(); }).then(function(b){ parts.push(b); i++; return next(); }); }
    return next().then(function(){ return URL.createObjectURL(new Blob(parts,{type:f.type})); });
  }
  var urls={};
  function fileView(f,box){
    var row=el('div','evfile');
    if(urls[f.fid]) show(urls[f.fid]); else if(/^image|^audio/.test(f.type)&&f.size<12*1048576){ row.appendChild(el('span','evn','Loading '+f.name)); fetchFile(f).then(function(u){ urls[f.fid]=u; row.textContent=''; show(u); }); }
    else { var b=el('button','btn ghost small','Open '+f.name+', '+kb(f.size)); b.type='button'; b.addEventListener('click',function(){ b.disabled=true; fetchFile(f).then(function(u){ urls[f.fid]=u; row.textContent=''; show(u); }); }); row.appendChild(b); }
    function show(u){
      if(/^image/.test(f.type)){ var a=el('a'); a.href=u; a.target='_blank'; var im=el('img'); im.src=u; im.alt=f.name; a.appendChild(im); row.appendChild(a); }
      else if(/^audio|^video/.test(f.type)){ var au=el(/^video/.test(f.type)?'video':'audio'); au.controls=true; au.src=u; row.appendChild(au); }
      var dl=el('a','evdl','Download '+f.name); dl.href=u; dl.download=f.name; row.appendChild(dl);
    }
    box.appendChild(row);
  }
  function drawNotes(notes){
    $('[data-n-notes]').textContent=notes.length;
    var cats=['All','General','Welcome desk','Hear','Lunch','Create','Share','Audio','Picture','Transcript','Quote'];
    nfilt.textContent=''; cats.forEach(function(c){ var n=c==='All'?notes.length:notes.filter(function(x){ return x.session===c||x.kind===c; }).length; if(c!=='All'&&!n) return; var b=el('button','dchip'+(nfilter===c?' is-on':''),c+' '+n); b.type='button'; b.addEventListener('click',function(){ nfilter=c; drawNotes(notes); }); nfilt.appendChild(b); });
    nlist.textContent='';
    var shown=notes.filter(function(x){ return nfilter==='All'||x.session===nfilter||x.kind===nfilter; });
    if(!shown.length) nlist.appendChild(el('li','evnote','No notes yet.'));
    shown.forEach(function(x){
      var li=el('li','evnoteitem'), top=el('p','evmeta'); top.appendChild(el('b',null,x.kind)); top.appendChild(document.createTextNode('  '+x.session+'. '+hm(x.at)+(x.by?'. '+x.by:'')));
      li.appendChild(top); if(x.text){ var p=el('p','evtext',x.text); li.appendChild(p); }
      (x.files||[]).forEach(function(f){ fileView(f,li); });
      var del=el('button','evx','Delete'); del.type='button';
      del.addEventListener('click',function(){ if(!confirm('Delete this '+x.kind.toLowerCase()+' and its files? This cannot be undone.')) return; api('/api/evnotes',{op:'delete',id:x.id}).then(function(){ loadNotes(true); }); });
      li.appendChild(del); nlist.appendChild(li);
    });
  }
  function loadNotes(force){
    return api('/api/evnotes',{op:'list'}).then(function(r){ return r.text(); }).then(function(raw){ if(!force&&raw===lastNotes) return; lastNotes=raw; drawNotes(JSON.parse(raw).notes||[]); });
  }

  // ---------- door, tabs, refresh ----------
  function setTab(t){ tab=t; $$('[data-evtab]').forEach(function(b){ var on=b.getAttribute('data-evtab')===t; b.classList.toggle('is-on',on); b.setAttribute('aria-selected',on?'true':'false'); }); $$('[data-evpanel]').forEach(function(p){ p.hidden=p.getAttribute('data-evpanel')!==t; }); }
  $$('[data-evtab]').forEach(function(b){ b.addEventListener('click',function(){ setTab(b.getAttribute('data-evtab')); }); });
  function tick(force){ if(!code||document.hidden) return; loadResults(force).catch(function(e){ if(e!==0) up.textContent='Waiting for the connection'; }); loadNotes(force).catch(function(){}); }
  function start(){ gate.hidden=true; inside.hidden=false; tick(true); if(!timer) timer=setInterval(function(){ tick(false); },15000); }
  function lock(t){ code=''; lastRaw=''; lastNotes=''; try{ sessionStorage.removeItem(K); }catch(e){} clearInterval(timer); timer=null; inside.hidden=true; gate.hidden=false; body.textContent=''; nlist.textContent=''; if(t){ msg.textContent=t; msg.hidden=false; } }
  form.addEventListener('submit',function(ev){ ev.preventDefault(); code=input.value; input.value=''; msg.hidden=true; try{ sessionStorage.setItem(K,code); }catch(e){} start(); });
  $('[data-evlock]').addEventListener('click',function(){ lock(''); });
  document.addEventListener('visibilitychange',function(){ if(!document.hidden) tick(false); });
  try{ code=sessionStorage.getItem(K)||''; }catch(e){}
  if(code) start();
})();
