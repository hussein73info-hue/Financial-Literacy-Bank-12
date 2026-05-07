let curSem=1,curUnit=null,curLesson=null;
let exSem=1,exType=null,showAns=false,showMinAns=false;
let qSem=1,qUnits=[],qLessonFilter='all',quizMode='practice',quizTimer=60,quizCount=40,quizOrder='random';
let quizQs=[],quizIdx=0,quizAnswers={},quizSkipped={},quizTimerInterval=null,quizTimeLeft=0;
let quizRetryData=null;

function goPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const idx=['p-bank','p-quiz','p-exams','p-min','p-browse'].indexOf(id);
  document.querySelectorAll('.nav-tab')[idx].classList.add('active');
  if(id==='p-browse')initBrowse();
  if(id==='p-bank'){renderUGrid();renderOv();}
  if(id==='p-quiz')updateQuizAvail();
  updateStats();
}

function updateStats(){
  let f1=0,f2=0;
  Object.keys(BANK).forEach(k=>{if(k.startsWith('exam'))return;const s=+k.split('|')[0];if(s===1)f1+=BANK[k].length;else f2+=BANK[k].length;});
  document.getElementById('sf1').textContent=f1;
  document.getElementById('sf2').textContent=f2;
  document.getElementById('stotal').textContent=f1+f2;
}

function gk(s,u,l){return `${s}|${u}|${l}`;}

function selSem(n){
  curSem=n;curUnit=null;
  document.getElementById('sb1').className='sem-btn'+(n===1?' f1':'');
  document.getElementById('sb2').className='sem-btn'+(n===2?' f2':'');
  renderUGrid();
  document.getElementById('lesson-sel').innerHTML='<option value="">— اختر الدرس —</option>';
  document.getElementById('bank-lesson-view').innerHTML='';
}

function renderUGrid(){
  const units=CUR[curSem].units;
  document.getElementById('unit-grid').innerHTML=units.map(u=>{
    const cnt=u.lessons.reduce((s,l)=>s+(BANK[gk(curSem,u.id,l)]||[]).length,0);
    const tot=u.lessons.length*10;const pct=Math.min(100,Math.round(cnt/tot*100));
    return `<div class="unit-card${curUnit===u.id?(curSem===1?' sel1':' sel2'):''}" onclick="selUnit('${u.id}')">
      <div class="unit-num">وحدة ${u.id.replace('u','')}</div>
      <div class="unit-name">${u.name}</div><div class="unit-cnt">${cnt}/${tot} سؤال (${pct}%)</div>
      <div class="pbar"><div class="pbar-f" style="width:${pct}%;background:${curSem===1?'var(--f1)':'var(--f2)'}"></div></div>
    </div>`;
  }).join('');
}

function selUnit(uid){
  curUnit=uid;renderUGrid();
  const unit=CUR[curSem].units.find(u=>u.id===uid);
  document.getElementById('lesson-sel').innerHTML='<option value="">— اختر الدرس —</option>'+
    unit.lessons.map(l=>{const cnt=(BANK[gk(curSem,uid,l)]||[]).length;return`<option value="${l}">${l} (${cnt}ق)</option>`;}).join('');
  document.getElementById('bank-lesson-view').innerHTML='';
}

function selLesson(){
  curLesson=document.getElementById('lesson-sel').value;
  if(!curLesson||!curUnit)return;
  const qs=BANK[gk(curSem,curUnit,curLesson)]||[];
  const view=document.getElementById('bank-lesson-view');
  if(!qs.length){view.innerHTML='<div class="empty"><div class="ei">📭</div><p>لا توجد أسئلة لهذا الدرس</p></div>';return;}
  view.innerHTML=`<div class="flex-between mb14">
    <div style="font-size:14px;font-weight:700">${curLesson} — ${qs.length} سؤال</div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-danger btn-sm" onclick="quickQuiz('${curSem}','${curUnit}','${curLesson.replace(/'/g,"\'")}')">🎯 اختبر نفسك</button>
      <button class="btn btn-primary btn-sm" onclick="printLesson()">🖨️ طباعة</button>
    </div></div>
    <div>${renderQsList(qs)}</div>`;
}

