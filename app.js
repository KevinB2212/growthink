// ===== ERROR HANDLING =====
window.onerror = function(msg, src, line, col, err) {
  console.error('GroWthink Error:', msg, 'at', src, line);
  return false;
};

// Safe JSON parse with fallback
function safeParse(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ===== DATA MIGRATION =====
const DATA_VERSION = 5;
function migrateData(state) {
  if (!state) return state;
  if (!state._dataVersion) state._dataVersion = 1;
  
  // v1->v2: add tags array
  if (state._dataVersion < 2) {
    state.notes?.forEach(n => { if (!n.tags) n.tags = []; });
    state._dataVersion = 2;
  }
  // v2->v3: add mood, pinned
  if (state._dataVersion < 3) {
    state.notes?.forEach(n => { if (!n.mood) n.mood = ''; if (n.pinned === undefined) n.pinned = false; });
    state._dataVersion = 3;
  }
  // v3->v4: add cat, photo, voice
  if (state._dataVersion < 4) {
    state.notes?.forEach(n => { if (!n.cat) n.cat = ''; });
    state._dataVersion = 4;
  }
  // v4->v5: add sentiment, plantDNA, garden, reminders
  if (state._dataVersion < 5) {
    state.notes?.forEach(n => { if (typeof n.sentiment !== 'number') n.sentiment = 0; });
    if (!state.plantDNA) state.plantDNA = null;
    if (!state.garden) state.garden = null;
    if (!state.reminders) state.reminders = [];
    if (!state.evolutions) state.evolutions = [];
    state._dataVersion = 5;
  }
  return state;
}

// ===== STATE =====
let S=migrateData(safeParse(localStorage.getItem('gt_state'),null))||{notes:[],health:100,level:1,xp:0,streak:0,best:0,lastNote:null,badges:[],created:Date.now(),_dataVersion:DATA_VERSION};
let C=JSON.parse(localStorage.getItem('gt_config')||'null')||{sky:true,particles:true,music:false,theme:'green',plant:'flower',pot:'red',name:'',mood:''};

const THEMES={green:['#00e6a7','#00c9ff'],purple:['#a855f7','#ec4899'],orange:['#f97316','#eab308'],blue:['#3b82f6','#6366f1'],rose:['#f43f5e','#fb7185']};
const POTS={red:['#c0392b','#96281b','#e74c3c'],blue:['#2980b9','#1a5276','#3498db'],gold:['#f39c12','#d35400','#f1c40f'],green:['#27ae60','#1e8449','#2ecc71'],purple:['#8e44ad','#6c3483','#9b59b6']};
const MOODS=['😊','😐','😔','🔥','💡','❤️'];
const BADGES=[
  {id:'first',name:'First Seed',desc:'Write your first note',icon:'🌱',check:s=>s.notes.length>=1},
  {id:'streak7',name:'Week Warrior',desc:'7-day streak',icon:'🔥',check:s=>s.best>=7},
  {id:'streak30',name:'Monthly Master',desc:'30-day streak',icon:'💎',check:s=>s.best>=30},
  {id:'notes50',name:'Half Century',desc:'50 notes',icon:'📝',check:s=>s.notes.length>=50},
  {id:'notes100',name:'Centurion',desc:'100 notes',icon:'💯',check:s=>s.notes.length>=100},
  {id:'nightowl',name:'Night Owl',desc:'Note after midnight',icon:'🦉',check:s=>s.notes.some(n=>new Date(n.date).getHours()<5&&new Date(n.date).getHours()>=0)},
  {id:'earlybird',name:'Early Bird',desc:'Note before 7am',icon:'🐦',check:s=>s.notes.some(n=>{const h=new Date(n.date).getHours();return h>=5&&h<7;})},
  {id:'marathon',name:'Marathon',desc:'10 notes in one day',icon:'🏃',check:s=>{const days={};s.notes.forEach(n=>{days[n.day]=(days[n.day]||0)+1;});return Object.values(days).some(c=>c>=10);}},
  {id:'wordsmith',name:'Wordsmith',desc:'Note over 200 chars',icon:'✍️',check:s=>s.notes.some(n=>n.text.length>200)},
  {id:'level5',name:'Green Thumb',desc:'Reach level 5',icon:'🌿',check:s=>s.level>=5},
  {id:'level10',name:'Plant Sage',desc:'Reach level 10',icon:'🧙',check:s=>s.level>=10},
  {id:'moody',name:'Mood Tracker',desc:'Use all 6 moods',icon:'🎭',check:s=>{const m=new Set(s.notes.map(n=>n.mood).filter(Boolean));return m.size>=6;}}
];
const PROMPTS=['What are you grateful for today?','What\'s one thing you learned recently?','Describe your perfect day.','What goal are you working towards?','What made you smile today?','Write about a challenge you overcame.','What would you tell your future self?','What\'s inspiring you right now?','Describe something beautiful you saw today.','What\'s one small win from today?'];
const QUOTES=['"The best time to plant a tree was 20 years ago."','"Small daily improvements lead to staggering results."','"Your mind is a garden, your thoughts are the seeds."','"What you plant now, you will harvest later."','"The expert in anything was once a beginner."','"Consistency transforms average into excellence."','"One note a day keeps the withering away. 🌱"','"Growth is never by mere chance."'];

function save(){try{localStorage.setItem('gt_state',JSON.stringify(S));}catch(e){if(e.name==='QuotaExceededError'){alert('Storage full! Try removing old photo/voice notes.');}}}
function saveC(){localStorage.setItem('gt_config',JSON.stringify(C));}

// ===== THEME =====
function applyTheme(){
  const t=THEMES[C.theme]||THEMES.green;
  document.documentElement.style.setProperty('--accent',t[0]);
  document.documentElement.style.setProperty('--accent2',t[1]);
  document.documentElement.style.setProperty('--glow',t[0]+'26');
  document.querySelectorAll('#theme-picker .color-opt').forEach(e=>e.classList.toggle('active',e.dataset.theme===C.theme));
  document.querySelectorAll('#plant-picker .plant-opt').forEach(e=>e.classList.toggle('active',e.dataset.plant===C.plant));
  document.querySelectorAll('#pot-picker .color-opt').forEach(e=>e.classList.toggle('active',e.dataset.pot===C.pot));
  applyPot();
}
function applyPot(){
  const p=POTS[C.pot]||POTS.red;
  document.getElementById('pot-body').style.background=`linear-gradient(135deg,${p[0]},${p[1]})`;
  document.getElementById('pot-rim').style.background=`linear-gradient(180deg,${p[2]},${p[0]})`;
}

// ===== SKY =====
function getPhase(){const h=new Date().getHours();if(h>=23||h<5)return'night';if(h<7)return'dawn';if(h<10)return'morning';if(h<14)return'noon';if(h<17)return'afternoon';if(h<19)return'sunset';if(h<21)return'dusk';return'evening';}
function updateSky(){
  const p=C.sky?getPhase():'night';
  document.getElementById('sky').className='sky-bg sky-'+p;
  const n=['night','evening'].includes(p),dk=['dusk'].includes(p),dw=['dawn'].includes(p),dy=['morning','noon','afternoon'].includes(p),ss=['sunset'].includes(p);
  document.getElementById('stars-layer').style.opacity=n?'1':dk||dw?'.4':'0';
  document.getElementById('clouds-layer').style.opacity=dy||ss?'.8':dw?'.4':'0';
  const sun=document.getElementById('sun'),moon=document.getElementById('moon-obj');
  if(dy||ss||dw){sun.style.display='block';moon.style.display='none';const pos={dawn:{t:'70%',r:'30%'},morning:{t:'35%',r:'20%'},noon:{t:'10%',r:'40%'},afternoon:{t:'30%',r:'65%'},sunset:{t:'65%',r:'70%'}};const q=pos[p]||pos.noon;sun.style.top=q.t;sun.style.right=q.r;}
  else{sun.style.display='none';moon.style.display='block';moon.style.top=n?'15%':'25%';moon.style.right=n?'25%':'20%';}
  document.getElementById('scene-ground').className='scene-ground '+(n||p==='evening'?'ground-night':dw||dk?'ground-dusk':ss?'ground-sunset':'ground-day');
  document.getElementById('grass').className='grass '+(n||p==='evening'?'grass-night':ss||dk?'grass-sunset':'grass-day');
  const greet={night:'The night is quiet. Perfect for reflection.',dawn:'A new day dawns.',morning:'Good morning! Plant some ideas.',noon:'Midday thoughts are strongest.',afternoon:'Afternoon musings welcome.',sunset:'Golden hour thoughts.',dusk:'Capture your thoughts.',evening:'Evening reflections.'};
  document.getElementById('subtitle').textContent=greet[p];
}
function initScene(){
  const sl=document.getElementById('stars-layer');for(let i=0;i<50;i++){const s=document.createElement('div');s.className='star';s.style.left=Math.random()*100+'%';s.style.top=Math.random()*100+'%';s.style.animationDelay=Math.random()*3+'s';s.style.width=s.style.height=(1+Math.random()*2)+'px';sl.appendChild(s);}
  const cl=document.getElementById('clouds-layer');for(let i=0;i<6;i++){const c=document.createElement('div');c.className='cloud';c.style.width=(80+Math.random()*120)+'px';c.style.height=(20+Math.random()*20)+'px';c.style.top=(5+Math.random()*30)+'%';c.style.animationDuration=(40+Math.random()*40)+'s';c.style.animationDelay=(-Math.random()*60)+'s';cl.appendChild(c);}
  const gr=document.getElementById('grass');for(let i=0;i<45;i++){const g=document.createElement('div');g.className='grass-blade';g.style.height=(8+Math.random()*18)+'px';g.style.animationDelay=Math.random()*4+'s';g.style.opacity=.4+Math.random()*.6;gr.appendChild(g);}
  const sc=document.getElementById('scene');for(let i=0;i<6;i++){const f=document.createElement('div');f.className='firefly';f.style.left=(15+Math.random()*70)+'%';f.style.top=(20+Math.random()*50)+'%';f.style.animationDelay=Math.random()*8+'s';f.style.animationDuration=(6+Math.random()*6)+'s';sc.appendChild(f);}
}

// ===== PLANT =====
function renderPlant(){
  const el=document.getElementById('plant'),lvl=S.level,w=S.health<35;
  const dna=S.plantDNA||{};const gr=dna.growthRate||1,lsz=dna.leafSize||1,scv=dna.stemCurve||.5;
  el.style.filter=dna.colorHue?`hue-rotate(${dna.colorHue}deg)`:'';
  const stemH=Math.min((20+lvl*15)*gr,180),cx=100;
  const sc=w?'#7f6b3e':'#27ae60',sc2=w?'#8B7355':'#2ecc71',lc1=w?'#8B7355':'#2ecc71',lc2=w?'#7f6b3e':'#27ae60',lc3=w?'#9B8365':'#55efc4',lc4=w?'#8B7355':'#00b894';
  let svg=`<svg width="200" height="${stemH+60}" viewBox="0 0 200 ${stemH+60}" style="overflow:visible"><defs><linearGradient id="sG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${sc}"/><stop offset="100%" stop-color="${sc2}"/></linearGradient><linearGradient id="lG1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${lc1}"/><stop offset="100%" stop-color="${lc2}"/></linearGradient><linearGradient id="lG2" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${lc3}"/><stop offset="100%" stop-color="${lc4}"/></linearGradient><filter id="ls"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity=".3"/></filter></defs>`;
  const st=stemH+60-stemH;
  if(C.plant==='cactus'){
    svg+=`<rect x="${cx-8}" y="${st}" width="16" height="${stemH}" rx="8" fill="url(#sG)"/>`;
    if(lvl>=3)svg+=`<rect x="${cx-25}" y="${st+stemH*.3}" width="12" height="${stemH*.3}" rx="6" fill="url(#lG1)"/><rect x="${cx-25}" y="${st+stemH*.3}" width="12" height="12" rx="6" fill="url(#lG1)" transform="translate(0,-${stemH*.15})"/>`;
    if(lvl>=5)svg+=`<rect x="${cx+13}" y="${st+stemH*.5}" width="12" height="${stemH*.25}" rx="6" fill="url(#lG2)"/>`;
    for(let i=0;i<Math.min(lvl*2,15);i++){const y=st+10+Math.random()*(stemH-20),x=cx+(Math.random()>.5?-1:1)*(3+Math.random()*5);svg+=`<line x1="${x}" y1="${y}" x2="${x+(Math.random()-.5)*6}" y2="${y-4}" stroke="${w?'#aaa':'#8B7355'}" stroke-width=".8"/>`;}
    if(lvl>=4)svg+=`<circle cx="${cx}" cy="${st-5}" r="${4+lvl*.5}" fill="#ff6b6b"/><circle cx="${cx-2}" cy="${st-7}" r="${2+lvl*.2}" fill="rgba(255,255,255,.3)"/>`;
  } else if(C.plant==='bonsai'){
    svg+=`<path d="M${cx},${stemH+60} Q${cx-10},${stemH+30} ${cx-5},${st+20} Q${cx},${st+10} ${cx+5},${st+20} Q${cx+10},${stemH+30} ${cx},${stemH+60}" fill="url(#sG)"/>`;
    const canopyR=Math.min(20+lvl*4,55);
    svg+=`<circle cx="${cx}" cy="${st+10}" r="${canopyR}" fill="url(#lG1)" filter="url(#ls)" opacity=".8"/>`;
    svg+=`<circle cx="${cx-canopyR*.4}" cy="${st+5}" r="${canopyR*.6}" fill="url(#lG2)" opacity=".7"/>`;
    svg+=`<circle cx="${cx+canopyR*.3}" cy="${st}" r="${canopyR*.5}" fill="url(#lG1)" opacity=".75"/>`;
  } else if(C.plant==='vine'){
    const pts=Math.min(3+lvl,12);
    let path=`M${cx},${stemH+60}`;
    for(let i=1;i<=pts;i++){const t=i/pts,y=stemH+60-t*stemH,x=cx+Math.sin(t*Math.PI*2)*15;path+=` Q${x+(Math.random()-.5)*10},${y+10} ${x},${y}`;}
    svg+=`<path d="${path}" stroke="url(#sG)" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    for(let i=0;i<Math.min(lvl+2,10);i++){const t=(i+1)/(Math.min(lvl+2,10)+1),y=stemH+60-t*stemH,x=cx+Math.sin(t*Math.PI*2)*15,side=i%2===0?-1:1,sz=Math.max(12,25-i*1.5);
    svg+=`<g filter="url(#ls)"><path d="M${x},${y} Q${x+side*sz*.4},${y-sz*.3} ${x+side*sz},${y} Q${x+side*sz*.4},${y+sz*.3} ${x},${y}" fill="url(#${i%2?'lG1':'lG2'})" opacity=".85"/></g>`;}
  } else { // flower default
    svg+=`<path d="M${cx},${stemH+60} Q${cx-3+Math.sin(lvl*.5)*5*(scv*2)},${stemH+30} ${cx},${st}" stroke="url(#sG)" stroke-width="${Math.max(3,6-lvl*.1)}" fill="none" stroke-linecap="round"/>`;
    const lf=Math.min(Math.floor(lvl*.9)+1,10);
    for(let i=0;i<lf;i++){const t=i/lf,y=stemH+60-15-t*stemH*.85,side=i%2===0?-1:1,sz=Math.max(20,38-i*2.5)*lsz,h=sz*.55;
    svg+=`<g filter="url(#ls)" transform="rotate(${side*(25+i*3)},${cx},${y})"><path d="M${cx},${y} Q${cx+side*sz*.4},${y-h*.6} ${cx+side*sz},${y} Q${cx+side*sz*.4},${y+h*.6} ${cx},${y}" fill="url(#${i%2?'lG1':'lG2'})" opacity=".88"/><path d="M${cx},${y} Q${cx+side*sz*.5},${y-1} ${cx+side*sz*.85},${y}" stroke="rgba(255,255,255,.15)" stroke-width=".7" fill="none"/></g>`;}
    if(lvl>=4){const fS=Math.min(14+(lvl-4)*4,50),pc=Math.min(5+Math.floor((lvl-4)/2),12),fy=st-fS*.3,cols=['#ff6b6b','#feca57','#ff9ff3','#48dbfb','#ff9f43','#f368e0','#0abde3','#fd79a8','#a29bfe','#55efc4'];
    for(let i=0;i<pc;i++){const a=(360/pc)*i-90,r=a*Math.PI/180,pr=fS*.35,px=cx+Math.cos(r)*pr,py=fy+Math.sin(r)*pr,ps=fS*.3;svg+=`<ellipse cx="${px}" cy="${py}" rx="${ps}" ry="${ps*.7}" fill="${cols[i%cols.length]}" opacity=".85" transform="rotate(${a},${px},${py})"/>`;}
    svg+=`<circle cx="${cx}" cy="${fy}" r="${fS*.2}" fill="#ffeaa7" stroke="#f39c12" stroke-width="1"/>`;}
  }
  svg+=`</svg>`;el.innerHTML=svg;
}

// ===== MOODS =====
function initMoods(){document.getElementById('mood-bar').innerHTML=MOODS.map(m=>`<button class="mood-btn" data-mood="${m}" onclick="pickMood('${m}')">${m}</button>`).join('');}
function pickMood(m){C.mood=C.mood===m?'':m;saveC();document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('selected',b.dataset.mood===C.mood));}

// ===== TABS =====
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab,.tab-content').forEach(e=>e.classList.remove('active'));t.classList.add('active');document.getElementById('tab-'+t.dataset.tab).classList.add('active');if(t.dataset.tab==='history')renderHistory();if(t.dataset.tab==='insights')renderInsights();if(t.dataset.tab==='shop')renderShop();if(t.dataset.tab==='goals'){renderChallenges();renderGoals();renderReminders();}}));

// ===== INPUT =====
const NI=document.getElementById('note-input'),CC=document.getElementById('char-count');
NI.addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,150)+'px';CC.textContent=this.value.length;_debouncedSmartTags(this.value);});
const _debouncedSmartTags=debounce(updateSmartTags,200);
document.getElementById('add-btn').addEventListener('click',addNote);
NI.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addNote();}});

// addNote defined below with media support

function deleteNote(id){S.notes=S.notes.filter(n=>n.id!==id);save();render();}
function togglePin(id){const n=S.notes.find(n=>n.id===id);if(n){n.pinned=!n.pinned;save();render();}}
function witherCheck(){if(!S.lastNote)return;const h=(Date.now()-new Date(S.lastNote).getTime())/36e5;if(h>8){S.health=Math.max(0,S.health-Math.min(3,Math.floor((h-8)/4)));save();}}

// ===== MARKDOWN LITE =====
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>').replace(/^- (.+)/gm,'• $1');}

// ===== RENDER =====
function renderH(){const h=S.health;document.getElementById('h-fill').style.width=h+'%';document.getElementById('h-fill').style.background=h>60?'linear-gradient(90deg,var(--accent),var(--accent2))':h>30?'linear-gradient(90deg,#ffa502,#fdcb6e)':'linear-gradient(90deg,#ff4757,#ff6b81)';document.getElementById('h-val').textContent=Math.round(h)+'%';document.getElementById('h-icon').textContent=h>60?'💚':h>30?'💛':'❤️‍🩹';}
function renderXP(){const n=S.level*50;const evo=getEvoStage(S.level);document.getElementById('xp-fill').style.width=Math.min(S.xp/n*100,100)+'%';document.getElementById('xp-level').textContent=S.level;document.getElementById('xp-text').textContent=`${evo.icon} ${evo.name} · ${S.xp}/${n} XP`;}
function renderStats(){const t=new Date().toISOString().split('T')[0];document.getElementById('s-notes').textContent=S.notes.length;document.getElementById('s-streak').textContent=S.streak;document.getElementById('s-today').textContent=S.notes.filter(n=>n.day===t).length;document.getElementById('s-best').textContent=S.best;const b=document.getElementById('streak-badge');if(S.streak>1){b.style.display='inline-flex';document.getElementById('streak-text').textContent=S.streak+' day streak!';}else b.style.display='none';}
function renderQuote(){document.getElementById('quote').textContent=QUOTES[Math.floor(Math.random()*QUOTES.length)];}
function renderPrompt(){document.getElementById('prompt-text').textContent=PROMPTS[new Date().getDate()%PROMPTS.length];}
function usePrompt(){NI.value=document.getElementById('prompt-text').textContent;NI.focus();NI.style.height='auto';NI.style.height=Math.min(NI.scrollHeight,150)+'px';CC.textContent=NI.value.length;}

function noteHTML(n){
  const tags=n.tags?.length?`<div class="tags-row">${n.tags.map(t=>`<span class="tag-pill" onclick="filterTag('${t}')">${t}</span>`).join('')}</div>`:'';
  const mood=n.mood?`<span class="mood-indicator">${n.mood}</span>`:'';
  const catColors={work:'#3b82f6',personal:'#a855f7',ideas:'#f97316',journal:'#ec4899'};
  const catLabel=n.cat?`<span class="note-cat" style="background:${catColors[n.cat]||'#888'}20;color:${catColors[n.cat]||'#888'}">${n.cat}</span>`:'';
  const sent=typeof n.sentiment==='number'?n.sentiment:scoreSentiment(n.text);
  const sentHtml=sent>0?'<span class="sentiment-indicator sentiment-pos">▲+'+sent+'</span>':sent<0?'<span class="sentiment-indicator sentiment-neg">▼'+sent+'</span>':'<span class="sentiment-indicator sentiment-neutral">—</span>';
  let media='';
  if(n.photo)media+=`<div class="note-media"><img src="${n.photo}" loading="lazy"></div>`;
  if(n.voice)media+=`<div class="note-media"><audio controls src="${n.voice}"></audio></div>`;
  const locBadge=n.lat!=null?`<span class="note-location-badge" title="📍 ${n.lat.toFixed(3)}, ${n.lng.toFixed(3)}">📍</span>`:'';
  const hasReminder=S.reminders?.some(r=>r.noteId===n.id&&!r.fired);
  return `<div class="note-card glass${n.pinned?' pinned':''}"><div class="note-text">${catLabel}${mood}${md(n.text)}${sentHtml}</div>${media}${tags}<div class="note-meta"><span class="note-time">🕐 ${new Date(n.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}${locBadge}</span><div class="note-actions"><button class="note-act-btn" onclick="openReminderPicker(event,${n.id})" title="Reminder" style="${hasReminder?'color:var(--accent)':''}">⏰</button><button class="note-act-btn${n.pinned?' pinned-btn':''}" onclick="togglePin(${n.id})" title="Pin">📌</button><button class="note-act-btn" onclick="deleteNote(${n.id})">✕</button></div></div></div>`;
}

function renderMain(){
  const el=document.getElementById('main-notes');if(!S.notes.length){el.innerHTML='<div class="empty-state"><div class="emoji">🌿</div><p>Write something to grow!</p></div>';return;}
  const sorted=[...S.notes].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||new Date(b.date)-new Date(a.date));
  const grouped={};sorted.forEach(n=>{if(!grouped[n.day])grouped[n.day]=[];grouped[n.day].push(n);});
  let html='';Object.keys(grouped).sort().reverse().forEach((day,i)=>{
    const d=new Date(day+'T12:00:00'),label=isToday(d)?'📅 Today':isYday(d)?'📅 Yesterday':'📅 '+d.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'});
    html+=`<div class="day-section${!i?' first':''}"><div class="day-divider"><div class="day-divider-line"></div><span class="day-divider-label">${label}</span><span class="day-divider-count">${grouped[day].length}</span><div class="day-divider-line"></div></div>${grouped[day].map(noteHTML).join('')}</div>`;
  });el.innerHTML=html;
}

// Search & History
let searchQ='',filterT='',filterMood='',filterDateRange='all',filterHistCat='';
document.getElementById('search-input').addEventListener('input',e=>{searchQ=e.target.value.toLowerCase();renderHistory();});
function filterTag(t){filterT=filterT===t?'':t;renderHistory();}
function pickHistMood(m){filterMood=filterMood===m?'':m;document.querySelectorAll('.hist-mood-btn').forEach(b=>b.classList.toggle('active',b.dataset.mood===filterMood));renderHistory();}
function pickDateRange(r){filterDateRange=r;document.querySelectorAll('.hist-date-btn').forEach(b=>b.classList.toggle('active',b.dataset.range===r));renderHistory();}
function pickHistCat(c){filterHistCat=filterHistCat===c?'':c;document.querySelectorAll('#hist-cat-filters .cat-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===filterHistCat));renderHistory();}
function initHistMoodFilters(){document.getElementById('hist-mood-filters').innerHTML=MOODS.map(m=>`<button class="hist-mood-btn" data-mood="${m}" onclick="pickHistMood('${m}')">${m}</button>`).join('');}

function getDateRangeCutoff(){
  const now=new Date();
  if(filterDateRange==='week'){const d=new Date(now);d.setDate(d.getDate()-(d.getDay()||7)+1);d.setHours(0,0,0,0);return d;}
  if(filterDateRange==='month'){return new Date(now.getFullYear(),now.getMonth(),1);}
  if(filterDateRange==='30'){const d=new Date(now);d.setDate(d.getDate()-30);d.setHours(0,0,0,0);return d;}
  return null;
}

function renderHistory(){
  const el=document.getElementById('all-notes');
  let notes=S.notes;
  if(searchQ)notes=notes.filter(n=>n.text.toLowerCase().includes(searchQ));
  if(filterT)notes=notes.filter(n=>n.tags?.includes(filterT));
  if(filterMood)notes=notes.filter(n=>n.mood===filterMood);
  if(filterHistCat)notes=notes.filter(n=>n.cat===filterHistCat);
  const cutoff=getDateRangeCutoff();
  if(cutoff)notes=notes.filter(n=>new Date(n.date)>=cutoff);
  // Tags filter bar
  const allTags=[...new Set(S.notes.flatMap(n=>n.tags||[]))];
  document.getElementById('filter-tags').innerHTML=allTags.map(t=>`<button class="filter-tag${filterT===t?' active':''}" onclick="filterTag('${t}')">${t}</button>`).join('');

  // Pinned section (always visible regardless of filters)
  const pinnedNotes=S.notes.filter(n=>n.pinned);
  let pinnedHTML='';
  if(pinnedNotes.length){
    pinnedHTML=`<div class="pinned-section" id="pinned-section"><div class="pinned-header" onclick="togglePinnedSection()"><span class="pinned-header-arrow">▼</span><span class="pinned-header-label">📌 Pinned</span><span class="pinned-header-count">${pinnedNotes.length}</span></div><div class="pinned-notes">${pinnedNotes.map(noteHTML).join('')}</div></div>`;
  }

  if(!notes.length&&!pinnedNotes.length){el.innerHTML='<div class="empty-state"><div class="emoji">🔍</div><p>No notes found</p></div>';return;}
  const grouped={};notes.filter(n=>!n.pinned).forEach(n=>{if(!grouped[n.day])grouped[n.day]=[];grouped[n.day].push(n);});
  // Also include pinned notes in their day groups for non-pinned view
  notes.filter(n=>n.pinned).forEach(n=>{if(!grouped[n.day])grouped[n.day]=[];grouped[n.day].push(n);});
  let html=pinnedHTML;
  Object.keys(grouped).sort().reverse().forEach(day=>{
    const d=new Date(day+'T12:00:00'),label=isToday(d)?'Today':isYday(d)?'Yesterday':d.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});
    html+=`<div class="day-section collapsed" id="hist-${day}"><div class="day-divider" onclick="toggleHistDay('${day}')"><span class="day-divider-arrow">▼</span><div class="day-divider-line"></div><span class="day-divider-label">${label}</span><span class="day-divider-count">${grouped[day].length}</span><div class="day-divider-line"></div></div><div class="day-notes">${grouped[day].map(noteHTML).join('')}</div></div>`;
  });el.innerHTML=html;
}
function toggleHistDay(day){const sec=document.getElementById('hist-'+day);if(!sec)return;sec.classList.toggle('collapsed');if(!sec.classList.contains('collapsed')){const notesDiv=sec.querySelector('.day-notes');notesDiv.style.maxHeight=notesDiv.scrollHeight+'px';}}
function togglePinnedSection(){const sec=document.getElementById('pinned-section');if(!sec)return;sec.classList.toggle('collapsed');if(!sec.classList.contains('collapsed')){const notesDiv=sec.querySelector('.pinned-notes');notesDiv.style.maxHeight=notesDiv.scrollHeight+'px';}}

// ===== INSIGHTS =====
function renderInsights(){
  renderWeeklyReview();
  renderHeatmap();
  document.getElementById('i-total').textContent=S.notes.length;
  document.getElementById('i-words').textContent=S.notes.reduce((a,n)=>a+n.text.split(/\s+/).length,0);
  const days=new Set(S.notes.map(n=>n.day));
  document.getElementById('i-avg').textContent=days.size?(S.notes.length/days.size).toFixed(1):'0';
  document.getElementById('i-longest').textContent=S.best;

  // Mood breakdown
  const mc={};MOODS.forEach(m=>mc[m]=0);S.notes.forEach(n=>{if(n.mood)mc[n.mood]=(mc[n.mood]||0)+1;});
  document.getElementById('mood-breakdown').innerHTML=MOODS.map(m=>`<div class="mood-stat"><div class="mood-stat-emoji">${m}</div><div class="mood-stat-count">${mc[m]||0}</div></div>`).join('');

  // Location map
  setTimeout(renderNotesMap,200);

  // Sentiment + Word Cloud (after DOM paint)
  setTimeout(()=>{renderSentimentChart();renderWordCloud();},50);

  // Weekly chart
  const canvas=document.getElementById('week-chart'),ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth*2;canvas.height=canvas.offsetHeight*2;ctx.scale(2,2);
  const w=canvas.offsetWidth,h=canvas.offsetHeight;
  const days7=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days7.push(d.toISOString().split('T')[0]);}
  const counts=days7.map(d=>S.notes.filter(n=>n.day===d).length);
  const max=Math.max(...counts,1);
  const barW=(w-40)/7,gap=4;
  ctx.clearRect(0,0,w,h);
  const t=THEMES[C.theme]||THEMES.green;
  counts.forEach((c,i)=>{
    const bh=(c/max)*(h-30),x=20+i*(barW)+gap/2,y=h-20-bh;
    const grad=ctx.createLinearGradient(x,y,x,h-20);grad.addColorStop(0,t[0]);grad.addColorStop(1,t[1]);
    ctx.fillStyle=grad;ctx.beginPath();ctx.roundRect(x,y,barW-gap,bh,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='600 9px Nunito';ctx.textAlign='center';
    ctx.fillText(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][new Date(days7[i]+'T12:00:00').getDay()===0?6:new Date(days7[i]+'T12:00:00').getDay()-1]||days7[i].slice(-2),x+(barW-gap)/2,h-6);
    if(c>0){ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText(c,x+(barW-gap)/2,y-4);}
  });
}

// ===== BADGES =====
function checkBadges(){let newB=false;BADGES.forEach(b=>{if(!S.badges.includes(b.id)&&b.check(S)){S.badges.push(b.id);newB=true;}});if(newB)save();renderBadgeCount();}
function renderBadgeCount(){const c=S.badges.length;const el=document.getElementById('badge-count');if(c>0){el.style.display='flex';el.textContent=c;}else el.style.display='none';}
function renderBadges(){
  document.getElementById('badge-progress').textContent=`${S.badges.length}/${BADGES.length} unlocked`;
  document.getElementById('badge-grid').innerHTML=BADGES.map(b=>`<div class="badge-item glass${S.badges.includes(b.id)?'':' locked'}"><div class="badge-emoji">${b.icon}</div><div class="badge-name">${b.name}</div><div class="badge-desc">${b.desc}</div></div>`).join('');
}

// ===== POMODORO =====
let pomoTimer=null,pomoLeft=25*60,pomoWork=true;
document.getElementById('pomo-open').addEventListener('click',()=>{document.getElementById('pomo-overlay').classList.add('open');updatePomoDisplay();});
function closePomo(){document.getElementById('pomo-overlay').classList.remove('open');}
document.getElementById('pomo-start').addEventListener('click',startPomo);
document.getElementById('pomo-stop').addEventListener('click',stopPomo);
function startPomo(){if(pomoTimer)return;document.getElementById('pomo-start').style.display='none';document.getElementById('pomo-stop').style.display='';pomoTimer=setInterval(()=>{pomoLeft--;updatePomoDisplay();if(pomoLeft<=0){clearInterval(pomoTimer);pomoTimer=null;if(pomoWork){S.xp+=25;save();renderXP();document.getElementById('pomo-msg').innerHTML='<div class="pomo-xp-msg">+25 XP bonus! 🌱</div>';pomoLeft=5*60;pomoWork=false;}else{pomoLeft=25*60;pomoWork=true;document.getElementById('pomo-msg').textContent='';}document.getElementById('pomo-start').style.display='';document.getElementById('pomo-stop').style.display='none';updatePomoDisplay();}},1000);}
function stopPomo(){clearInterval(pomoTimer);pomoTimer=null;pomoLeft=25*60;pomoWork=true;document.getElementById('pomo-start').style.display='';document.getElementById('pomo-stop').style.display='none';document.getElementById('pomo-msg').textContent='';updatePomoDisplay();}
function updatePomoDisplay(){const m=Math.floor(pomoLeft/60),s=pomoLeft%60;document.getElementById('pomo-time').textContent=`${m}:${String(s).padStart(2,'0')}`;document.getElementById('pomo-label').textContent=pomoWork?'Focus Time':'Break Time';const total=pomoWork?25*60:5*60,pct=(total-pomoLeft)/total;document.getElementById('pomo-arc').style.strokeDashoffset=609.4*(1-pct);}

// ===== AMBIENT MUSIC (Lo-Fi Engine) =====
function toggleMusic(){if(C.music){window.lofiEngine?.start();}else{window.lofiEngine?.stop();}}

// ===== SHOP SYSTEM =====
const SHOP_ITEMS=[
  // Hats
  {id:'hat_party',name:'Party Hat',emoji:'🎉',cost:50,cat:'hat'},
  {id:'hat_crown',name:'Royal Crown',emoji:'👑',cost:150,cat:'hat'},
  {id:'hat_top',name:'Top Hat',emoji:'🎩',cost:80,cat:'hat'},
  {id:'hat_santa',name:'Santa Hat',emoji:'🎅',cost:100,cat:'hat'},
  {id:'hat_wizard',name:'Wizard Hat',emoji:'🧙',cost:120,cat:'hat'},
  {id:'hat_cowboy',name:'Cowboy Hat',emoji:'🤠',cost:90,cat:'hat'},
  {id:'hat_cap',name:'Baseball Cap',emoji:'🧢',cost:40,cat:'hat'},
  {id:'hat_helmet',name:'Knight Helm',emoji:'⚔️',cost:200,cat:'hat'},
  {id:'hat_alien',name:'Alien Antenna',emoji:'👽',cost:180,cat:'hat'},
  {id:'hat_chef',name:'Chef Hat',emoji:'👨‍🍳',cost:70,cat:'hat'},
  // Accessories
  {id:'acc_shades',name:'Cool Shades',emoji:'😎',cost:60,cat:'acc'},
  {id:'acc_bow',name:'Bow Tie',emoji:'🎀',cost:40,cat:'acc'},
  {id:'acc_scarf',name:'Cozy Scarf',emoji:'🧣',cost:50,cat:'acc'},
  {id:'acc_medal',name:'Gold Medal',emoji:'🏅',cost:100,cat:'acc'},
  {id:'acc_star',name:'Star Pin',emoji:'⭐',cost:30,cat:'acc'},
  {id:'acc_heart',name:'Heart Charm',emoji:'💖',cost:45,cat:'acc'},
  {id:'acc_shield',name:'Mini Shield',emoji:'🛡️',cost:80,cat:'acc'},
  {id:'acc_guitar',name:'Tiny Guitar',emoji:'🎸',cost:120,cat:'acc'},
  // Effects
  {id:'fx_sparkle',name:'Sparkle Trail',emoji:'✨',cost:100,cat:'effect'},
  {id:'fx_rainbow',name:'Rainbow Glow',emoji:'🌈',cost:150,cat:'effect'},
  {id:'fx_hearts',name:'Floating Hearts',emoji:'💕',cost:80,cat:'effect'},
  {id:'fx_stars',name:'Star Shower',emoji:'🌟',cost:90,cat:'effect'},
  {id:'fx_fire',name:'Fire Aura',emoji:'🔥',cost:200,cat:'effect'},
  {id:'fx_snow',name:'Personal Snow',emoji:'❄️',cost:120,cat:'effect'},
  {id:'fx_bubbles',name:'Bubble Float',emoji:'🫧',cost:70,cat:'effect'},
  {id:'fx_gold',name:'Golden Glow',emoji:'💛',cost:250,cat:'effect'},
  // Pot Styles
  {id:'pot_diamond',name:'Diamond Pot',emoji:'💎',cost:300,cat:'pot'},
  {id:'pot_rainbow',name:'Rainbow Pot',emoji:'🌈',cost:200,cat:'pot'},
  {id:'pot_neon',name:'Neon Pot',emoji:'💜',cost:150,cat:'pot'},
  {id:'pot_gold',name:'Golden Pot',emoji:'🏆',cost:400,cat:'pot'},
  {id:'pot_crystal',name:'Crystal Pot',emoji:'🔮',cost:250,cat:'pot'},
  // Backgrounds
  {id:'bg_galaxy',name:'Galaxy Scene',emoji:'🌌',cost:300,cat:'bg'},
  {id:'bg_aurora',name:'Northern Lights',emoji:'🌌',cost:350,cat:'bg'},
  {id:'bg_underwater',name:'Underwater',emoji:'🐠',cost:250,cat:'bg'},
  {id:'bg_cherry',name:'Cherry Blossoms',emoji:'🌸',cost:200,cat:'bg'},
  {id:'bg_campfire',name:'Campfire Night',emoji:'🏕️',cost:180,cat:'bg'},
];

function getSpendableXP(){return S.xp + (S.level-1)*50;} // Rough total XP earned
function renderShop(){
  const bank=S.xp;
  document.getElementById('xp-bank').textContent=`⭐ ${bank} XP Available`;
  const cats={hat:'🎩 Hats',acc:'✨ Accessories',effect:'🌟 Effects',pot:'🏺 Special Pots',bg:'🖼️ Backgrounds'};
  let html='';
  Object.entries(cats).forEach(([key,title])=>{
    html+=`<div class="shop-cat-title">${title}</div><div class="shop-grid">`;
    SHOP_ITEMS.filter(i=>i.cat===key).forEach(item=>{
      const owned=S.owned?.includes(item.id);
      const equipped=(S.equipped||{})[item.cat]===item.id;
      html+=`<div class="shop-item glass${owned?' owned':''}${equipped?' equipped':''}" onclick="shopAction('${item.id}')">
        ${owned?'<div class="shop-owned-badge">'+(equipped?'ON':'✓')+'</div>':''}
        <div class="shop-emoji">${item.emoji}</div>
        <div class="shop-name">${item.name}</div>
        <div class="shop-cost">${owned?(equipped?'Equipped':'Tap to equip'):'⭐ '+item.cost+' XP'}</div>
      </div>`;
    });
    html+=`</div>`;
  });
  document.getElementById('shop-content').innerHTML=html;
}

function shopAction(id){
  if(!S.owned)S.owned=[];
  if(!S.equipped)S.equipped={};
  const item=SHOP_ITEMS.find(i=>i.id===id);if(!item)return;
  if(S.owned.includes(id)){
    // Toggle equip
    if(S.equipped[item.cat]===id)S.equipped[item.cat]='';
    else S.equipped[item.cat]=id;
    save();renderShop();applyCosmetics();
  } else {
    if(S.xp<item.cost){alert('Not enough XP! You need '+item.cost+' XP.');return;}
    S.xp-=item.cost;
    S.owned.push(id);
    S.equipped[item.cat]=id;
    save();renderShop();renderXP();applyCosmetics();
  }
}

function applyCosmetics(){
  const eq=S.equipped||{};
  // Hat
  const hatEl=document.getElementById('plant-hat');
  if(eq.hat){const item=SHOP_ITEMS.find(i=>i.id===eq.hat);hatEl.style.display='block';hatEl.textContent=item?.emoji||'';hatEl.style.top='-25px';hatEl.style.left='50%';hatEl.style.transform='translateX(-50%)';}
  else hatEl.style.display='none';
  // Accessory
  const accEl=document.getElementById('plant-acc');
  if(eq.acc){const item=SHOP_ITEMS.find(i=>i.id===eq.acc);accEl.style.display='block';accEl.textContent=item?.emoji||'';accEl.style.bottom='20px';accEl.style.left='50%';accEl.style.transform='translateX(-50%);';accEl.style.fontSize='1.2rem';}
  else accEl.style.display='none';
  // Effect
  const fxEl=document.getElementById('plant-effect');
  if(eq.effect){
    const item=SHOP_ITEMS.find(i=>i.id===eq.effect);
    const t=THEMES[C.theme]||THEMES.green;
    if(eq.effect==='fx_rainbow')fxEl.innerHTML=`<div class="glow-effect" style="width:80px;height:80px;position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(255,100,100,.2),rgba(100,255,100,.1),rgba(100,100,255,.1))"></div>`;
    else if(eq.effect==='fx_gold')fxEl.innerHTML=`<div class="glow-effect" style="width:70px;height:70px;position:absolute;bottom:65px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(255,215,0,.3),transparent)"></div>`;
    else if(eq.effect==='fx_fire')fxEl.innerHTML=`<div class="glow-effect" style="width:60px;height:60px;position:absolute;bottom:70px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(255,100,0,.3),transparent)"></div>`;
    else fxEl.innerHTML=`<div style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);font-size:1.5rem;animation:seasonFloat 3s ease-in-out infinite">${item?.emoji||''}</div>`;
  } else fxEl.innerHTML='';
}

// ===== HABITS (removed from UI) =====

// ===== CATEGORIES =====
function pickCat(cat){C.cat=C.cat===cat?'':cat;saveC();document.querySelectorAll('.cat-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===C.cat));}

// ===== TEMPLATES =====
const TEMPLATES={
  grateful:'Today I am grateful for:\n1. \n2. \n3. ',
  meeting:'📋 Meeting Notes\nDate: '+new Date().toLocaleDateString()+'\nAttendees: \nAgenda:\n- \nAction Items:\n- ',
  reflect:'🌙 Evening Reflection\nWhat went well today?\n\nWhat could improve?\n\nWhat am I looking forward to tomorrow?\n',
  braindump:'🧠 Brain Dump\nJust let it all out...\n\n'
};
function useTemplate(t){NI.value=TEMPLATES[t]||'';NI.focus();NI.style.height='auto';NI.style.height=Math.min(NI.scrollHeight,150)+'px';CC.textContent=NI.value.length;}

// ===== TIME CAPSULES =====
document.getElementById('capsule-open').addEventListener('click',()=>{openPanel('capsule-overlay');renderCapsules();});
function createCapsule(){
  const text=document.getElementById('capsule-text').value.trim();
  const date=document.getElementById('capsule-date').value;
  if(!text||!date){alert('Write a message and pick a date!');return;}
  if(!S.capsules)S.capsules=[];
  S.capsules.push({id:Date.now(),text,unlockDate:date,created:new Date().toISOString()});
  save();document.getElementById('capsule-text').value='';renderCapsules();
}
function renderCapsules(){
  if(!S.capsules)S.capsules=[];
  const today=new Date().toISOString().split('T')[0];
  document.getElementById('capsules-list').innerHTML=S.capsules.map(c=>{
    const unlocked=today>=c.unlockDate;
    return `<div class="capsule-card glass${unlocked?' capsule-unlock':''}">
      <div class="capsule-date">${unlocked?'🔓 Unlocked!':'🔒 Opens '+c.unlockDate}</div>
      <div class="${unlocked?'':'capsule-locked'}" style="margin-top:8px;font-size:.9rem">${unlocked?esc(c.text):'This message is sealed...'}</div>
    </div>`;
  }).join('')||'<div class="empty-state"><div class="emoji">⏰</div><p>Write a message to your future self!</p></div>';
}

// ===== STREAK FREEZE =====
function checkFreeze(){
  if(!S.freezes)S.freezes=0;
  if(!S.lastFreezeAward)S.lastFreezeAward=0;
  // Award a freeze every 7 days of streak
  const freezesEarned=Math.floor(S.best/7);
  if(freezesEarned>S.lastFreezeAward){S.freezes+=freezesEarned-S.lastFreezeAward;S.lastFreezeAward=freezesEarned;save();}
  const el=document.getElementById('freeze-badge');
  if(S.freezes>0){el.style.display='inline-flex';document.getElementById('freeze-count').textContent=S.freezes;}
  else el.style.display='none';
}

// ===== CALENDAR HEATMAP =====
function renderHeatmap(){
  const el=document.getElementById('heatmap');
  let html='';const today=new Date();
  for(let i=89;i>=0;i--){
    const d=new Date(today);d.setDate(d.getDate()-i);
    const day=d.toISOString().split('T')[0];
    const count=S.notes.filter(n=>n.day===day).length;
    const lvl=count===0?'':count<=2?'l1':count<=4?'l2':count<=7?'l3':'l4';
    html+=`<div class="hm-cell ${lvl}" title="${day}: ${count} notes"></div>`;
  }
  el.innerHTML=html;
  // Month labels
  const months=[];for(let i=89;i>=0;i-=30){const d=new Date(today);d.setDate(d.getDate()-i);months.push(d.toLocaleDateString([],{month:'short'}));}
  document.getElementById('hm-months').innerHTML=months.map(m=>`<span>${m}</span>`).join('');
}

// ===== WEATHER IN SCENE =====
function fetchWeather(){
  if(!navigator.geolocation)return;
  navigator.geolocation.getCurrentPosition(pos=>{
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`)
    .then(r=>r.json()).then(d=>{
      if(d.current_weather)applyWeather(d.current_weather);
    }).catch(()=>{});
  },()=>{},{ timeout: 5000 });
}
function applyWeather(w){
  const el=document.getElementById('weather-overlay');
  const code=w.weathercode;
  if([61,63,65,80,81,82].includes(code)){// Rain
    let rain='';for(let i=0;i<30;i++){rain+=`<div class="rain-drop" style="left:${Math.random()*100}%;height:${10+Math.random()*15}px;animation-duration:${.5+Math.random()*.5}s;animation-delay:${Math.random()*2}s;top:${-Math.random()*20}px"></div>`;}
    el.innerHTML=rain;
  } else if([71,73,75,77].includes(code)){// Snow
    let snow='';for(let i=0;i<20;i++){snow+=`<div class="snow-flake" style="left:${Math.random()*100}%;width:${2+Math.random()*4}px;height:${2+Math.random()*4}px;animation-duration:${3+Math.random()*4}s;animation-delay:${Math.random()*5}s"></div>`;}
    el.innerHTML=snow;
  } else el.innerHTML='';
}

// ===== SEASONAL EVENTS =====
function applySeasonal(){}

// ===== CHAT =====
const CI=document.getElementById('chat-input'),CM=document.getElementById('chat-msgs');
document.getElementById('chat-send').addEventListener('click',sendChat);CI.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendChat();}});
function sendChat(){const t=CI.value.trim();if(!t)return;CI.value='';addBub('user',t,'😊');setTimeout(()=>{const tid='t'+Date.now();addTyp(tid);setTimeout(()=>{remTyp(tid);procChat(t);},600+Math.random()*500);},200);}
function procChat(i){const l=i.toLowerCase();if(l.match(/^(hi|hey|hello)/)){addBub('bot','Hey! What to note? 🌿','🌱');return;}if(l.match(/^(thanks|thx)/)){addBub('bot','Anytime! 💚','🌱');return;}
let nt='',r='';if(l.startsWith('remind me')){nt=i.replace(/^remind me (to )?/i,'');nt=nt[0].toUpperCase()+nt.slice(1);r='Reminder:';}else if(l.includes('idea')){nt='💡 '+i[0].toUpperCase()+i.slice(1);r='Idea captured!';}else if(l.includes('goal')){nt='🎯 '+i[0].toUpperCase()+i.slice(1);r='Goal set!';}else{nt=i[0].toUpperCase()+i.slice(1);r='Noted!';}
const nid=Date.now();window._pn=window._pn||{};window._pn[nid]=nt;
addBub('bot',`${r}<div class="note-preview">${esc(nt)}</div><div class="save-prompt"><button class="save-yes" onclick="saveCN(${nid})">Save ✓</button><button class="save-edit" onclick="editCN(${nid})">Edit ✎</button></div>`,'🌱',true);}
function saveCN(id){const t=window._pn[id];if(!t)return;delete window._pn[id];const now=new Date(),today=now.toISOString().split('T')[0];if(S.lastNote){const ld=new Date(S.lastNote).toISOString().split('T')[0],y=new Date(now);y.setDate(y.getDate()-1);if(ld!==today)S.streak=ld===y.toISOString().split('T')[0]?S.streak+1:1;}else S.streak=1;S.best=Math.max(S.best,S.streak);S.lastNote=now.toISOString();S.notes.unshift({id:Date.now(),text:t,date:now.toISOString(),day:today,mood:'',tags:(t.match(/#\w+/g)||[]).map(t=>t.toLowerCase()),pinned:false,sentiment:scoreSentiment(t)});S.health=Math.min(100,S.health+10);S.xp+=10+Math.floor(t.length/15);if(S.xp>=S.level*50){S.xp-=S.level*50;S.level++;if(!checkEvolution(S.level))showLevelUp();}checkBadges();save();if(C.particles){spawnDrops();spawnSparkles();}render();addBub('bot','Saved! 🌱','🌱');}
function editCN(id){const t=window._pn[id];if(!t)return;CI.value=t;CI.focus();delete window._pn[id];}
function addBub(type,c,av,html){const b=document.createElement('div');b.className='chat-bubble '+type;b.innerHTML=`<div class="chat-avatar">${av||'🌱'}</div><div class="chat-text glass">${html?c:esc(c)}</div>`;CM.appendChild(b);setTimeout(()=>CM.scrollTop=CM.scrollHeight,50);}
function addTyp(id){const b=document.createElement('div');b.className='chat-bubble bot';b.id=id;b.innerHTML=`<div class="chat-avatar">🌱</div><div class="chat-text glass"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;CM.appendChild(b);}
function remTyp(id){document.getElementById(id)?.remove();}

// ===== NOTION =====
const CP='https://corsproxy.io/?';let nC=JSON.parse(localStorage.getItem('gt_notion')||'null')||{key:'',db:'',name:'',connected:false,autoSync:false,synced:[]};
function saveN(){localStorage.setItem('gt_notion',JSON.stringify(nC));}
function nApi(ep,m,b){return fetch(`${CP}${encodeURIComponent('https://api.notion.com/v1/'+ep)}`,{method:m||'GET',headers:{'Authorization':'Bearer '+nC.key,'Notion-Version':'2022-06-28','Content-Type':'application/json'},body:b?JSON.stringify(b):undefined}).then(r=>r.json());}
function nLog(m,t){const e=document.createElement('div');e.className='sync-log-entry glass '+(t||'info');e.textContent=`[${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}] ${m}`;document.getElementById('notion-sync-log').prepend(e);}
document.getElementById('notion-connect').addEventListener('click',async()=>{const k=document.getElementById('notion-key').value.trim(),raw=document.getElementById('notion-db-id').value.trim(),s=document.getElementById('notion-status');if(!k||!raw){s.style.display='block';s.style.background='rgba(255,71,87,.1)';s.style.color='#ff4757';s.textContent='Fill both fields';return;}nC.key=k;nC.db=(raw.match(/([a-f0-9]{32})/)||['',raw.replace(/-/g,'')])[1];s.style.display='block';s.style.background='rgba(0,230,167,.1)';s.style.color='var(--accent)';s.textContent='Testing...';try{const r=await nApi('databases/'+nC.db);if(r.object==='database'){nC.connected=true;nC.name=r.title?.[0]?.plain_text||'DB';saveN();renderNotion();}else{s.style.background='rgba(255,71,87,.1)';s.style.color='#ff4757';s.textContent='❌ '+(r.message||'Failed');}}catch(e){s.textContent='❌ '+e.message;}});
document.getElementById('notion-disconnect').addEventListener('click',()=>{nC={key:'',db:'',name:'',connected:false,autoSync:false,synced:[]};saveN();renderNotion();});
async function syncNote(n){if(!nC.connected||nC.synced.includes(n.id))return;try{const r=await nApi('pages','POST',{parent:{database_id:nC.db},properties:{Name:{title:[{text:{content:n.text.substring(0,100)}}]}},children:[{object:'block',type:'paragraph',paragraph:{rich_text:[{text:{content:n.text}}]}}]});if(r.object==='page'){nC.synced.push(n.id);saveN();}}catch(e){}}
document.getElementById('notion-sync-all').addEventListener('click',async()=>{const u=S.notes.filter(n=>!nC.synced.includes(n.id));nLog(`Syncing ${u.length}...`,'info');let s=0;for(const n of u){await syncNote(n);s++;await new Promise(r=>setTimeout(r,400));}nLog(`✅ ${s} synced`,'success');});
document.getElementById('notion-sync-today').addEventListener('click',async()=>{const t=new Date().toISOString().split('T')[0],u=S.notes.filter(n=>n.day===t&&!nC.synced.includes(n.id));for(const n of u){await syncNote(n);await new Promise(r=>setTimeout(r,400));}nLog(`✅ Today synced`,'success');});
document.getElementById('notion-auto-toggle').addEventListener('click',()=>{nC.autoSync=!nC.autoSync;saveN();document.getElementById('auto-sync-icon').textContent=nC.autoSync?'🔄':'⏸️';document.getElementById('auto-sync-label').textContent='Auto-Sync: '+(nC.autoSync?'On':'Off');});
function renderNotion(){if(nC.connected){document.getElementById('notion-setup').style.display='none';document.getElementById('notion-connected').style.display='block';document.getElementById('notion-db-name').textContent=nC.name;}else{document.getElementById('notion-setup').style.display='block';document.getElementById('notion-connected').style.display='none';}}

// ===== EFFECTS =====
function spawnDrops(){const s=document.getElementById('scene');for(let i=0;i<5;i++)setTimeout(()=>{const d=document.createElement('div');d.className='water-drop';d.style.left=(42+Math.random()*16)+'%';d.style.top='30%';s.appendChild(d);setTimeout(()=>d.remove(),1200);},i*100);}
function spawnSparkles(){const s=document.getElementById('scene'),cols=['#ffeaa7','#55efc4','#00c9ff','#ff9ff3','#f368e0'];for(let i=0;i<12;i++)setTimeout(()=>{const p=document.createElement('div');p.className='sparkle';p.style.left=(30+Math.random()*40)+'%';p.style.bottom=(30+Math.random()*40)+'%';p.style.width=p.style.height=(4+Math.random()*8)+'px';p.style.background=cols[Math.floor(Math.random()*cols.length)];p.style.borderRadius=Math.random()>.5?'50%':'2px';s.appendChild(p);setTimeout(()=>p.remove(),1000);},i*50);}
function showLevelUp(){const o=document.createElement('div');o.className='lu-overlay';const m={3:'🌿 Sprout!',4:'🌸 Bloom!',5:'🌺 Flourishing!',8:'🌳 Mighty!',10:'👑 Master!'};o.innerHTML=`<div class="lu-card"><div class="lu-icon">🎉</div><div class="lu-title">Level ${S.level}!</div><div class="lu-sub">${m[S.level]||'🌟 Growing!'}</div><button onclick="this.closest('.lu-overlay').remove()">Continue</button></div>`;document.body.appendChild(o);}

// ===== SPEECH =====
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let activeR=null;
function setupMic(btn,target,ind){const b=document.getElementById(btn);if(!SR){b.style.display='none';return;}b.addEventListener('click',()=>{if(b.classList.contains('recording')){if(activeR)activeR.stop();return;}if(activeR)activeR.stop();const r=new SR();r.lang='en-US';r.continuous=true;r.interimResults=true;const t=document.getElementById(target),indEl=document.getElementById(ind);let ft=t.value?t.value+' ':'';b.classList.add('recording');indEl.classList.add('active');activeR=r;r.onresult=e=>{let int='';for(let i=e.resultIndex;i<e.results.length;i++)e.results[i].isFinal?ft+=e.results[i][0].transcript:int=e.results[i][0].transcript;t.value=ft+int;if(t.tagName==='TEXTAREA'){t.style.height='auto';t.style.height=Math.min(t.scrollHeight,150)+'px';CC.textContent=t.value.length;}};r.onend=()=>{b.classList.remove('recording');indEl.classList.remove('active');activeR=null;t.value=ft.trim();};r.onerror=()=>{b.classList.remove('recording');indEl.classList.remove('active');activeR=null;};r.start();});}
setupMic('mic-w','note-input','rec-w');setupMic('mic-c','chat-input','rec-c');

// ===== SETTINGS =====
function openPanel(id){document.getElementById(id).classList.add('open');}
function closePanel(id){document.getElementById(id).classList.remove('open');}
document.getElementById('settings-open').addEventListener('click',()=>openPanel('settings-overlay'));
document.getElementById('badges-open').addEventListener('click',()=>{openPanel('badges-overlay');renderBadges();});

function setupToggle(id,key){const el=document.getElementById(id);el.classList.toggle('on',C[key]);el.addEventListener('click',()=>{C[key]=!C[key];el.classList.toggle('on',C[key]);saveC();if(key==='sky')updateSky();if(key==='music')toggleMusic();});}
setupToggle('t-sky','sky');setupToggle('t-particles','particles');setupToggle('t-music','music');

document.querySelectorAll('#theme-picker .color-opt').forEach(e=>e.addEventListener('click',()=>{C.theme=e.dataset.theme;saveC();applyTheme();render();}));
document.querySelectorAll('#plant-picker .plant-opt').forEach(e=>e.addEventListener('click',()=>{C.plant=e.dataset.plant;saveC();applyTheme();renderPlant();}));
document.querySelectorAll('#pot-picker .color-opt').forEach(e=>e.addEventListener('click',()=>{C.pot=e.dataset.pot;saveC();applyTheme();}));
document.getElementById('plant-name').value=C.name;
document.getElementById('plant-name').addEventListener('input',e=>{C.name=e.target.value;saveC();});

document.getElementById('export-data').addEventListener('click',()=>{const d=JSON.stringify(S,null,2);const b=new Blob([d],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='growthink.json';a.click();});
document.getElementById('reset-data').addEventListener('click',()=>{if(confirm('Reset everything?')){localStorage.clear();location.reload();}});

// ===== PET SYSTEM =====
function pickPet(emoji){C.pet=emoji;saveC();renderPet();document.querySelectorAll('#pet-picker .plant-opt').forEach(b=>b.classList.toggle('active',b.dataset.pet===C.pet));}
function renderPet(){
  const wrap=document.getElementById('pet-wrap'),em=document.getElementById('pet-emoji');
  if(!C.pet){wrap.style.display='none';return;}
  wrap.style.display='block';em.textContent=C.pet;
  const h=new Date().getHours();const sleeping=h>=23||h<6;
  wrap.className='pet-wrap'+(sleeping?' pet-sleep':'');
  wrap.style.bottom='35px';wrap.style.right='15px';
}
const PET_MSGS=['🌱 Looking good!','Water me!','Nice note!','🎵 Vibing...','Grow grow grow!','You\'re on fire!','Keep it up!','✨ Magical!','Sleepy...','Let\'s go!'];
function petTap(){
  const wrap=document.getElementById('pet-wrap');
  const msg=document.createElement('div');msg.className='pet-msg';
  msg.textContent=PET_MSGS[Math.floor(Math.random()*PET_MSGS.length)];
  wrap.appendChild(msg);setTimeout(()=>msg.remove(),3000);
}
function petReact(text){
  if(!C.pet)return;
  const wrap=document.getElementById('pet-wrap');
  const em=document.getElementById('pet-emoji');
  em.style.transform='scale(1.3)';setTimeout(()=>em.style.transform='',500);
}

// ===== PLANT PERSONALITY =====
function plantSpeak(msg){
  const el=document.getElementById('plant-speech');
  const div=document.createElement('div');div.className='plant-speech';div.textContent=msg;
  el.appendChild(div);setTimeout(()=>div.remove(),4500);
}
function plantReact(){
  const h=S.health;const lvl=S.level;
  const msgs=[];
  if(h<20)msgs.push('I\'m so thirsty... 🥀','Please write something...','Help me...');
  else if(h<50)msgs.push('Could use some notes...','Feeling a bit dry','Write to water me!');
  else msgs.push('Feeling great! 🌱','Keep the notes coming!','I\'m thriving!','Thank you! ✨');
  if(lvl>=5)msgs.push('I\'m getting so tall!','Look at my flowers!');
  if(S.streak>=7)msgs.push('Amazing streak! 🔥','Unstoppable!');
  // Random chance to speak
  if(Math.random()>0.7)plantSpeak(msgs[Math.floor(Math.random()*msgs.length)]);
}

// ===== DAILY CHALLENGES =====
const CHALLENGE_DEFS=[
  {id:'write3',name:'Triple Threat',desc:'Write 3 notes today',icon:'✍️',target:3,reward:30,check:s=>{const t=new Date().toISOString().split('T')[0];return s.notes.filter(n=>n.day===t).length;}},
  {id:'write5',name:'Fab Five',desc:'Write 5 notes today',icon:'🖐️',target:5,reward:50,check:s=>{const t=new Date().toISOString().split('T')[0];return s.notes.filter(n=>n.day===t).length;}},
  {id:'write10',name:'Note Machine',desc:'Write 10 notes today',icon:'🤖',target:10,reward:100,check:s=>{const t=new Date().toISOString().split('T')[0];return s.notes.filter(n=>n.day===t).length;}},
  {id:'long',name:'Deep Thinker',desc:'Write a note over 100 characters',icon:'🧠',target:1,reward:25,check:s=>{const t=new Date().toISOString().split('T')[0];return s.notes.filter(n=>n.day===t&&n.text.length>100).length;}},
  {id:'mood3',name:'Mood Ring',desc:'Use 3 different moods today',icon:'🎭',target:3,reward:40,check:s=>{const t=new Date().toISOString().split('T')[0];return new Set(s.notes.filter(n=>n.day===t&&n.mood).map(n=>n.mood)).size;}},
];
function renderChallenges(){
  const today=new Date().toISOString().split('T')[0];
  if(!S.challengesDone)S.challengesDone={};
  document.getElementById('challenges-list').innerHTML=CHALLENGE_DEFS.map(c=>{
    const prog=c.check(S);const done=S.challengesDone[today+'_'+c.id];const pct=Math.min(prog/c.target*100,100);
    return `<div class="challenge-card glass${done?' challenge-done':''}"><div class="challenge-icon">${c.icon}</div><div class="challenge-info"><div class="challenge-name">${c.name}</div><div class="challenge-progress">${c.desc} (${Math.min(prog,c.target)}/${c.target})</div><div class="challenge-bar"><div class="challenge-fill" style="width:${pct}%"></div></div></div><div class="challenge-reward">${done?'✅':'⭐'+c.reward}</div></div>`;
  }).join('');
}
function checkChallenges(){
  const today=new Date().toISOString().split('T')[0];
  if(!S.challengesDone)S.challengesDone={};
  CHALLENGE_DEFS.forEach(c=>{
    const key=today+'_'+c.id;
    if(!S.challengesDone[key]&&c.check(S)>=c.target){
      S.challengesDone[key]=true;S.xp+=c.reward;save();
      plantSpeak('Challenge done! +'+c.reward+' XP! 🎉');
    }
  });
}

// ===== GOALS =====
function addGoal(){
  const input=document.getElementById('goal-input');const text=input.value.trim();if(!text)return;
  if(!S.goals)S.goals=[];
  S.goals.push({id:Date.now(),text,progress:0,target:100,created:new Date().toISOString()});
  save();input.value='';renderGoals();
}
function updateGoalProgress(id,delta){
  const g=S.goals?.find(g=>g.id===id);if(!g)return;
  g.progress=Math.min(g.target,Math.max(0,g.progress+delta));
  if(g.progress>=g.target){S.xp+=50;plantSpeak('Goal complete! +50 XP! 🎯');}
  save();renderGoals();renderXP();
}
function deleteGoal(id){S.goals=S.goals?.filter(g=>g.id!==id);save();renderGoals();}
function renderGoals(){
  if(!S.goals)S.goals=[];
  document.getElementById('goals-list').innerHTML=S.goals.map(g=>{
    const pct=(g.progress/g.target)*100;const done=g.progress>=g.target;
    return `<div class="goal-card glass${done?' challenge-done':''}"><div class="goal-header"><div class="goal-name">${done?'✅ ':''}${esc(g.text)}</div></div><div class="goal-bar"><div class="goal-fill" style="width:${pct}%"></div></div><div class="goal-actions"><button class="goal-btn" onclick="updateGoalProgress(${g.id},-10)">-10</button><button class="goal-btn" onclick="updateGoalProgress(${g.id},10)">+10</button><button class="goal-btn" onclick="updateGoalProgress(${g.id},25)">+25</button><button class="goal-btn" style="color:var(--danger)" onclick="deleteGoal(${g.id})">✕</button></div></div>`;
  }).join('')||'<div class="empty-state"><div class="emoji">🎯</div><p>Set a goal to work towards!</p></div>';
}

// ===== SOUNDSCAPES =====
let activeSounds={};
function toggleSound(name){
  if(activeSounds[name]){window.soundscape.stop(name);delete activeSounds[name];}
  else{const methods={rain:'startRain',ocean:'startOcean',forest:'startForest',fire:'startCampfire',cafe:'startCafe'};window.soundscape[methods[name]]?.();activeSounds[name]=true;}
  document.querySelectorAll('#sound-grid .sound-btn').forEach(b=>b.classList.toggle('active',!!activeSounds[b.dataset.sound]));
}
function stopAllSounds(){Object.keys(activeSounds).forEach(k=>{window.soundscape.stop(k);delete activeSounds[k];});document.querySelectorAll('#sound-grid .sound-btn').forEach(b=>b.classList.remove('active'));}

// ===== SHARE & EXPORT =====
document.getElementById('share-open').addEventListener('click',()=>openPanel('share-overlay'));
function shareNative(){
  if(!navigator.share){alert('Share not supported on this browser');return;}
  const today=new Date().toISOString().split('T')[0];
  const todayNotes=S.notes.filter(n=>n.day===today);
  const text='🌱 GroWthink - '+today+'\n\n'+todayNotes.map(n=>'• '+n.text).join('\n')+'\n\n🌿 Level '+S.level+' | 🔥 '+S.streak+' day streak';
  navigator.share({title:'GroWthink Notes',text}).catch(()=>{});
}
function exportMD(){
  const grouped={};S.notes.forEach(n=>{if(!grouped[n.day])grouped[n.day]=[];grouped[n.day].push(n);});
  let md='# 🌱 GroWthink Notes\n\n';
  Object.keys(grouped).sort().reverse().forEach(day=>{
    md+=`## ${day}\n\n`;grouped[day].forEach(n=>{md+=`- ${n.mood||''} ${n.text}\n`;});md+='\n';
  });
  dl(md,'growthink.md','text/markdown');
}
function exportCSV(){
  let csv='Date,Time,Mood,Category,Text\n';
  S.notes.forEach(n=>{csv+=`"${n.day}","${new Date(n.date).toLocaleTimeString()}","${n.mood||''}","${n.cat||''}","${n.text.replace(/"/g,'""')}"\n`;});
  dl(csv,'growthink.csv','text/csv');
}
function exportJSON(){dl(JSON.stringify(S,null,2),'growthink.json','application/json');}
function exportTXT(){
  let txt='GroWthink Notes\n================\n\n';
  S.notes.forEach(n=>{txt+=`[${n.day} ${new Date(n.date).toLocaleTimeString()}] ${n.mood||''} ${n.text}\n\n`;});
  dl(txt,'growthink.txt','text/plain');
}
function dl(content,name,type){const b=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();}
function sharePlant(){
  const text=`🌱 My GroWthink Plant\n\n🌿 Level ${S.level} | ${C.plant==='cactus'?'🌵':C.plant==='bonsai'?'🌳':C.plant==='vine'?'🌿':'🌸'}\n💚 Health: ${Math.round(S.health)}%\n📝 ${S.notes.length} notes\n🔥 ${S.streak} day streak\n🏆 ${S.badges?.length||0} badges\n\nGrow yours at: kevinb2212.github.io/growthink`;
  if(navigator.share)navigator.share({title:'My GroWthink Plant',text}).catch(()=>{});
  else{navigator.clipboard?.writeText(text);alert('Copied to clipboard!');}
}

// ===== PHOTO NOTES =====
let pendingPhoto=null;
function takePhoto(){
  const input=document.createElement('input');input.type='file';input.accept='image/*';input.capture='environment';
  input.onchange=e=>{const file=e.target.files[0];if(!file)return;
    // Compress to max 300px wide to save localStorage space
    const img=new Image();const reader=new FileReader();
    reader.onload=ev=>{img.onload=()=>{const canvas=document.createElement('canvas');const maxW=300;const scale=Math.min(maxW/img.width,1);canvas.width=img.width*scale;canvas.height=img.height*scale;canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);pendingPhoto=canvas.toDataURL('image/jpeg',0.7);NI.placeholder='📷 Photo attached! Add a caption...';NI.focus();};img.src=ev.target.result;};
    reader.readAsDataURL(file);};
  input.click();
}

// ===== VOICE NOTES =====
let voiceRecorder=null,voiceChunks=[];
function toggleVoiceNote(){
  const btn=document.getElementById('voice-btn');
  if(voiceRecorder&&voiceRecorder.state==='recording'){
    voiceRecorder.stop();btn.textContent='🎤';btn.style.background='';return;
  }
  navigator.mediaDevices?.getUserMedia({audio:true}).then(stream=>{
    voiceRecorder=new MediaRecorder(stream);voiceChunks=[];
    voiceRecorder.ondataavailable=e=>voiceChunks.push(e.data);
    voiceRecorder.onstop=()=>{
      const blob=new Blob(voiceChunks,{type:'audio/webm'});
      const reader=new FileReader();reader.onload=e=>{
        pendingVoice=e.target.result;NI.placeholder='🎤 Voice note recorded! Add text...';NI.focus();
      };reader.readAsDataURL(blob);
      stream.getTracks().forEach(t=>t.stop());
    };
    voiceRecorder.start();btn.textContent='⏹️';btn.style.background='rgba(255,71,87,.15)';
  }).catch(()=>alert('Microphone access denied'));
}
let pendingVoice=null;

// ===== PIN LOCK =====
let pinBuffer='',pinMode='',pinCallback=null;
function setupPIN(){pinMode='set';pinBuffer='';document.getElementById('pin-title').textContent='Set a 4-digit PIN';document.getElementById('pin-overlay').classList.add('open');updatePinDots();}
function pinKey(n){if(pinBuffer.length>=4)return;pinBuffer+=n;updatePinDots();}
function pinClear(){pinBuffer='';updatePinDots();}
function pinSubmit(){
  if(pinBuffer.length!==4)return;
  if(pinMode==='set'){C.pin=pinBuffer;saveC();document.getElementById('pin-overlay').classList.remove('open');alert('PIN set! ✅');pinBuffer='';pinMode='';}
  else if(pinMode==='unlock'){
    if(pinBuffer===C.pin){document.getElementById('pin-overlay').classList.remove('open');pinBuffer='';pinMode='';if(pinCallback)pinCallback();}
    else{pinBuffer='';updatePinDots();document.getElementById('pin-title').textContent='Wrong PIN! Try again';}
  }
}
function updatePinDots(){document.querySelectorAll('#pin-dots .pin-dot').forEach((d,i)=>d.classList.toggle('filled',i<pinBuffer.length));}

// ===== ADD NOTE (with media support) =====
function addNote(){
  const text=NI.value.trim();if(!text&&!pendingPhoto&&!pendingVoice)return;
  const now=new Date(),today=now.toISOString().split('T')[0];
  if(S.lastNote){const ld=new Date(S.lastNote).toISOString().split('T')[0],y=new Date(now);y.setDate(y.getDate()-1);if(ld!==today){S.streak=ld===y.toISOString().split('T')[0]?S.streak+1:1;}}else S.streak=1;
  S.best=Math.max(S.best,S.streak);S.lastNote=now.toISOString();
  const tags=(text.match(/#\w+/g)||[]).map(t=>t.toLowerCase());
  const note={id:Date.now(),text:text||'📷 Photo note',date:now.toISOString(),day:today,mood:C.mood||'',tags,pinned:false,cat:C.cat||'',sentiment:scoreSentiment(text||'')};
  if(pendingPhoto){note.photo=pendingPhoto;pendingPhoto=null;NI.placeholder='What\'s growing in your mind? ✨';}
  if(pendingVoice){note.voice=pendingVoice;pendingVoice=null;NI.placeholder='What\'s growing in your mind? ✨';}
  if(cachedLocation){note.lat=cachedLocation.lat;note.lng=cachedLocation.lng;}
  S.notes.unshift(note);
  S.health=Math.min(100,S.health+10);S.xp+=10+Math.floor((text||'').length/15);
  if(S.xp>=S.level*50){S.xp-=S.level*50;S.level++;if(!checkEvolution(S.level))showLevelUp();}
  if(note.cat)growGardenPlant(note.cat);
  checkBadges();checkChallenges();save();NI.value='';NI.style.height='auto';CC.textContent='0';C.mood='';C.cat='';saveC();
  document.querySelectorAll('.mood-btn,.cat-btn').forEach(b=>b.classList.remove('active','selected'));
  if(C.particles){spawnDrops();spawnSparkles();}
  document.getElementById('smart-tag-suggestions').innerHTML='';
  petReact();plantReact();render();renderChallenges();
  if(nC.autoSync&&nC.connected)syncNote(S.notes[0]);
}

// Media support integrated into noteHTML directly

// ===== SENTIMENT ANALYSIS =====
const POS_WORDS=['happy','great','amazing','love','wonderful','excited','grateful','awesome','beautiful','excellent','fantastic','joy','peaceful','inspired','proud','confident','hopeful','blessed','thriving','brilliant','sunshine','triumph','celebrate','magnificent','delightful'];
const NEG_WORDS=['sad','bad','terrible','hate','awful','stressed','anxious','worried','angry','frustrated','tired','exhausted','overwhelmed','lonely','disappointed','hurt','scared','confused','struggling','difficult','painful','miserable','dread','hopeless','depressed'];
function scoreSentiment(text){
  const words=text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/);
  let score=0;
  words.forEach(w=>{if(POS_WORDS.includes(w))score++;if(NEG_WORDS.includes(w))score--;});
  return score;
}
function renderSentimentChart(){
  const canvas=document.getElementById('sentiment-chart'),ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth*2;canvas.height=canvas.offsetHeight*2;ctx.scale(2,2);
  const w=canvas.offsetWidth,h=canvas.offsetHeight;
  ctx.clearRect(0,0,w,h);
  const days30=[];for(let i=29;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);days30.push(d.toISOString().split('T')[0]);}
  const avgs=days30.map(day=>{
    const dayNotes=S.notes.filter(n=>n.day===day);
    if(!dayNotes.length)return null;
    return dayNotes.reduce((sum,n)=>{const s=typeof n.sentiment==='number'?n.sentiment:scoreSentiment(n.text);return sum+s;},0)/dayNotes.length;
  });
  const validAvgs=avgs.filter(a=>a!==null);
  if(!validAvgs.length){ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='600 11px Nunito';ctx.textAlign='center';ctx.fillText('Not enough data yet',w/2,h/2);return;}
  const maxAbs=Math.max(Math.abs(Math.min(...validAvgs)),Math.abs(Math.max(...validAvgs)),1);
  const midY=h/2-5;const rangeY=(h-30)/2;
  // Zero line
  ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(20,midY);ctx.lineTo(w-10,midY);ctx.stroke();ctx.setLineDash([]);
  // Draw line
  const t=THEMES[C.theme]||THEMES.green;
  ctx.strokeStyle=t[0];ctx.lineWidth=2;ctx.beginPath();
  let started=false;
  const pts=[];
  avgs.forEach((a,i)=>{
    if(a===null)return;
    const x=20+i*((w-30)/29);const y=midY-(a/maxAbs)*rangeY;
    pts.push({x,y,v:a});
    if(!started){ctx.moveTo(x,y);started=true;}else ctx.lineTo(x,y);
  });
  ctx.stroke();
  // Fill area
  if(pts.length>1){
    ctx.beginPath();ctx.moveTo(pts[0].x,midY);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.lineTo(pts[pts.length-1].x,midY);ctx.closePath();
    const grad=ctx.createLinearGradient(0,midY-rangeY,0,midY+rangeY);
    grad.addColorStop(0,'rgba(0,230,167,.15)');grad.addColorStop(0.5,'rgba(0,0,0,0)');grad.addColorStop(1,'rgba(255,71,87,.15)');
    ctx.fillStyle=grad;ctx.fill();
  }
  // Dots
  pts.forEach(p=>{ctx.fillStyle=p.v>0?t[0]:p.v<0?'#ff4757':'rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();});
  // Labels
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.font='600 8px Nunito';ctx.textAlign='left';
  ctx.fillText('+',5,15);ctx.fillText('−',5,h-10);
}

// ===== WEEKLY REVIEW =====
function renderWeeklyReview(){
  const el=document.getElementById('weekly-review');
  const now=new Date();const weekAgo=new Date(now);weekAgo.setDate(weekAgo.getDate()-7);
  const weekStart=weekAgo.toISOString().split('T')[0];
  const weekNotes=S.notes.filter(n=>n.day>=weekStart);
  const totalNotes=weekNotes.length;
  const totalWords=weekNotes.reduce((a,n)=>a+n.text.split(/\s+/).length,0);
  // Most common mood
  const moodCounts={};weekNotes.forEach(n=>{if(n.mood){moodCounts[n.mood]=(moodCounts[n.mood]||0)+1;}});
  const topMood=Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0];
  // Top 3 tags
  const tagCounts={};weekNotes.forEach(n=>(n.tags||[]).forEach(t=>{tagCounts[t]=(tagCounts[t]||0)+1;}));
  const topTags=Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  // Best day
  const dayCounts={};weekNotes.forEach(n=>{dayCounts[n.day]=(dayCounts[n.day]||0)+1;});
  const bestDayEntry=Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];
  const bestDay=bestDayEntry?new Date(bestDayEntry[0]+'T12:00:00').toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}):'—';
  // Streak status
  const streakMsg=S.streak>=7?'🔥 On fire!':S.streak>=3?'🌱 Growing!':S.streak>=1?'✅ Active':'⏸️ Start writing!';
  el.innerHTML=`<div class="wr-header"><span style="font-size:1.2rem">📋</span><div><div class="wr-title">Weekly Review</div><div class="wr-period">${weekAgo.toLocaleDateString([],{month:'short',day:'numeric'})} — ${now.toLocaleDateString([],{month:'short',day:'numeric'})}</div></div></div>
  <div class="wr-grid">
    <div class="wr-stat"><div class="wr-stat-val">${totalNotes}</div><div class="wr-stat-label">Notes</div></div>
    <div class="wr-stat"><div class="wr-stat-val">${topMood?topMood[0]:'—'}</div><div class="wr-stat-label">Top Mood</div></div>
    <div class="wr-stat"><div class="wr-stat-val">${totalWords}</div><div class="wr-stat-label">Words</div></div>
    <div class="wr-stat"><div class="wr-stat-val">${bestDay}</div><div class="wr-stat-label">Best Day</div></div>
    <div class="wr-stat"><div class="wr-stat-val">${topTags.length?topTags.join(' '):'—'}</div><div class="wr-stat-label">Top Tags</div></div>
    <div class="wr-stat"><div class="wr-stat-val">${streakMsg}</div><div class="wr-stat-label">Streak</div></div>
  </div>`;
}

// ===== WORD CLOUD =====
const STOP_WORDS=new Set(['the','a','an','is','it','to','in','of','and','for','on','at','by','or','but','be','are','was','were','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','not','no','so','if','then','than','that','this','these','those','with','from','into','about','up','out','just','also','very','i','me','my','we','our','you','your','he','she','they','them','their','its','what','which','who','when','where','how','all','each','every','both','few','more','most','some','any','other','new','old','one','two','much','many','here','there','now','only','still','already','am','got','get','go','went','make','made','like','know','think','see','come','take','want','use','find','give','tell','say','said','way','day','time','back','over','after','before','because','while','through','between','under','during','without','until','against']);
function renderWordCloud(){
  const canvas=document.getElementById('wordcloud-canvas');
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth*2;canvas.height=canvas.offsetHeight*2;ctx.scale(2,2);
  const w=canvas.offsetWidth,h=canvas.offsetHeight;
  ctx.clearRect(0,0,w,h);
  // Count words
  const freq={};
  S.notes.forEach(n=>{
    n.text.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).forEach(word=>{
      if(word.length>2&&!STOP_WORDS.has(word))freq[word]=(freq[word]||0)+1;
    });
  });
  // Filter min 3 occurrences, sort by freq
  let words=Object.entries(freq).filter(e=>e[1]>=3).sort((a,b)=>b[1]-a[1]).slice(0,60);
  if(!words.length){ctx.fillStyle='rgba(255,255,255,.3)';ctx.font='600 11px Nunito';ctx.textAlign='center';ctx.fillText('Keep writing to see your word cloud!',w/2,h/2);return;}
  const maxFreq=words[0][1];const minFreq=words[words.length-1][1];
  const t=THEMES[C.theme]||THEMES.green;
  const colors=[t[0],t[1],'#feca57','#ff6b6b','#a29bfe','#fd79a8','#55efc4','#fdcb6e'];
  // Place words using spiral
  const placed=[];
  words.forEach(([word,count],idx)=>{
    const size=Math.max(10,Math.min(36,10+((count-minFreq)/(maxFreq-minFreq||1))*26));
    ctx.font=`${Math.random()>0.5?'700':'800'} ${size}px Nunito`;
    const metrics=ctx.measureText(word);
    const tw=metrics.width;const th=size;
    // Spiral placement
    let px,py,placed_ok=false;
    for(let angle=0;angle<600;angle+=0.3){
      const r=4+angle*0.6;
      px=w/2+r*Math.cos(angle)-tw/2;
      py=h/2+r*Math.sin(angle*0.7)+th/4;
      if(px<2||py<th||px+tw>w-2||py>h-2)continue;
      // Check overlap
      const rect={x:px,y:py-th,w:tw,h:th+4};
      const overlap=placed.some(p=>!(rect.x>p.x+p.w||rect.x+rect.w<p.x||rect.y>p.y+p.h||rect.y+rect.h<p.y));
      if(!overlap){placed.push(rect);placed_ok=true;break;}
    }
    if(!placed_ok)return;
    ctx.fillStyle=colors[idx%colors.length];
    ctx.globalAlpha=0.7+0.3*(count/maxFreq);
    ctx.fillText(word,px,py);
    ctx.globalAlpha=1;
  });
}

// ===== SMART TAGS =====
const SMART_TAG_MAP={
  '#work':['meeting','call','standup','sprint','deadline','project','client'],
  '#ideas':['idea','thought','maybe','wonder','imagine','concept','brainstorm'],
  '#journal':['feel','mood','day','morning','evening','today','night','reflect'],
  '#learning':['learn','read','study','book','course','article','tutorial'],
  '#goals':['goal','plan','want','achieve','target','resolution','milestone'],
  '#dev':['bug','fix','code','deploy','feature','error','debug','refactor']
};
function updateSmartTags(text){
  const el=document.getElementById('smart-tag-suggestions');
  if(!text||text.length<3){el.innerHTML='';return;}
  const lower=text.toLowerCase();
  const suggested=new Set();
  Object.entries(SMART_TAG_MAP).forEach(([tag,keywords])=>{
    if(lower.includes(tag))return;// already in text
    keywords.forEach(kw=>{if(lower.includes(kw))suggested.add(tag);});
  });
  el.innerHTML=[...suggested].map(t=>`<span class="smart-tag-pill" onclick="appendSmartTag('${t}')">${t}</span>`).join('');
}
function appendSmartTag(tag){
  NI.value=NI.value.trimEnd()+' '+tag+' ';
  NI.focus();
  NI.style.height='auto';NI.style.height=Math.min(NI.scrollHeight,150)+'px';
  CC.textContent=NI.value.length;
  updateSmartTags(NI.value);
}



// ===== UTILS =====
function isToday(d){return d.toDateString()===new Date().toDateString()}
function isYday(d){const y=new Date();y.setDate(y.getDate()-1);return d.toDateString()===y.toDateString()}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')}

function render(){witherCheck();renderPlant();renderH();renderXP();renderStats();renderMain();updateSky();}

// ===== PWA =====
let deferredPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('install-banner').classList.add('show');});
document.getElementById('install-yes').addEventListener('click',()=>{deferredPrompt?.prompt();document.getElementById('install-banner').classList.remove('show');});
document.getElementById('install-no').addEventListener('click',()=>document.getElementById('install-banner').classList.remove('show'));
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});

