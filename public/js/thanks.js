(function(){
  var sent=null, session='';
  try{ sent=JSON.parse(sessionStorage.getItem('os_sent')||'null'); session=sessionStorage.getItem('os_session')||''; }catch(e){}
  if(!sent || !sent.form || Date.now()-(sent.t||0)>30*60*1000) return;
  var M={
    'share-your-story':['Thank you for sharing your story.','It has come through safely. It is yours: if you change your mind about how it is used, tell a facilitator or the welcome desk.',true,'Share another story'],
    'consent':['Thank you. Your consent form is in.','It has come through safely. Give your name at the welcome desk when you arrive.',false],
    'arrival-survey':['Thank you. Your start of day answers are in.','They have come through safely. Enjoy the day.',false],
    'end-of-day-survey':['Thank you. Your end of day answers are in.','They have come through safely. Thank you for being part of Our Stories today.',false],
    'quick-fire':['Thank you. Your quick fire answers are in.','They have come through safely. No name is attached.',false],
    'through-the-day':['Thank you for adding your voice.','It has come through safely. Send another any time something stays with you.',true,'Add something else'],
    'circle-message':['Thank you. Your circle’s message is in.','It has come through safely.',false],
    'stage-spot':['Thank you. Your name is down for a stage spot.','It has come through safely. Your facilitators confirm the time in Share.',false],
    'read-for-me':['Thank you. It has come through.','A host will read it out for you in Share.',false],
    'in-my-community':['Thank you. Your answers are in.','They go up on the screen once the host shows them.',true,'Add another answer'],
    'volunteer-reflection':['Thank you for your reflection.','It has come through safely. Thank you for everything you did today.',false],
    'facilitator-reflection':['Thank you for your reflection.','It has come through safely. Thank you for everything you did today.',false]
  };
  var m=M[sent.form]; if(!m) return;
  var NAMES={'/hear':'Hear','/create':'Create','/share':'Share','/lunch':'lunch','/welcome':'the welcome','/volunteers':'the volunteer pack','/facilitators':'your cues','/hosts':'the hosts page'};
  var from=(sent.from||'').split('#')[0], back=sent.from||'/';
  if(!NAMES[from]){ back = session || '/'; from = session; }
  document.querySelector('[data-tyh]').textContent=m[0];
  document.querySelector('[data-tyl]').textContent=m[1];
  var b=document.querySelector('[data-tyback]');
  b.href=back; b.textContent=NAMES[from]?'Back to '+NAMES[from]:'Back to the home page';
  if(m[2]){ var a=document.querySelector('[data-tyagain]'); a.href=sent.from||'/'; a.textContent=m[3]; a.hidden=false; }
  document.querySelector('[data-tyacts]').hidden=false;
  try{ document.title=m[0]+' Our Stories, Parramatta'; }catch(e){}
})();