function renderQsList(qs){
  return qs.map((q,i)=>`
    <div style="border:1.5px solid var(--border);border-radius:10px;padding:13px;margin-bottom:10px;background:#fafafa">
      <div style="display:flex;gap:8px;margin-bottom:8px;align-items:flex-start">
        <div style="background:var(--primary);color:#fff;border-radius:7px;padding:2px 9px;font-size:12px;font-weight:700;flex-shrink:0">س${i+1}</div>
        <div style="font-size:13px;font-weight:600;line-height:1.6">${q.text}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px">
        ${(q.options||[]).map((o,j)=>`<div style="display:flex;align-items:flex-start;gap:6px;font-size:12px;padding:2px">
          <span style="background:${q.answer===j?'var(--correct)':'var(--bg)'};color:${q.answer===j?'#fff':'var(--text)'};border:1px solid ${q.answer===j?'var(--correct)':'var(--border)'};border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;min-width:22px;text-align:center;flex-shrink:0">${LABELS[j]}</span>
          <span style="color:${q.answer===j?'var(--correct)':'inherit'};${q.answer===j?'font-weight:700':''};">${o}</span>
        </div>`).join('')}
      </div>
    </div>`).join('');
}

function printLesson(){
  const qs=BANK[gk(curSem,curUnit,curLesson)]||[];if(!qs.length)return;
  const w=window.open('','_blank');
  w.document.write(`<html dir="rtl"><head><meta charset="UTF-8"><title>${curLesson}</title>
  <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
  <style>body{font-family:Tajawal,sans-serif;direction:rtl;padding:20px;max-width:800px;margin:0 auto}.q{margin-bottom:14px;border:1px solid #ddd;padding:12px;border-radius:8px}.opts{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:8px}.opt{display:flex;gap:7px;font-size:12px;align-items:flex-start;padding:2px}.lbl{background:#eee;padding:1px 6px;border-radius:4px;font-weight:700;font-size:10px;flex-shrink:0}.cor{background:#2e8b6e;color:#fff}</style>
  </head><body><h2 style="color:#1a3a5c;margin-bottom:4px">${curLesson}</h2><p style="color:#666;font-size:12px;margin-bottom:16px">الصف الثاني عشر — الثقافة المالية</p>
  ${qs.map((q,i)=>`<div class="q"><strong>س${i+1}:</strong> ${q.text}<div class="opts">${(q.options||[]).map((o,j)=>`<div class="opt"><span class="lbl ${q.answer===j?'cor':''}">${LABELS[j]}</span>${o}</div>`).join('')}</div></div>`).join('')}
  </body></html>`);w.print();
}

function renderOv(){
  [1,2].forEach(s=>{
    document.getElementById(`ov${s}`).innerHTML=CUR[s].units.map(u=>{
      const cnt=u.lessons.reduce((sum,l)=>sum+(BANK[gk(s,u.id,l)]||[]).length,0);
      const tot=u.lessons.length*10;const pct=Math.min(100,Math.round(cnt/tot*100));
      return `<div class="ov-row"><div class="ov-lbl"><span>${u.name}</span><span class="text-muted">${cnt}/${tot}</span></div>
        <div class="pbar"><div class="pbar-f" style="width:${pct}%;background:${s===1?'var(--f1)':'var(--f2)'}"></div></div></div>`;
    }).join('');
  });
}

function qSelSem(n){
  qSem=n;qUnits=[];
  document.getElementById('qsb1').className='sem-btn'+(n===1?' f1':'');
  document.getElementById('qsb2').className='sem-btn'+(n===2?' f2':'');
  document.getElementById('qsb0').className='sem-btn'+(n===0?' f1':'');
  renderQUnitGrid();updateQuizAvail();
}

function renderQUnitGrid(){
  const sems=qSem===0?[1,2]:[qSem];
  const units=sems.flatMap(s=>CUR[s].units.map(u=>({...u,sem:s})));
  document.getElementById('q-unit-grid').innerHTML=units.map(u=>{
    const cnt=u.lessons.reduce((s,l)=>s+(BANK[gk(u.sem,u.id,l)]||[]).length,0);
    const sel=qUnits.includes(u.id);
    return `<div class="unit-card${sel?(u.sem===1?' sel1':' sel2'):''}" onclick="toggleQUnit('${u.id}','${u.sem}')">
      <div class="unit-num">وحدة ${u.id.replace('u','')}</div>
      <div class="unit-name">${u.name}</div>
      <div class="unit-cnt">${cnt} سؤال ${sel?'✓':''}</div>
    </div>`;
  }).join('');
  const sel=document.getElementById('q-lesson-sel');
  const prev=sel.value;
  sel.innerHTML='<option value="all">جميع الدروس</option>';
  units.filter(u=>!qUnits.length||qUnits.includes(u.id)).forEach(u=>{
    u.lessons.forEach(l=>{const cnt=(BANK[gk(u.sem,u.id,l)]||[]).length;if(cnt){const o=document.createElement('option');o.value=`${u.sem}|${u.id}|${l}`;o.textContent=l+` (${cnt}ق)`;sel.appendChild(o);}});
  });
  sel.value=prev||'all';
}