// ===== MIGRATE OLD DATA =====
(function(){const old=localStorage.getItem('growthink');if(old&&!localStorage.getItem('gt_state')){const o=JSON.parse(old);S.notes=o.notes||[];S.health=o.health||100;S.level=o.level||1;S.xp=o.xp||0;S.streak=o.streak||0;S.best=o.bestStreak||o.streak||0;S.lastNote=o.lastNoteDate;S.notes.forEach(n=>{if(!n.tags)n.tags=[];if(!n.mood)n.mood='';if(n.pinned===undefined)n.pinned=false;});save();}})();

// ===== FOCUS MODE =====
document.getElementById('focus-open').addEventListener('click',()=>{
  const draft=localStorage.getItem('gt_focus_draft')||'';
  document.getElementById('focus-textarea').value=draft;
  updateFocusWC();
  document.getElementById('focus-overlay').classList.add('open');
  setTimeout(()=>document.getElementById('focus-textarea').focus(),100);
});
document.getElementById('focus-textarea').addEventListener('input',function(){
  localStorage.setItem('gt_focus_draft',this.value);
  updateFocusWC();
});
function updateFocusWC(){const t=document.getElementById('focus-textarea').value.trim();const wc=t?t.split(/\s+/).length:0;document.getElementById('focus-wc').textContent=wc+' word'+(wc!==1?'s':'');}
function closeFocus(){
  const text=document.getElementById('focus-textarea').value.trim();
  if(text){
    if(confirm('Save this as a note?')){
      const now=new Date(),today=now.toISOString().split('T')[0];
      if(S.lastNote){const ld=new Date(S.lastNote).toISOString().split('T')[0],y=new Date(now);y.setDate(y.getDate()-1);if(ld!==today){S.streak=ld===y.toISOString().split('T')[0]?S.streak+1:1;}}else S.streak=1;
      S.best=Math.max(S.best,S.streak);S.lastNote=now.toISOString();
      const tags=(text.match(/#\w+/g)||[]).map(t=>t.toLowerCase());
      S.notes.unshift({id:Date.now(),text,date:now.toISOString(),day:today,mood:'',tags,pinned:false,cat:''});
      S.health=Math.min(100,S.health+10);S.xp+=10+Math.floor(text.length/15);
      if(S.xp>=S.level*50){S.xp-=S.level*50;S.level++;if(!checkEvolution(S.level))showLevelUp();}
      checkBadges();checkChallenges();save();render();
      localStorage.removeItem('gt_focus_draft');
    }
  }
  document.getElementById('focus-overlay').classList.remove('open');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('focus-overlay').classList.contains('open'))closeFocus();});

// ===== DAILY AFFIRMATIONS =====
const AFFIRMATIONS=[
  "Every day is a new opportunity to grow stronger.",
  "I am capable of achieving great things.",
  "My potential is limitless.",
  "I embrace challenges as opportunities to learn.",
  "I am worthy of success and happiness.",
  "Small steps lead to big transformations.",
  "I choose progress over perfection.",
  "My thoughts shape my reality — I choose positivity.",
  "I am resilient, strong, and brave.",
  "Today I will be better than yesterday.",
  "I trust the process and celebrate small wins.",
  "I am in charge of how I feel today.",
  "Mistakes are proof that I am trying.",
  "I attract abundance and growth into my life.",
  "I am constantly evolving and improving.",
  "My mindset is my greatest asset.",
  "I release what I cannot control.",
  "I am grateful for this moment.",
  "I have the power to create change.",
  "Consistency is the key to my success.",
  "I am deserving of all good things coming my way.",
  "My journey is unique and I honor it.",
  "I turn obstacles into stepping stones.",
  "I radiate confidence and positivity.",
  "I am building a life I love, one day at a time.",
  "Growth happens outside my comfort zone.",
  "I am enough, exactly as I am right now.",
  "I welcome new beginnings with open arms.",
  "My energy and focus create my future.",
  "I am proud of how far I have come.",
  "The only limit is the one I set for myself.",
  "I nourish my mind with positive thoughts."
];
function showAffirmation(){
  const today=new Date().toISOString().split('T')[0];
  const dismissed=localStorage.getItem('gt_aff_dismissed');
  if(dismissed===today)return;
  // Seed by date for consistent daily pick
  const seed=today.split('-').reduce((a,v)=>a+parseInt(v),0);
  const aff=AFFIRMATIONS[seed%AFFIRMATIONS.length];
  document.getElementById('affirmation-wrap').innerHTML=`<div class="affirmation-card glass"><div class="affirmation-label">🌟 Daily Affirmation</div><div class="affirmation-text">${aff}</div><button class="affirmation-close" onclick="dismissAffirmation()">✕</button></div>`;
}
function dismissAffirmation(){
  const today=new Date().toISOString().split('T')[0];
  localStorage.setItem('gt_aff_dismissed',today);
  const card=document.querySelector('.affirmation-card');
  if(card){card.style.opacity='0';card.style.transform='translateY(-20px)';card.style.transition='all .3s';setTimeout(()=>document.getElementById('affirmation-wrap').innerHTML='',300);}
}