function toggleQUnit(uid,sem){
  if(qUnits.includes(uid)) qUnits=qUnits.filter(u=>u!==uid);
  else qUnits.push(uid);
  renderQUnitGrid();updateQuizAvail();
}

function selMode(m){
  quizMode=m;
  document.getElementById('mode-practice').className='setup-opt'+(m==='practice'?' sel':'');
  document.getElementById('mode-exam').className='setup-opt'+(m==='exam'?' sel':'');
}

function collectQuizQs(){
  const sems=qSem===0?[1,2]:[qSem];
  const lessonFilter=document.getElementById('q-lesson-sel').value;
  let all=[];
  sems.forEach(s=>{
    CUR[s].units.forEach(u=>{
      if(qUnits.length&&!qUnits.includes(u.id))return;
      u.lessons.forEach(l=>{
        const key=`${s}|${u.id}|${l}`;
        if(lessonFilter!=='all'&&lessonFilter!==key)return;
        (BANK[gk(s,u.id,l)]||[]).forEach(q=>all.push({...q,unit:u.name,lesson:l,sem:s}));
      });
    });
  });
  return all;
}

function updateQuizAvail(){
  const qs=collectQuizQs();
  document.getElementById('quiz-avail').textContent=`${qs.length} سؤال متاح`;
}

function startQuiz(){
  const allQs=collectQuizQs();
  if(!allQs.length){showToast('لا توجد أسئلة. اختر وحدة أولاً.','error');return;}
  const count=+document.getElementById('q-count').value||40;
  quizTimer=+document.getElementById('q-timer').value;
  quizOrder=document.getElementById('q-order').value;
  quizMode=document.getElementById('mode-practice').classList.contains('sel')?'practice':'exam';
  let qs=quizOrder==='random'?shuf([...allQs]):[...allQs];
  if(count>0)qs=qs.slice(0,count);
  launchQuiz(qs,'الاختبار التفاعلي',document.getElementById('stu-name').value,document.getElementById('stu-class').value);
}

function quickQuiz(sem,uid,lesson){
  const qs=(BANK[gk(sem,uid,lesson)]||[]).map(q=>({...q,unit:uid,lesson}));
  if(!qs.length){showToast('لا توجد أسئلة','error');return;}
  quizMode='practice';quizTimer=0;
  launchQuiz(shuf([...qs]),lesson,'','');
}

function startExamQuiz(){
  const qs=window._exQs||[];
  if(!qs.length){showToast('ولّد الامتحان أولاً','error');return;}
  quizMode='exam';quizTimer=60;
  launchQuiz([...qs],(ET.find(t=>t.id===exType)||{name:'الامتحان'}).name,'','');
}

function startExamFromPreview(){startExamQuiz();}
function startMinQuiz(){
  const qs=window._minQs||[];
  if(!qs.length){showToast('ولّد النموذج أولاً','error');return;}
  quizMode='exam';quizTimer=60;
  launchQuiz([...qs],'النموذج الوزاري','','');
}

function launchQuiz(qs,title,stuName,stuClass){
  quizQs=qs;quizIdx=0;quizAnswers={};quizSkipped={};
  quizRetryData={qs,title,stuName,stuClass};
  document.getElementById('quiz-title-bar').textContent=title;
  document.getElementById('quiz-meta-bar').textContent=(stuName?stuName+' — ':'')+`${qs.length} سؤال | نمط: ${quizMode==='practice'?'تدريبي':'امتحاني'}`;
  document.getElementById('quiz-overlay').style.display='block';
  document.body.style.overflow='hidden';
  renderQuizQ();
}