// ===== PLANT DNA =====
function genDNA(){return{stemCurve:+Math.random().toFixed(2),leafShape:['round','pointed','heart','jagged'][Math.floor(Math.random()*4)],colorHue:Math.floor(Math.random()*360),growthRate:+(.5+Math.random()*1.5).toFixed(2),mutationChance:+(Math.random()*.3).toFixed(2),bloomColor:'#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'),leafSize:+(.5+Math.random()).toFixed(2),pattern:['solid','spotted','striped'][Math.floor(Math.random()*3)]}}
function initDNA(){if(!S.plantDNA){S.plantDNA=genDNA();save();}}
function mutateDNA(){if(S.xp<100){alert('Need 100 XP!');return;}S.xp-=100;const keys=Object.keys(S.plantDNA);const fresh=genDNA();const n=1+Math.floor(Math.random()*2);for(let i=0;i<n;i++){const k=keys[Math.floor(Math.random()*keys.length)];S.plantDNA[k]=fresh[k];}save();renderXP();renderDNA();renderPlant();}
function newSeed(){if(S.xp<200){alert('Need 200 XP!');return;}S.xp-=200;S.plantDNA=genDNA();save();renderXP();renderDNA();renderPlant();}
function renderDNA(){const d=S.plantDNA;if(!d)return;const el=document.getElementById('dna-card');if(!el)return;const pills=[['Curve',d.stemCurve.toFixed(2),'#3b82f6'],['Leaf',d.leafShape,'#2ecc71'],['Hue',d.colorHue+'°','hsl('+d.colorHue+',70%,60%)'],['Growth',d.growthRate.toFixed(1)+'x','#f97316'],['Mutate',d.mutationChance.toFixed(2),'#a855f7'],['Bloom',d.bloomColor,d.bloomColor],['Size',d.leafSize.toFixed(1),'#00c9ff'],['Pattern',d.pattern,'#ec4899']];el.innerHTML='<div class="dna-traits">'+pills.map(p=>`<span class="dna-pill" style="color:${p[2]};border:1px solid ${p[2]}33">${p[0]}: ${p[1]}</span>`).join('')+'</div>';}