function renderQuizQ(){
  if(quizIdx>=quizQs.length){endQuiz();return;}
  const q=quizQs[quizIdx];
  const answered=quizAnswers[quizIdx]!==undefined;
  const skipped=quizSkipped[quizIdx];
  const total=quizQs.length;
  document.getElementById('quiz-prog').style.width=((quizIdx)/total*100)+'%';
  document.getElementById('q-counter').textContent=`السؤال ${quizIdx+1} من ${total}`;
  document.getElementById('btn-prev').style.display=quizIdx>0?'':'none';
  document.getElementById('btn-skip').style.display=answered?'none':'';
  const opts=q.options||[];
  let cardClass='quiz-q-card';
  if(answered&&quizMode==='practice'){
    cardClass+=(quizAnswers[quizIdx]===q.answer?' answered-correct':' answered-wrong');
  }
  document.getElementById('quiz-body').innerHTML=`
    <div class="${cardClass}" id="q-card">
      <div class="quiz-q-header">
        <div class="quiz-q-num">${quizIdx+1}</div>
        <div class="quiz-q-text">${q.text}</div>
      </div>
      <div class="quiz-opts" id="quiz-opts">
        ${opts.map((o,j)=>{
          let cls='quiz-opt';
          if(answered){
            cls+=' disabled';
            if(quizMode==='practice'){
              if(j===q.answer)cls+=' correct';
              else if(j===quizAnswers[quizIdx])cls+=' wrong';
            } else {
              if(j===quizAnswers[quizIdx])cls+=' selected';
            }
          }
          return `<div class="${cls}" onclick="${answered?'':'pickAns('+j+')'}">
            <div class="opt-circle">${LABELS[j]}</div>
            <span>${o}</span>
          </div>`;
        }).join('')}
      </div>
      ${answered&&quizMode==='practice'?`
        <div class="feedback-msg ${quizAnswers[quizIdx]===q.answer?'correct':'wrong'}" style="display:block">
          ${quizAnswers[quizIdx]===q.answer?'✅ إجابة صحيحة! أحسنت.':'❌ إجابة خاطئة. الإجابة الصحيحة: <strong>'+LABELS[q.answer]+' — '+opts[q.answer]+'</strong>'}
          <br><small style="opacity:.8">📌 ${q.unit||''} — ${q.lesson||''}</small>
        </div>`:
        (skipped?'<div class="feedback-msg wrong" style="display:block">⏭️ تم تخطي هذا السؤال</div>':'')}
    </div>`;
  if(quizTimer>0&&!answered){
    clearInterval(quizTimerInterval);
    quizTimeLeft=quizTimer;
    updateTimerDisplay();
    document.getElementById('quiz-timer').style.display='block';
    quizTimerInterval=setInterval(()=>{
      quizTimeLeft--;
      updateTimerDisplay();
      if(quizTimeLeft<=0){clearInterval(quizTimerInterval);autoSkip();}
    },1000);
  } else {
    clearInterval(quizTimerInterval);
    document.getElementById('quiz-timer').style.display='none';
  }
}

function updateTimerDisplay(){
  const el=document.getElementById('quiz-timer');
  const m=Math.floor(quizTimeLeft/60),s=quizTimeLeft%60;
  el.textContent=`⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  el.className='quiz-timer'+(quizTimeLeft<=10?' urgent':'');
}

function autoSkip(){quizSkipped[quizIdx]=true;qNav(1);}

function pickAns(j){
  if(quizAnswers[quizIdx]!==undefined)return;
  clearInterval(quizTimerInterval);
  quizAnswers[quizIdx]=j;
  if(quizMode==='practice'){
    renderQuizQ();
  } else {
    document.querySelectorAll('.quiz-opt').forEach((el,i)=>{
      el.classList.add('disabled');
      if(i===j)el.classList.add('selected');
    });
    setTimeout(()=>qNav(1),600);
  }
}

function qNav(dir){
  clearInterval(quizTimerInterval);
  const newIdx=quizIdx+dir;
  if(newIdx<0)return;
  if(newIdx>=quizQs.length){endQuiz();return;}
  quizIdx=newIdx;renderQuizQ();
}

function qSkip(){quizSkipped[quizIdx]=true;qNav(1);}
function endQuizEarly(){if(confirm('هل تريد إنهاء الاختبار الآن وعرض النتائج؟'))endQuiz();}
function endQuiz(){
  clearInterval(quizTimerInterval);
  document.getElementById('quiz-overlay').style.display='none';
  showResults();
}

function closeQuiz(){
  clearInterval(quizTimerInterval);
  document.getElementById('quiz-overlay').style.display='none';
  document.body.style.overflow='';
}

function closeResults(){
  document.getElementById('results-overlay').style.display='none';
  document.body.style.overflow='';
}

function retryQuiz(){
  document.getElementById('results-overlay').style.display='none';
  if(quizRetryData){
    quizQs=shuf([...quizRetryData.qs]);quizIdx=0;quizAnswers={};quizSkipped={};
    document.getElementById('quiz-overlay').style.display='block';
    renderQuizQ();
  }
}

function showResults(){
  document.body.style.overflow='';
  const total=quizQs.length;
  let correct=0,wrong=0,skipped=0;
  quizQs.forEach((q,i)=>{
    if(quizSkipped[i])skipped++;
    else if(quizAnswers[i]===undefined)skipped++;
    else if(quizAnswers[i]===q.answer)correct++;
    else wrong++;
  });
  const pct=Math.round(correct/total*100);
  const grade=pct>=90?{g:'ممتاز',c:'#2e8b6e',bg:'#d4f0e6'}:pct>=80?{g:'جيد جداً',c:'#1a5276',bg:'#d4e8f5'}:pct>=70?{g:'جيد',c:'#7d3c98',bg:'#ead7f5'}:pct>=60?{g:'مقبول',c:'#c8a84b',bg:'#fef9e7'}:{g:'راسب',c:'#e05a2b',bg:'#fde8e0'};
  const emoji=pct>=90?'🏆':pct>=80?'⭐':pct>=70?'👍':pct>=60?'📖':'💪';
  const stuName=quizRetryData?.stuName||'';
  const stuClass=quizRetryData?.stuClass||'';
  const review=quizQs.map((q,i)=>{
    const ans=quizAnswers[i];
    const skip=quizSkipped[i]||(ans===undefined);
    const isCorrect=!skip&&ans===q.answer;
    const status=skip?'rs-skip rs':isCorrect?'rs-correct rc':'rs-wrong rw';
    const statusTxt=skip?'⏭️ تم التخطي':isCorrect?'✅ إجابة صحيحة':'❌ إجابة خاطئة';
    return `<div class="review-card ${status.split(' ')[1]}">
      <div class="review-status ${status.split(' ')[0]}">${statusTxt} — س${i+1}</div>
      <div class="review-q">${q.text}</div>
      <div class="review-opts">
        ${(q.options||[]).map((o,j)=>{
          let lbl='rlbl-normal';
          if(j===q.answer)lbl='rlbl-correct';
          else if(j===ans&&!isCorrect&&!skip)lbl='rlbl-wrong';
          return `<div class="review-opt"><span class="rlbl ${lbl}">${LABELS[j]}</span><span style="${j===q.answer?'font-weight:700;color:var(--correct)':j===ans&&!isCorrect?'color:var(--wrong)':''}">${o}</span></div>`;
        }).join('')}
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:6px">📌 ${q.unit||''} — ${q.lesson||''}</div>
    </div>`;
  }).join('');
  document.getElementById('results-content').innerHTML=`
    <div class="score-card">
      <div class="score-emoji">${emoji}</div>
      ${stuName?`<div style="font-size:14px;opacity:.9;margin-bottom:4px">${stuName}${stuClass?' — '+stuClass:''}</div>`:''}
      <div class="score-num">${correct} / ${total}</div>
      <div class="score-pct">${pct}%</div>
      <div style="font-size:14px;margin-top:6px;opacity:.85">العلامة: ${correct} من ${total}</div>
      <div class="grade-badge" style="background:${grade.bg};color:${grade.c}">${grade.g}</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card correct"><div class="sv">${correct}</div><div class="sl">✅ إجابات صحيحة</div></div>
      <div class="stat-card wrong"><div class="sv">${wrong}</div><div class="sl">❌ إجابات خاطئة</div></div>
      <div class="stat-card skip"><div class="sv">${skipped}</div><div class="sl">⏭️ أسئلة محذوفة</div></div>
    </div>
    <div style="font-size:14px;font-weight:700;margin-bottom:12px">📋 مراجعة تفصيلية للإجابات</div>
    ${review}`;
  document.getElementById('results-overlay').style.display='block';
  document.getElementById('results-overlay').scrollTop=0;
}

function selExSem(n){
  exSem=n;exType=null;
  document.getElementById('esb1').className='sem-btn'+(n===1?' f1':'');
  document.getElementById('esb2').className='sem-btn'+(n===2?' f2':'');
  renderExTypes();
  document.getElementById('ex-units').style.display='none';
  document.getElementById('ex-prev-sec').style.display='none';
}

function renderExTypes(){
  document.getElementById('et-grid').innerHTML=ET.map(t=>`
    <div class="et-card" id="et-${t.id}" onclick="selExType('${t.id}')">
      <div class="et-icon">${t.icon}</div><div class="et-name">${t.name}</div>
    </div>`).join('');
}

function selExType(id){
  exType=id;
  document.querySelectorAll('.et-card').forEach(c=>c.className='et-card');
  const t=ET.find(t=>t.id===id);document.getElementById('et-'+id).classList.add(t.cls);
  renderExUnitCbs();document.getElementById('ex-units').style.display='block';
  document.getElementById('ex-prev-sec').style.display='none';
}

function renderExUnitCbs(){
  const units=CUR[exSem].units;
  document.getElementById('ex-unit-cbs').innerHTML=units.map((u,i)=>{
    const cnt=u.lessons.reduce((s,l)=>s+(BANK[gk(exSem,u.id,l)]||[]).length,0);
    const chk=exType==='final'||(exType==='tq1'&&i<Math.ceil(units.length/2))||(exType==='tq2'&&i>=Math.ceil(units.length/2));
    return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:12px">
      <input type="checkbox" name="eu" value="${u.id}" ${chk?'checked':''} style="width:15px;height:15px;accent-color:var(--primary)">
      <span style="font-weight:600">${u.name}</span><span class="text-muted" style="margin-right:auto">${cnt}ق</span>
    </label>`;
  }).join('');
}