// ===== MULTI-PLANT GARDEN =====
const GARDEN_UNLOCK=[0,5,10,15];
const GARDEN_CATS={work:{icon:'💼',color:'#3b82f6'},personal:{icon:'🏠',color:'#a855f7'},ideas:{icon:'💡',color:'#f97316'},journal:{icon:'📓',color:'#ec4899'}};
let gardenOpen=false;
function initGarden(){if(!S.garden){S.garden=[{cat:'work',level:1,xp:0},{cat:'personal',level:1,xp:0},{cat:'ideas',level:1,xp:0},{cat:'journal',level:1,xp:0}];save();}}
function toggleGarden(){gardenOpen=!gardenOpen;document.getElementById('garden-view').classList.toggle('open',gardenOpen);if(gardenOpen)renderGarden();}
function renderGarden(){const el=document.getElementById('garden-view');el.innerHTML='<div style="text-align:center;font-size:.8rem;font-weight:700;color:rgba(255,255,255,.5);margin-bottom:6px">🌻 My Garden</div><div class="garden-grid">'+S.garden.map((g,i)=>{const unlocked=S.level>=GARDEN_UNLOCK[i];const ci=GARDEN_CATS[g.cat];const evo=getEvoStage(g.level);return`<div class="garden-slot${unlocked?'':' locked'} glass" onclick="${unlocked?'showGardenStats('+i+')':''}"><div style="font-size:2rem">${unlocked?evo.icon:'🔒'}</div><div class="garden-slot-label" style="color:${ci.color}">${ci.icon} ${g.cat}</div>${unlocked?`<div class="garden-slot-level">Lv.${g.level} ${evo.name}</div>`:`<div class="garden-slot-level">Unlock Lv.${GARDEN_UNLOCK[i]}</div>`}</div>`;}).join('')+'</div>';}
function growGardenPlant(cat){if(!S.garden)return;const i=S.garden.findIndex(p=>p.cat===cat);if(i<0||S.level<GARDEN_UNLOCK[i])return;const g=S.garden[i];g.xp+=10;const need=g.level*30;if(g.xp>=need){g.xp-=need;g.level++;}}
function showGardenStats(i){const g=S.garden[i];const ci=GARDEN_CATS[g.cat];const evo=getEvoStage(g.level);const need=g.level*30;const bg=document.createElement('div');bg.className='garden-popup-bg';bg.onclick=()=>{bg.remove();popup.remove();};const popup=document.createElement('div');popup.className='garden-popup';popup.innerHTML=`<div style="font-size:2.5rem">${evo.icon}</div><div style="font-size:1.1rem;font-weight:800;margin:6px 0;color:${ci.color}">${ci.icon} ${g.cat}</div><div style="font-size:.85rem;color:rgba(255,255,255,.5)">Stage: ${evo.name}</div><div style="font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:6px 0">Level ${g.level}</div><div class="bar-track" style="margin:8px 0"><div class="bar-fill xp-fill" style="width:${g.xp/need*100}%"></div></div><div style="font-size:.7rem;color:rgba(255,255,255,.4)">${g.xp}/${need} XP to next level</div><button onclick="this.closest('.garden-popup').remove();document.querySelector('.garden-popup-bg')?.remove()" style="margin-top:12px;padding:8px 24px;border:none;border-radius:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0a0a1a;font-family:'Nunito',sans-serif;font-weight:700;cursor:pointer">Close</button>`;document.body.appendChild(bg);document.body.appendChild(popup);}

// ===== PLANT EVOLUTION =====
function getEvoStage(lvl){if(lvl>=20)return{name:'Legendary',icon:'👑',color:'#ffd700'};if(lvl>=15)return{name:'Ancient',icon:'🌳',color:'#8b4513'};if(lvl>=10)return{name:'Bloom',icon:'🌺',color:'#ff69b4'};if(lvl>=5)return{name:'Sapling',icon:'🌿',color:'#2ecc71'};return{name:'Sprout',icon:'🌱',color:'#90ee90'};}
function checkEvolution(newLevel){if(!S.evolutions)S.evolutions=[];const thresholds=[5,10,15,20];if(thresholds.includes(newLevel)&&!S.evolutions.includes(newLevel)){S.evolutions.push(newLevel);save();showEvolution(newLevel);return true;}return false;}
function showEvolution(lvl){const evo=getEvoStage(lvl);const o=document.createElement('div');o.className='evo-overlay';o.innerHTML=`<div class="evo-card" style="border-color:${evo.color}"><div class="evo-icon">${evo.icon}</div><div class="evo-stage">Your plant evolved!</div><div class="evo-title" style="background:linear-gradient(135deg,${evo.color},var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent">${evo.name}</div><div class="evo-label" style="background:${evo.color}22;color:${evo.color}">Stage ${Math.ceil(lvl/5)} Unlocked</div><button onclick="this.closest('.evo-overlay').remove()" style="margin-top:20px;padding:10px 30px;border:none;border-radius:12px;background:linear-gradient(135deg,${evo.color},var(--accent));color:#0a0a1a;font-family:'Nunito',sans-serif;font-size:1rem;font-weight:700;cursor:pointer">Amazing!</button></div>`;document.body.appendChild(o);spawnSparkles();}

// ===== ADAPTIVE SOUNDSCAPES =====
let typingTimestamps=[];
function trackTypingSpeed(){typingTimestamps.push(Date.now());typingTimestamps=typingTimestamps.filter(t=>Date.now()-t<2000);if(C.adaptive&&Object.keys(activeSounds).length>0)modulateSound();}
NI.addEventListener('keydown',trackTypingSpeed);
function getTypingSpeed(){return typingTimestamps.filter(t=>Date.now()-t<2000).length/2;}
function modulateSound(){if(!window.soundscape||!C.adaptive)return;const speed=getTypingSpeed();const hour=new Date().getHours();const isNight=hour>=22||hour<6;const moodFactor=C.mood==='😔'?0.6:C.mood==='🔥'?1.3:C.mood==='😊'?1.1:1.0;const speedFactor=Math.min(1+speed*0.05,1.4);const nightFactor=isNight?0.7:1.0;const baseVol=parseInt(document.getElementById('volume-slider').value)/100;const finalVol=Math.min(baseVol*speedFactor*moodFactor*nightFactor,1.0);if(window.soundscape.setVolume)window.soundscape.setVolume(finalVol);}
document.getElementById('volume-slider').addEventListener('input',function(){const vol=this.value/100;if(window.soundscape?.setVolume)window.soundscape.setVolume(vol);});
function setupAdaptiveToggle(){if(C.adaptive===undefined)C.adaptive=false;const el=document.getElementById('t-adaptive');el.classList.toggle('on',C.adaptive);el.addEventListener('click',()=>{C.adaptive=!C.adaptive;el.classList.toggle('on',C.adaptive);saveC();updateAdaptiveIndicator();});}
function updateAdaptiveIndicator(){const ind=document.getElementById('adaptive-ind');ind.classList.toggle('active',C.adaptive&&Object.keys(activeSounds).length>0);}
setInterval(()=>{if(C.adaptive&&Object.keys(activeSounds).length>0)modulateSound();updateAdaptiveIndicator();},1000);