function getSelUnits(){return[...document.querySelectorAll('input[name="eu"]:checked')].map(c=>c.value);}

function collectExQs(sem,unitIds){
  const all=[];
  CUR[sem].units.filter(u=>!unitIds||unitIds.includes(u.id)).forEach(u=>{
    u.lessons.forEach(l=>(BANK[gk(sem,u.id,l)]||[]).forEach(q=>all.push({...q,unit:u.name,lesson:l,sem})));
  });return all;
}

function buildExam(){
  const sel=getSelUnits();if(!sel.length){showToast('اختر وحدة','error');return;}
  const qs=collectExQs(exSem,sel);if(qs.length<5){showToast('لا توجد أسئلة كافية','error');return;}
  renderExPrev(shuf([...qs]).slice(0,40));
}

function buildExamAll(){
  const qs=collectExQs(exSem,null);if(qs.length<5){showToast('لا توجد أسئلة كافية','error');return;}
  renderExPrev(shuf([...qs]).slice(0,40));
}

function loadPrebuilt(){
  const keys=[`exam|tq1_f${exSem}`,`exam|tq2_f${exSem}`,`exam|final_f${exSem}`];
  const idx=ET.findIndex(t=>t.id===exType);
  const qs=(BANK[keys[idx]]||[]).map((q,i)=>({...q,id:i,unit:'',lesson:''}));
  if(!qs.length){showToast('الامتحان الجاهز غير متاح','error');return;}
  renderExPrev(qs);
}

function renderExPrev(qs){
  const t=ET.find(t=>t.id===exType)||{name:'الامتحان'};
  document.getElementById('ex-hdr').innerHTML=`<h2>المملكة الأردنية الهاشمية — وزارة التربية والتعليم</h2>
    <p>مبحث الثقافة المالية — الصف الثاني عشر — ${CUR[exSem].name}</p>
    <p style="font-size:15px;font-weight:800;margin-top:5px">${t.name}</p>`;
  document.getElementById('ex-info').innerHTML=`
    <div>اسم الطالب: <span>__________________________</span></div>
    <div>الشعبة: <span>___________</span></div>
    <div>التاريخ: <span>___________</span></div>
    <div>العلامة: <span>_____ / ${qs.length}</span></div>`;
  document.getElementById('ex-body').innerHTML=renderQsExam(qs);
  document.getElementById('ex-prev-sec').style.display='block';
  showAns=false;document.getElementById('ex-ak').style.display='none';
  window._exQs=qs;
  document.getElementById('ex-prev-sec').scrollIntoView({behavior:'smooth'});
}