// ===== NOTE REMINDERS =====
if(!S.reminders)S.reminders=[];
function openReminderPicker(e,noteId){e.stopPropagation();document.querySelectorAll('.reminder-picker').forEach(p=>p.remove());const btn=e.currentTarget;const picker=document.createElement('div');picker.className='reminder-picker open';picker.innerHTML=`<button class="reminder-opt" onclick="setReminder(${noteId},1)">⏰ 1 hour</button><button class="reminder-opt" onclick="setReminder(${noteId},3)">⏰ 3 hours</button><button class="reminder-opt" onclick="setReminder(${noteId},6)">⏰ 6 hours</button><button class="reminder-opt" onclick="setReminder(${noteId},12)">⏰ 12 hours</button><button class="reminder-opt" onclick="setReminder(${noteId},24)">⏰ 24 hours</button><div class="reminder-custom-row"><input type="number" id="custom-hours-${noteId}" placeholder="hrs" min="0.1" step="0.5"><button onclick="setReminderCustom(${noteId})">Set</button></div>`;btn.parentElement.style.position='relative';btn.parentElement.appendChild(picker);setTimeout(()=>document.addEventListener('click',function closeP(){picker.remove();document.removeEventListener('click',closeP);},{once:true}),10);}
function setReminder(noteId,hours){requestNotificationPermission();const note=S.notes.find(n=>n.id===noteId);if(!note)return;S.reminders.push({noteId,text:note.text.substring(0,100),triggerAt:Date.now()+hours*3600000,fired:false,created:Date.now()});save();render();renderReminders();document.querySelectorAll('.reminder-picker').forEach(p=>p.remove());}
function setReminderCustom(noteId){const input=document.getElementById('custom-hours-'+noteId);const hours=parseFloat(input?.value);if(!hours||hours<=0)return;setReminder(noteId,hours);}
function requestNotificationPermission(){if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();}
function checkReminders(){if(!S.reminders)return;const now=Date.now();let changed=false;S.reminders.forEach(r=>{if(!r.fired&&now>=r.triggerAt){r.fired=true;r.firedAt=now;changed=true;fireReminder(r);}});S.reminders=S.reminders.filter(r=>!r.fired||Date.now()-r.firedAt<86400000);if(changed){save();renderReminders();render();}}
function fireReminder(r){if('Notification' in window&&Notification.permission==='granted')new Notification('🌱 GroWthink Reminder',{body:r.text,icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="32" font-size="32">🌱</text></svg>'});plantSpeak('Reminder: '+r.text.substring(0,40)+'...');}
function renderReminders(){if(!S.reminders)S.reminders=[];const active=S.reminders.filter(r=>!r.fired);const fired=S.reminders.filter(r=>r.fired);const el=document.getElementById('reminders-list');if(!active.length&&!fired.length){el.innerHTML='<div style="font-size:.78rem;color:rgba(255,255,255,.3);padding:6px 0;margin-bottom:8px">No reminders set</div>';}else{el.innerHTML=[...active.sort((a,b)=>a.triggerAt-b.triggerAt),...fired].map(r=>{const timeStr=r.fired?'✅ Fired':'⏰ '+new Date(r.triggerAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});return`<div class="reminder-list-item glass${r.fired?' fired':''}"><span>${timeStr}</span><span class="reminder-note-text">${esc(r.text)}</span></div>`;}).join('');}const count=active.length;const badge=document.getElementById('reminder-count');badge.textContent=count?count+'':'';const tabBadge=document.getElementById('tab-reminder-badge');if(count>0){tabBadge.style.display='';tabBadge.textContent=count;}else tabBadge.style.display='none';}
setInterval(checkReminders,30000);

// ===== LOCATION-TAGGED NOTES =====
let cachedLocation=null;
function initLocation(){
  // Lazy-load Leaflet when location features are first used
  if(typeof L==='undefined'){
    lazyLoadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    lazyLoadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(()=>_initLocationCore());
    return;
  }
  _initLocationCore();
}
function _initLocationCore(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(pos=>{cachedLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};},()=>{},{enableHighAccuracy:false,timeout:5000,maximumAge:300000});setInterval(()=>{navigator.geolocation.getCurrentPosition(pos=>{cachedLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};},()=>{},{enableHighAccuracy:false,timeout:5000,maximumAge:300000});},300000);}
let notesMap=null,mapMarkers=[];
function renderNotesMap(){const geoNotes=S.notes.filter(n=>n.lat!=null&&n.lng!=null);if(!geoNotes.length){document.getElementById('notes-map').innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,.3);font-size:.8rem">No location-tagged notes yet</div>';if(notesMap){notesMap.remove();notesMap=null;}return;}if(!notesMap){notesMap=L.map('notes-map',{zoomControl:false,attributionControl:false}).setView([geoNotes[0].lat,geoNotes[0].lng],10);L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(notesMap);}mapMarkers.forEach(m=>m.remove());mapMarkers=[];const bounds=[];geoNotes.forEach(n=>{const marker=L.circleMarker([n.lat,n.lng],{radius:6,fillColor:'#00e6a7',color:'#00c9ff',weight:2,fillOpacity:0.8}).addTo(notesMap);marker.bindPopup(`<div style="max-width:200px;font-size:.85rem">${esc(n.text.substring(0,120))}<br><small style="color:#888">${new Date(n.date).toLocaleDateString()}</small></div>`);mapMarkers.push(marker);bounds.push([n.lat,n.lng]);});if(bounds.length>1)notesMap.fitBounds(bounds,{padding:[20,20]});else notesMap.setView(bounds[0],12);setTimeout(()=>notesMap.invalidateSize(),100);}

// ===== MIND MAP GENERATOR =====
let mmCanvas,mmCtx,mmNodes=[],mmPan={x:0,y:0},mmZoom=1,mmDragging=false,mmLastMouse={x:0,y:0},mmSelectedNode=null;
function openMindMap(){document.getElementById('mindmap-overlay').classList.add('open');mmCanvas=document.getElementById('mindmap-canvas');mmCtx=mmCanvas.getContext('2d');resizeMindMap();buildMindMapData();drawMindMap();window.addEventListener('resize',resizeMindMap);}
function closeMindMap(){document.getElementById('mindmap-overlay').classList.remove('open');window.removeEventListener('resize',resizeMindMap);}
function resizeMindMap(){if(!mmCanvas)return;mmCanvas.width=mmCanvas.parentElement.clientWidth*2;mmCanvas.height=(mmCanvas.parentElement.clientHeight-60)*2;mmCanvas.style.width=mmCanvas.parentElement.clientWidth+'px';mmCanvas.style.height=(mmCanvas.parentElement.clientHeight-60)+'px';mmCtx.scale(2,2);drawMindMap();}
function buildMindMapData(){mmNodes=[];const w=mmCanvas.width/4,h=mmCanvas.height/4;const cx=w,cy=h;const t=THEMES[C.theme]||THEMES.green;mmNodes.push({x:cx,y:cy,r:40,text:'My Thoughts',level:0,color:t[0],children:[],tag:null});const tagMap={};S.notes.forEach(n=>{const tags=n.tags?.length?n.tags:['untagged'];tags.forEach(tag=>{if(!tagMap[tag])tagMap[tag]=[];tagMap[tag].push(n);});});const tagKeys=Object.keys(tagMap).slice(0,12);const catColors={work:'#3b82f6',personal:'#a855f7',ideas:'#f97316',journal:'#ec4899'};const colors=[t[0],t[1],'#ff6b6b','#feca57','#48dbfb','#ff9ff3','#55efc4','#f368e0','#fd79a8','#a29bfe','#ff9f43','#0abde3'];tagKeys.forEach((tag,i)=>{const angle=(2*Math.PI/tagKeys.length)*i-Math.PI/2;const dist=120+tagKeys.length*5;const tx=cx+Math.cos(angle)*dist;const ty=cy+Math.sin(angle)*dist;const color=catColors[tag]||colors[i%colors.length];const tagNode={x:tx,y:ty,r:28,text:tag,level:1,color,children:[],tag,parentIdx:0};const tagIdx=mmNodes.length;mmNodes[0].children.push(tagIdx);mmNodes.push(tagNode);const notes=tagMap[tag].slice(0,6);notes.forEach((n,j)=>{const cAngle=angle+(j-notes.length/2)*0.35;const cDist=dist+80+j*10;const nx=cx+Math.cos(cAngle)*cDist;const ny=cy+Math.sin(cAngle)*cDist;const snippet=n.text.substring(0,30)+(n.text.length>30?'...':'');const noteNode={x:nx,y:ny,r:18,text:snippet,level:2,color:color+'99',children:[],tag,parentIdx:tagIdx,noteId:n.id};tagNode.children.push(mmNodes.length);mmNodes.push(noteNode);});});}
function drawMindMap(){if(!mmCtx)return;const w=mmCanvas.width/2,h=mmCanvas.height/2;mmCtx.clearRect(0,0,w,h);mmCtx.save();mmCtx.translate(w/2+mmPan.x,h/2+mmPan.y);mmCtx.scale(mmZoom,mmZoom);mmCtx.translate(-w/2,-h/2);mmNodes.forEach(node=>{node.children.forEach(ci=>{const child=mmNodes[ci];mmCtx.beginPath();const cpx=(node.x+child.x)/2+(child.y-node.y)*0.15;const cpy=(node.y+child.y)/2-(child.x-node.x)*0.15;mmCtx.moveTo(node.x,node.y);mmCtx.quadraticCurveTo(cpx,cpy,child.x,child.y);mmCtx.strokeStyle=node.color+'44';mmCtx.lineWidth=node.level===0?2.5:1.5;mmCtx.stroke();});});mmNodes.forEach((node,i)=>{const isSelected=mmSelectedNode!==null&&(i===mmSelectedNode||mmNodes[mmSelectedNode]?.children?.includes(i)||node.parentIdx===mmSelectedNode);const alpha=mmSelectedNode===null||isSelected?1:0.25;mmCtx.globalAlpha=alpha;mmCtx.beginPath();mmCtx.arc(node.x,node.y,node.r,0,Math.PI*2);mmCtx.fillStyle=node.color+(node.level===0?'':'cc');mmCtx.fill();mmCtx.strokeStyle='rgba(255,255,255,0.15)';mmCtx.lineWidth=1;mmCtx.stroke();mmCtx.fillStyle='#fff';mmCtx.textAlign='center';mmCtx.textBaseline='middle';const fontSize=node.level===0?12:node.level===1?10:8;mmCtx.font=`${node.level<2?'700':'600'} ${fontSize}px Nunito, sans-serif`;const maxW=node.r*1.8;const words=node.text.split(/\s+/);let lines=[],line='';words.forEach(word=>{const test=line?line+' '+word:word;if(mmCtx.measureText(test).width>maxW&&line){lines.push(line);line=word;}else line=test;});if(line)lines.push(line);const lineH=fontSize+2;const startY=node.y-((lines.length-1)*lineH)/2;lines.forEach((l,li)=>mmCtx.fillText(l,node.x,startY+li*lineH));mmCtx.globalAlpha=1;});mmCtx.restore();}
document.getElementById('mindmap-canvas').addEventListener('mousedown',e=>{mmDragging=true;mmLastMouse={x:e.clientX,y:e.clientY};});
document.getElementById('mindmap-canvas').addEventListener('mousemove',e=>{if(!mmDragging)return;mmPan.x+=e.clientX-mmLastMouse.x;mmPan.y+=e.clientY-mmLastMouse.y;mmLastMouse={x:e.clientX,y:e.clientY};drawMindMap();});
document.getElementById('mindmap-canvas').addEventListener('mouseup',()=>mmDragging=false);
document.getElementById('mindmap-canvas').addEventListener('mouseleave',()=>mmDragging=false);
document.getElementById('mindmap-canvas').addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY>0?0.9:1.1;mmZoom=Math.max(0.3,Math.min(3,mmZoom*delta));drawMindMap();},{passive:false});
document.getElementById('mindmap-canvas').addEventListener('click',e=>{const rect=mmCanvas.getBoundingClientRect();const sx=(e.clientX-rect.left),sy=(e.clientY-rect.top);const w=mmCanvas.width/2,h=mmCanvas.height/2;const mx=(sx-w/2-mmPan.x)/mmZoom+w/2;const my=(sy-h/2-mmPan.y)/mmZoom+h/2;let hit=null;mmNodes.forEach((node,i)=>{const dx=mx-node.x,dy=my-node.y;if(Math.sqrt(dx*dx+dy*dy)<=node.r)hit=i;});mmSelectedNode=mmSelectedNode===hit?null:hit;drawMindMap();});
let mmTouchDist=0;
document.getElementById('mindmap-canvas').addEventListener('touchstart',e=>{if(e.touches.length===1){mmDragging=true;mmLastMouse={x:e.touches[0].clientX,y:e.touches[0].clientY};}if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;mmTouchDist=Math.sqrt(dx*dx+dy*dy);}},{passive:true});
document.getElementById('mindmap-canvas').addEventListener('touchmove',e=>{e.preventDefault();if(e.touches.length===1&&mmDragging){mmPan.x+=e.touches[0].clientX-mmLastMouse.x;mmPan.y+=e.touches[0].clientY-mmLastMouse.y;mmLastMouse={x:e.touches[0].clientX,y:e.touches[0].clientY};drawMindMap();}if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const dist=Math.sqrt(dx*dx+dy*dy);if(mmTouchDist>0){const scale=dist/mmTouchDist;mmZoom=Math.max(0.3,Math.min(3,mmZoom*scale));}mmTouchDist=dist;drawMindMap();}},{passive:false});
document.getElementById('mindmap-canvas').addEventListener('touchend',()=>{mmDragging=false;mmTouchDist=0;});

// ===== MONTHLY ZINE =====
function openZine(){closePanel('share-overlay');buildZine();openPanel('zine-overlay');}
function getMonthNotes(year,month){return S.notes.filter(n=>{const d=new Date(n.date);return d.getFullYear()===year&&d.getMonth()===month;});}
function buildZine(){const now=new Date(),year=now.getFullYear(),month=now.getMonth();const notes=getMonthNotes(year,month);const monthName=now.toLocaleDateString([],{month:'long',year:'numeric'});const plantEmoji=C.plant==='cactus'?'🌵':C.plant==='bonsai'?'🌳':C.plant==='vine'?'🌿':'🌸';let pages=`<div class="zine-page zine-cover" data-zine-page><div class="zine-cover-emoji">${plantEmoji}</div><div class="zine-cover-month">${monthName}</div><div class="zine-cover-sub">Monthly Growth Journal</div><div class="zine-cover-stats"><span>📝 ${notes.length} notes</span><span>🔥 ${S.streak} streak</span><span>⭐ Level ${S.level}</span></div><div class="zine-page-num">1</div></div>`;const weeks={};notes.forEach(n=>{const d=new Date(n.date);const wk=Math.ceil(d.getDate()/7);weeks[wk]=(weeks[wk]||0)+1;});const maxWk=Math.max(...Object.values(weeks),1);let weekBars='';for(let w=1;w<=5;w++){const c=weeks[w]||0;weekBars+=`<div style="flex:1;text-align:center"><div class="zine-week-bar" style="height:${Math.max(2,(c/maxWk)*70)}px"></div><div class="zine-week-label">Wk${w}</div></div>`;}const mc={};MOODS.forEach(m=>mc[m]=0);notes.forEach(n=>{if(n.mood)mc[n.mood]=(mc[n.mood]||0)+1;});let moodRow=MOODS.map(m=>`<div class="zine-mood-item"><div class="emoji">${m}</div><div class="count">${mc[m]||0}</div></div>`).join('');const allTags=notes.flatMap(n=>n.tags||[]);const tagCounts={};allTags.forEach(t=>tagCounts[t]=(tagCounts[t]||0)+1);const topTags=Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);const totalWords=notes.reduce((a,n)=>a+n.text.split(/\s+/).length,0);pages+=`<div class="zine-page" data-zine-page><div class="zine-section-title">📊 Stats Overview</div><div class="zine-stat-grid"><div class="zine-stat-item"><div class="zine-stat-val">${notes.length}</div><div class="zine-stat-label">Total Notes</div></div><div class="zine-stat-item"><div class="zine-stat-val">${totalWords}</div><div class="zine-stat-label">Words Written</div></div><div class="zine-stat-item"><div class="zine-stat-val">${new Set(notes.map(n=>n.day)).size}</div><div class="zine-stat-label">Active Days</div></div><div class="zine-stat-item"><div class="zine-stat-val">${topTags.length>0?topTags[0][0]:'—'}</div><div class="zine-stat-label">Top Tag</div></div></div><div class="zine-section-title">📈 Notes per Week</div><div class="zine-week-bars">${weekBars}</div><div class="zine-section-title" style="margin-top:16px">😊 Mood Breakdown</div><div class="zine-mood-row">${moodRow}</div>${topTags.length?`<div class="zine-section-title" style="margin-top:16px">🏷️ Top Tags</div><div class="zine-tags-row">${topTags.map(([t,c])=>`<span class="tag-pill">${t} (${c})</span>`).join('')}</div>`:''}<div class="zine-page-num">2</div></div>`;const bestNotes=[...notes].sort((a,b)=>b.text.length-a.text.length||(b.tags?.length||0)-(a.tags?.length||0)).slice(0,6);if(bestNotes.length){for(let i=0;i<bestNotes.length;i+=3){const chunk=bestNotes.slice(i,i+3);const pageNum=3+Math.floor(i/3);pages+=`<div class="zine-page" data-zine-page><div class="zine-section-title">✨ Best Notes</div>${chunk.map(n=>`<div class="zine-note-card"><div class="zine-note-text">${n.mood?n.mood+' ':''}${esc(n.text.substring(0,300))}${n.text.length>300?'...':''}</div>${n.tags?.length?`<div class="zine-tags-row">${n.tags.map(t=>`<span class="tag-pill">${t}</span>`).join('')}</div>`:''}<div class="zine-note-meta">📅 ${new Date(n.date).toLocaleDateString([],{month:'short',day:'numeric'})} · ${n.text.split(/\s+/).length} words</div></div>`).join('')}<div class="zine-page-num">${pageNum}</div></div>`;}}document.getElementById('zine-pages').innerHTML=pages;}
function exportZineImages(){
  if(typeof html2canvas==='undefined'){lazyLoadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').then(()=>_exportZineImagesCore());return;}
  _exportZineImagesCore();
}
function _exportZineImagesCore(){const pages=document.querySelectorAll('[data-zine-page]');if(!pages.length)return;if(typeof html2canvas==='undefined'){alert('html2canvas not loaded yet. Please try again.');return;}pages.forEach((page,i)=>{html2canvas(page,{backgroundColor:'#111128',scale:2}).then(canvas=>{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`zine-page-${i+1}.png`;a.click();});});}
function copyZineMarkdown(){const now=new Date(),year=now.getFullYear(),month=now.getMonth();const notes=getMonthNotes(year,month);const monthName=now.toLocaleDateString([],{month:'long',year:'numeric'});const plantEmoji=C.plant==='cactus'?'🌵':C.plant==='bonsai'?'🌳':C.plant==='vine'?'🌿':'🌸';let md=`# ${plantEmoji} ${monthName} — Monthly Zine\n\n`;md+=`**${notes.length}** notes | **${S.streak}** streak | Level **${S.level}**\n\n`;md+=`## 📊 Stats\n`;md+=`- Total words: ${notes.reduce((a,n)=>a+n.text.split(/\s+/).length,0)}\n`;md+=`- Active days: ${new Set(notes.map(n=>n.day)).size}\n\n`;const mc={};MOODS.forEach(m=>mc[m]=0);notes.forEach(n=>{if(n.mood)mc[n.mood]=(mc[n.mood]||0)+1;});md+=`## 😊 Moods\n`;MOODS.forEach(m=>{if(mc[m])md+=`- ${m} ${mc[m]}\n`;});md+=`\n## ✨ Best Notes\n\n`;[...notes].sort((a,b)=>b.text.length-a.text.length).slice(0,6).forEach(n=>{md+=`> ${n.mood||''} ${n.text.substring(0,200)}${n.text.length>200?'...':''}\n`;md+=`> — ${new Date(n.date).toLocaleDateString()}\n\n`;});navigator.clipboard?.writeText(md).then(()=>alert('Zine copied as Markdown! 📋')).catch(()=>{const ta=document.createElement('textarea');ta.value=md;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();alert('Zine copied as Markdown! 📋');});}

// ===== PERSONAL RECORDS =====
function computePersonalRecords(){const records=[];if(!S.notes.length)return records;const dayCounts={};S.notes.forEach(n=>{dayCounts[n.day]=(dayCounts[n.day]||0)+1;});const bestDay=Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0];if(bestDay)records.push({icon:'📝',label:'Most notes in a day',value:bestDay[1]+' notes',detail:new Date(bestDay[0]+'T12:00:00').toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})});const longest=[...S.notes].sort((a,b)=>b.text.length-a.text.length)[0];if(longest)records.push({icon:'📏',label:'Longest note ever',value:longest.text.length+' chars',detail:'"'+longest.text.substring(0,50)+(longest.text.length>50?'...':'')+'"'});records.push({icon:'🔥',label:'Longest streak',value:S.best+' days',detail:'Personal best'});const mostTagged=[...S.notes].sort((a,b)=>(b.tags?.length||0)-(a.tags?.length||0))[0];if(mostTagged&&mostTagged.tags?.length)records.push({icon:'🏷️',label:'Most tags on a note',value:mostTagged.tags.length+' tags',detail:mostTagged.tags.slice(0,3).join(', ')});const dayNotes={};S.notes.forEach(n=>{if(!dayNotes[n.day])dayNotes[n.day]=[];dayNotes[n.day].push(new Date(n.date).getTime());});let fastestTime=Infinity,fastestDay='';Object.entries(dayNotes).forEach(([day,times])=>{if(times.length>=5){times.sort((a,b)=>a-b);const span=times[4]-times[0];if(span<fastestTime){fastestTime=span;fastestDay=day;}}});if(fastestTime<Infinity){const mins=Math.round(fastestTime/60000);records.push({icon:'⚡',label:'Fastest 5 notes',value:mins<60?mins+' min':Math.round(mins/60*10)/10+' hrs',detail:new Date(fastestDay+'T12:00:00').toLocaleDateString([],{month:'short',day:'numeric'})});}return records;}
function renderPersonalRecords(){const records=computePersonalRecords();document.getElementById('personal-records').innerHTML=records.length?records.map(r=>`<div class="pr-card glass"><div class="pr-icon">${r.icon}</div><div class="pr-info"><div class="pr-label">${r.label}</div><div class="pr-value">${r.value}</div><div class="pr-detail">${r.detail}</div></div></div>`).join(''):'<div style="text-align:center;padding:12px;font-size:.8rem;color:rgba(255,255,255,.3)">Start writing to set records!</div>';}

// ===== WEEKLY CHALLENGE =====
function getWeekStart(d){const dt=new Date(d);const day=dt.getDay();const diff=dt.getDate()-day+(day===0?-6:1);dt.setDate(diff);dt.setHours(0,0,0,0);return dt;}
function getWeekStats(weekStart){const end=new Date(weekStart);end.setDate(end.getDate()+7);const notes=S.notes.filter(n=>{const d=new Date(n.date);return d>=weekStart&&d<end;});return{count:notes.length,words:notes.reduce((a,n)=>a+n.text.split(/\s+/).length,0)};}
function renderWeeklyChallenge(){if(!S.weeklyStats)S.weeklyStats={};const now=new Date();const thisWeekStart=getWeekStart(now);const lastWeekStart=new Date(thisWeekStart);lastWeekStart.setDate(lastWeekStart.getDate()-7);const thisWeekKey=thisWeekStart.toISOString().split('T')[0];const lastStats=getWeekStats(lastWeekStart);const thisStats=getWeekStats(thisWeekStart);const target=Math.max(1,Math.ceil(lastStats.count*1.1));const progress=thisStats.count;const pct=Math.min(progress/target*100,100);const done=progress>=target;const rewardKey='weekly_'+thisWeekKey;if(!S.challengesDone)S.challengesDone={};if(done&&!S.challengesDone[rewardKey]){S.challengesDone[rewardKey]=true;S.xp+=75;save();renderXP();plantSpeak('Weekly challenge done! +75 XP! 🎉');}S.weeklyStats[thisWeekKey]={count:thisStats.count,words:thisStats.words};save();document.getElementById('weekly-challenge').innerHTML=`<div class="weekly-challenge-card glass${done?' challenge-done':''}"><div class="weekly-challenge-header"><div class="weekly-challenge-title">📈 Beat Last Week</div><div class="weekly-challenge-reward">${done?'✅ Done':'⭐ 75 XP'}</div></div><div class="weekly-challenge-desc">Write ${target} notes this week (last week: ${lastStats.count})</div><div class="challenge-progress">${progress}/${target} notes</div><div class="challenge-bar"><div class="challenge-fill" style="width:${pct}%"></div></div></div>`;}

// ===== QR CODE SYNC =====
let qrChunks=[],qrCurrentPage=0,qrTotalPages=0,qrScanStream=null,qrScanAnim=null,qrReceivedChunks={};
function openQRSync(){closePanel('share-overlay');openPanel('qr-overlay');switchQRTab('export');document.getElementById('qr-display').innerHTML='';}
function closeQRSync(){stopQRScan();closePanel('qr-overlay');}
function switchQRTab(tab){document.querySelectorAll('.qr-tab').forEach(t=>t.classList.remove('active'));document.querySelector(`.qr-tab:${tab==='export'?'first':'last'}-child`).classList.add('active');document.getElementById('qr-export-tab').style.display=tab==='export'?'':'none';document.getElementById('qr-import-tab').style.display=tab==='import'?'':'none';if(tab==='import')qrReceivedChunks={};}
function generateQRCanvas(text,size){const canvas=document.createElement('canvas');const modules=generateQRMatrix(text);if(!modules)return null;const modCount=modules.length;const cellSize=Math.floor(size/modCount);canvas.width=canvas.height=cellSize*modCount;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000000';for(let r=0;r<modCount;r++){for(let c=0;c<modCount;c++){if(modules[r][c])ctx.fillRect(c*cellSize,r*cellSize,cellSize,cellSize);}}return canvas;}
function generateQRMatrix(text){const QR=makeQR();return QR.generate(text);}
function makeQR(){const ECL={L:1};function generate(text){const data=new TextEncoder().encode(text);const version=getBestVersion(data.length);if(version<0)return null;const size=version*4+17;const matrix=Array.from({length:size},()=>Array(size).fill(null));const reserved=Array.from({length:size},()=>Array(size).fill(false));addFinderPatterns(matrix,reserved,size);addAlignmentPatterns(matrix,reserved,version,size);addTimingPatterns(matrix,reserved,size);reserved[size-8][8]=true;matrix[size-8][8]=1;if(version>=7)addVersionInfo(matrix,reserved,version,size);const dataBits=encodeData(data,version);placeData(matrix,reserved,dataBits,size);addFormatInfo(matrix,size,0);const bestMask=selectBestMask(matrix,reserved,size);applyMask(matrix,reserved,size,bestMask);addFormatInfo(matrix,size,bestMask);return matrix;}function getBestVersion(len){const caps=[0,17,32,53,78,106,134,154,192,230,271,321,367,425,458,520,586,644,718,792,858,929,1003,1091,1171,1273,1367,1465,1528,1628,1732,1840,1952,2068,2188,2303,2431,2563,2699,2809,2953];for(let v=1;v<=40;v++){if(len+3<=caps[v])return v;}return -1;}function addFinderPatterns(m,r,s){const pos=[[0,0],[0,s-7],[s-7,0]];pos.forEach(([row,col])=>{for(let dr=-1;dr<=7;dr++)for(let dc=-1;dc<=7;dc++){const rr=row+dr,cc=col+dc;if(rr<0||rr>=s||cc<0||cc>=s)continue;r[rr][cc]=true;if(dr>=0&&dr<=6&&dc>=0&&dc<=6){if(dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4))m[rr][cc]=1;else m[rr][cc]=0;}else m[rr][cc]=0;}});}function getAlignmentPositions(version){if(version<2)return[];const positions=[0];const numAlign=Math.floor(version/7)+2;const step=version===32?26:Math.ceil((version*4+4)/(numAlign-1)/2)*2;let pos=version*4+10;for(let i=numAlign-1;i>=1;i--){positions.unshift(pos);pos-=step;}positions[0]=6;return positions;}function addAlignmentPatterns(m,r,v,s){const pos=getAlignmentPositions(v);for(const row of pos)for(const col of pos){if((row<9&&col<9)||(row<9&&col>s-9)||(row>s-9&&col<9))continue;for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){const rr=row+dr,cc=col+dc;r[rr][cc]=true;m[rr][cc]=(Math.abs(dr)===2||Math.abs(dc)===2||(!dr&&!dc))?1:0;}}}function addTimingPatterns(m,r,s){for(let i=8;i<s-8;i++){if(!r[6][i]){r[6][i]=true;m[6][i]=i%2===0?1:0;}if(!r[i][6]){r[i][6]=true;m[i][6]=i%2===0?1:0;}}}function addVersionInfo(m,r,v,s){let d=v;for(let i=0;i<12;i++)d=(d<<1)^((d>>11)*0x1F25);const bits=(v<<12)|d&0xFFF;for(let i=0;i<18;i++){const bit=(bits>>i)&1;const row=Math.floor(i/3),col=i%3;m[s-11+col][row]=bit;r[s-11+col][row]=true;m[row][s-11+col]=bit;r[row][s-11+col]=true;}}function encodeData(data,version){const totalBits=getDataCapBits(version);const bits=[];push(bits,4,4);const ccBits=version<10?8:16;push(bits,data.length,ccBits);for(const b of data)push(bits,b,8);const rem=totalBits-bits.length;push(bits,0,Math.min(4,rem));while(bits.length%8)bits.push(0);const pads=[0xEC,0x11];let pi=0;while(bits.length<totalBits){push(bits,pads[pi%2],8);pi++;}return addErrorCorrection(bits,version);}function getDataCapBits(v){const table=[0,152,272,440,640,864,1088,1248,1552,1856,2192,2592,2960,3424,3688,4184,4712,5176,5768,6360,6888,7456,8048,8752,9392,10208,10960,11744,12248,13048,13880,14744,15640,16568,17528,18448,19472,20528,21616,22496,23648];return table[v]||152;}function addErrorCorrection(bits,version){return bits;}function push(arr,val,len){for(let i=len-1;i>=0;i--)arr.push((val>>i)&1);}function placeData(m,r,bits,s){let idx=0;for(let col=s-1;col>=1;col-=2){if(col===6)col=5;for(let row=0;row<s;row++){const upward=((s-1-col)>>1)%2===0;const actualRow=upward?s-1-row:row;for(let c=0;c<2;c++){const cc=col-c;if(!r[actualRow][cc]){m[actualRow][cc]=idx<bits.length?bits[idx]:0;idx++;}}}}}function addFormatInfo(m,s,mask){const fmt=(1<<10)|(mask<<7);let d=fmt;for(let i=0;i<10;i++)d=(d<<1)^((d>>14)*0x537);const bits=((fmt|d)^0x5412)&0x7FFF;for(let i=0;i<15;i++){const bit=(bits>>(14-i))&1;if(i<6)m[i][8]=bit;else if(i<8)m[i+1][8]=bit;else m[s-15+i][8]=bit;if(i<8)m[8][s-1-i]=bit;else if(i<9)m[8][15-i]=bit;else m[8][14-i]=bit;}}function selectBestMask(){return 0;}function applyMask(m,r,s,mask){for(let row=0;row<s;row++)for(let col=0;col<s;col++){if(r[row][col])continue;let flip=false;switch(mask){case 0:flip=(row+col)%2===0;break;case 1:flip=row%2===0;break;case 2:flip=col%3===0;break;case 3:flip=(row+col)%3===0;break;}if(flip)m[row][col]^=1;}}return{generate};}
const QR_CHUNK_SIZE=800;
function generateQR(){
  const libs=[];
  if(typeof LZString==='undefined')libs.push(lazyLoadScript('https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.5.0/lz-string.min.js'));
  if(libs.length){Promise.all(libs).then(()=>_generateQRCore());return;}
  _generateQRCore();
}
function _generateQRCore(){if(typeof LZString==='undefined'){alert('LZString not loaded yet. Please try again.');return;}const stateJSON=JSON.stringify(S);const compressed=LZString.compressToBase64(stateJSON);qrChunks=[];const chunkSize=QR_CHUNK_SIZE;qrTotalPages=Math.ceil(compressed.length/chunkSize);for(let i=0;i<qrTotalPages;i++){const chunk=compressed.substring(i*chunkSize,(i+1)*chunkSize);qrChunks.push(`GTS:${i+1}/${qrTotalPages}:${chunk}`);}qrCurrentPage=0;renderQRPage();}
function renderQRPage(){const container=document.getElementById('qr-display');const data=qrChunks[qrCurrentPage];const canvas=generateQRCanvas(data,260);let html='';if(canvas){html+=`<div class="qr-canvas-wrap"></div>`;html+=`<div class="qr-page-info">Page ${qrCurrentPage+1} of ${qrTotalPages}</div>`;if(qrTotalPages>1){html+=`<div class="qr-nav">`;if(qrCurrentPage>0)html+=`<button onclick="qrPrev()">← Prev</button>`;if(qrCurrentPage<qrTotalPages-1)html+=`<button onclick="qrNext()">Next →</button>`;html+=`</div>`;}container.innerHTML=html;container.querySelector('.qr-canvas-wrap').appendChild(canvas);}else{container.innerHTML=`<p style="font-size:.78rem;color:var(--danger)">QR generation failed (data may be too large). Try exporting as JSON instead.</p>`;}}
function qrPrev(){if(qrCurrentPage>0){qrCurrentPage--;renderQRPage();}}
function qrNext(){if(qrCurrentPage<qrTotalPages-1){qrCurrentPage++;renderQRPage();}}
function startQRScan(){
  if(typeof jsQR==='undefined'){lazyLoadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js').then(()=>_startQRScanCore());return;}
  _startQRScanCore();
}
function _startQRScanCore(){if(typeof jsQR==='undefined'){alert('jsQR not loaded yet. Please try again.');return;}qrReceivedChunks={};const video=document.getElementById('qr-video');const container=document.getElementById('qr-scan-container');container.style.display='';document.getElementById('qr-scan-btn').style.display='none';navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(stream=>{qrScanStream=stream;video.srcObject=stream;video.play();const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d',{willReadFrequently:true});function scan(){if(!qrScanStream)return;if(video.readyState===video.HAVE_ENOUGH_DATA){canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.drawImage(video,0,0);const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);const code=jsQR(imageData.data,imageData.width,imageData.height);if(code&&code.data)processQRData(code.data);}qrScanAnim=requestAnimationFrame(scan);}scan();}).catch(()=>{alert('Camera access denied');stopQRScan();});}
function processQRData(data){if(!data.startsWith('GTS:'))return;const match=data.match(/^GTS:(\d+)\/(\d+):(.+)$/);if(!match)return;const page=parseInt(match[1]),total=parseInt(match[2]),chunk=match[3];qrReceivedChunks[page]=chunk;const received=Object.keys(qrReceivedChunks).length;document.getElementById('qr-scan-status').textContent=`Scanned ${received}/${total} chunks...`;if(received>=total){stopQRScan();let compressed='';for(let i=1;i<=total;i++){if(!qrReceivedChunks[i]){document.getElementById('qr-scan-status').textContent='Missing chunk '+i+'. Please scan again.';qrReceivedChunks={};return;}compressed+=qrReceivedChunks[i];}try{const json=LZString.decompressFromBase64(compressed);if(!json)throw new Error('Decompression failed');const newState=JSON.parse(json);if(confirm('This will replace your data with the scanned data. Continue?')){Object.assign(S,newState);save();render();renderChallenges();renderGoals();renderPersonalRecords();renderWeeklyChallenge();alert('Data imported successfully! ✅');closeQRSync();}}catch(e){document.getElementById('qr-scan-status').textContent='Error: Invalid QR data. '+e.message;}}}
function stopQRScan(){if(qrScanAnim){cancelAnimationFrame(qrScanAnim);qrScanAnim=null;}if(qrScanStream){qrScanStream.getTracks().forEach(t=>t.stop());qrScanStream=null;}const video=document.getElementById('qr-video');if(video)video.srcObject=null;document.getElementById('qr-scan-container').style.display='none';document.getElementById('qr-scan-btn').style.display='';}

// Patch renderChallenges to also render personal records and weekly challenge
const _origRenderChallenges=renderChallenges;
renderChallenges=function(){_origRenderChallenges();renderPersonalRecords();renderWeeklyChallenge();};

// ===== INIT =====
initScene();initMoods();initHistMoodFilters();initDNA();initGarden();renderQuote();renderPrompt();applyTheme();renderNotion();checkBadges();renderBadgeCount();checkFreeze();applySeasonal();applyCosmetics();renderPet();renderChallenges();renderGoals();setupAdaptiveToggle();renderReminders();checkReminders();initLocation();renderDNA();renderPersonalRecords();renderWeeklyChallenge();render();showAffirmation();
// Weather, plant personality
setTimeout(fetchWeather,2000);
setTimeout(plantReact,5000);
setInterval(plantReact,120000);
// Pet picker init
document.querySelectorAll('#pet-picker .plant-opt').forEach(b=>b.classList.toggle('active',b.dataset.pet===(C.pet||'')));
setInterval(()=>{witherCheck();renderH();renderPlant();updateSky();},60000);
setInterval(renderQuote,300000);
setInterval(checkReminders,30000);