function renderQsExam(qs,showA=false){
  return qs.map((q,i)=>`<div class="eq"><div class="eq-num">${i+1}</div><div>
    <div class="eq-text">${q.text||'—'}</div>
    <div class="eq-opts">${(q.options||[]).map((o,j)=>`<div class="eq-opt">
      <span class="opt-lbl${showA&&q.answer===j?' cor':''}">${LABELS[j]}</span>
      <span style="${showA&&q.answer===j?'font-weight:700;color:var(--correct)':''}">${o||'—'}</span>
    </div>`).join('')}</div>
    ${showA?`<div class="text-muted" style="margin-top:4px;font-size:11px">📌 ${q.unit||''} — ${q.lesson||''}</div>`:''}
  </div></div>`).join('');
}

function toggleAns(){
  showAns=!showAns;const qs=window._exQs;if(!qs)return;
  document.getElementById('ex-body').innerHTML=renderQsExam(qs,showAns);
  const ak=document.getElementById('ex-ak');
  if(showAns){ak.style.display='block';ak.innerHTML=buildAK(qs);}else ak.style.display='none';
}

function shuffleEx(){if(!window._exQs)return;window._exQs=shuf([...window._exQs]);document.getElementById('ex-body').innerHTML=renderQsExam(window._exQs,showAns);}

function buildAK(qs){
  return`<div class="card"><div class="card-title">🗝️ مفتاح الإجابات</div>
    <div class="ak-grid">${qs.map((q,i)=>`<div class="ak-item"><div class="ak-n">س${i+1}</div><div class="ak-a">${LABELS[q.answer]||'أ'}</div></div>`).join('')}</div></div>`;
}

function prevDist(){
  const scope=document.getElementById('min-scope').value,count=+document.getElementById('min-count').value;
  const sems=scope==='both'?[1,2]:scope==='f1'?[1]:[2];
  const units=sems.flatMap(s=>CUR[s].units.map(u=>({...u,sem:s})));
  const perU=Math.floor(count/units.length),extra=count%units.length;
  document.getElementById('dist-prev').innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:7px">
    ${units.map((u,i)=>{const need=perU+(i<extra?1:0);const avail=u.lessons.reduce((s,l)=>s+(BANK[gk(u.sem,u.id,l)]||[]).length,0);
      return`<div style="border:1.5px solid var(--border);border-radius:8px;padding:9px"><div style="font-size:11px;font-weight:700;margin-bottom:2px">${u.name}</div>
      <div style="font-size:10px;color:var(--text-muted)">مطلوب: ${need} | متاح: ${avail}</div>
      <div class="pbar"><div class="pbar-f" style="width:${Math.min(100,avail/Math.max(need,1)*100)}%;background:${avail>=need?'var(--correct)':'var(--accent)'}"></div></div></div>`;
    }).join('')}</div>`;
}

function genMin(){
  const scope=document.getElementById('min-scope').value,count=+document.getElementById('min-count').value;
  const method=document.getElementById('min-method').value,name=document.getElementById('min-name').value;
  const sems=scope==='both'?[1,2]:scope==='f1'?[1]:[2];
  const units=sems.flatMap(s=>CUR[s].units.map(u=>({...u,sem:s})));
  const perU=Math.floor(count/units.length),extra=count%units.length;
  let selected=[];
  units.forEach((u,i)=>{
    const need=perU+(i<extra?1:0);
    let got=shuf(u.lessons.flatMap(l=>(BANK[gk(u.sem,u.id,l)]||[]).map(q=>({...q,unit:u.name,lesson:l,sem:u.sem})))).slice(0,need);
    if(got.length<need&&method!=='bank')got=[...got,...getSim(u.id,need-got.length)];
    selected=[...selected,...got.slice(0,need)];
  });
  selected=shuf(selected).slice(0,count);
  if(selected.length<5){showToast('أضف أسئلة أولاً أو اختر توليد مشابه','error');return;}
  const genCnt=selected.filter(q=>q.generated).length;
  const scopeName=scope==='both'?'الفصلان الأول والثاني':scope==='f1'?'الفصل الأول':'الفصل الثاني';
  document.getElementById('min-prev').innerHTML=`
    <div class="exam-hdr"><h2>المملكة الأردنية الهاشمية — وزارة التربية والتعليم</h2>
      <p>مبحث الثقافة المالية — الصف الثاني عشر</p>
      <p style="font-size:15px;font-weight:800;margin-top:5px">${name}</p>
      <p>${scopeName} | ${selected.length} سؤال${genCnt?` (${genCnt} مولّد)`:''}</p></div>
    <div class="exam-info"><div>اسم الطالب: <span>__________________________</span></div>
      <div>الشعبة: <span>___________</span></div><div>التاريخ: <span>___________</span></div>
      <div>العلامة: <span>_____ / ${selected.length}</span></div></div>
    <div class="exam-body">${renderQsExam(selected)}</div>`;
  document.getElementById('min-prev-sec').style.display='block';
  showMinAns=false;document.getElementById('min-ak').style.display='none';
  window._minQs=selected;
  document.getElementById('min-prev-sec').scrollIntoView({behavior:'smooth'});
  showToast(`✅ تم توليد ${selected.length} سؤالاً`,'success');
}

function getSim(uid,n){const t=SIM[uid]||SIM.u1;return Array.from({length:n},(_,i)=>({...t[i%t.length],id:'sim-'+Date.now()+i,generated:true}));}

function toggleMinAns(){
  showMinAns=!showMinAns;const qs=window._minQs;if(!qs)return;
  const body=document.getElementById('min-prev').querySelector('.exam-body');
  if(body)body.innerHTML=renderQsExam(qs,showMinAns);
  const ak=document.getElementById('min-ak');
  if(showMinAns){ak.style.display='block';ak.innerHTML=buildAK(qs);}else ak.style.display='none';
}

function initBrowse(){
  const sel=document.getElementById('br-unit'),prev=sel.value;
  sel.innerHTML='<option value="all">جميع الوحدات</option>';
  [1,2].forEach(s=>CUR[s].units.forEach(u=>{const o=document.createElement('option');o.value=u.id;o.textContent=u.name;sel.appendChild(o);}));
  sel.value=prev;doBrowse();
}

function doBrowse(){
  const semF=document.getElementById('br-sem').value,unitF=document.getElementById('br-unit').value;
  const search=document.getElementById('br-search').value.toLowerCase().trim();
  let all=[];
  [1,2].forEach(s=>{if(semF!=='all'&&semF!=s)return;
    CUR[s].units.forEach(u=>{if(unitF!=='all'&&unitF!==u.id)return;
      u.lessons.forEach(l=>(BANK[gk(s,u.id,l)]||[]).forEach(q=>all.push({...q,sem:s,unitName:u.name,lesson:l})));});});
  if(search)all=all.filter(q=>(q.text||'').toLowerCase().includes(search)||(q.lesson||'').includes(search));
  document.getElementById('br-stats').textContent=`عرض ${all.length} سؤال`;
  if(!all.length){document.getElementById('br-table').innerHTML='<div class="empty"><div class="ei">🔍</div><p>لا توجد نتائج</p></div>';return;}
  document.getElementById('br-table').innerHTML=`<div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr style="background:var(--primary);color:#fff">
        <th style="padding:8px;text-align:right">#</th><th style="padding:8px;text-align:right">نص السؤال</th>
        <th style="padding:8px;text-align:right">الوحدة</th><th style="padding:8px;text-align:right">الإجابة</th>
        <th style="padding:8px;text-align:right">الفصل</th>
      </tr></thead>
      <tbody>${all.map((q,i)=>`<tr style="${i%2===0?'background:#fafafa':''}">
        <td style="padding:7px 10px;color:var(--text-muted);font-weight:700">${i+1}</td>
        <td style="padding:7px 10px;max-width:280px;line-height:1.5">${q.text||'—'}</td>
        <td style="padding:7px 10px">${q.unitName}</td>
        <td style="padding:7px 10px"><span style="background:var(--correct);color:#fff;padding:2px 8px;border-radius:7px;font-size:11px;font-weight:700">${LABELS[q.answer]||'أ'}</span></td>
        <td style="padding:7px 10px"><span class="tag tag-f${q.sem}">ف${q.sem}</span></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
}

function shuf(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function showToast(msg,type=''){
  const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'');
  setTimeout(()=>t.className='toast',3200);
}

selSem(1);renderExTypes();selExSem(1);renderOv();updateStats();prevDist();
qSelSem(1);