// ══════════════════════════════════════════════
//  CURRICULUM STRUCTURE
// ══════════════════════════════════════════════
var CUR = {
  1: { name: 'الفصل الأول', units: [
    { id: 1, uid: 'u1', name: 'الدورة المحاسبية', lessons: ['الدورة المحاسبية المفهوم والمراحل','نظرية القيد المزدوج والعمليات المالية','تسجيل القيود المحاسبية','دفتر اليومية','دفتر الأستاذ','ميزان المراجعة'] },
    { id: 2, uid: 'u2', name: 'القوائم المالية', lessons: ['القوائم المالية الأنواع والأهمية','إقفال الحسابات'] },
    { id: 3, uid: 'u3', name: 'التحليل المالي', lessons: ['مفهوم التحليل المالي وأهميته','تقنيات التحليل المالي','التحليل المالي والنسب','استخدامات التحليل المالي'] },
    { id: 4, uid: 'u4', name: 'الأسواق المالية', lessons: ['مفهوم الأسواق المالية وأنواعها وأهميتها','مفهوم الأصول المالية وأنواعها','مفهوم التداول وأنواعه وآلياته','دور التكنولوجيا في الأسواق المالية','بورصة عمان'] },
    { id: 5, uid: 'u5', name: 'البنك المركزي الأردني', lessons: ['البنك المركزي والسياسة النقدية','دور البنك المركزي الأردني في حماية المستهلك المالي','دور البنك المركزي الأردني في نشر الثقافة المالية المجتمعية','دور البنك المركزي الأردني في المحافظة على الاستقرار المصرفي والمالي'] }
  ]},
  2: { name: 'الفصل الثاني', units: [
    { id: 6, uid: 'u6', name: 'المؤسسات المالية الدولية', lessons: ['المؤسسات المالية الدولية: نشأتها، وأنواعها','صندوق النقد الدولي','البنك الدولي'] },
    { id: 7, uid: 'u7', name: 'الاستدامة المالية', lessons: ['مقدمة في الاستدامة المالية','أهداف الاستدامة المالية','الاستدامة المالية: التحديات والحلول','الاقتصاد الأخضر والاستدامة'] },
    { id: 8, uid: 'u8', name: 'الذكاء الاصطناعي التوليدي', lessons: ['الذكاء الاصطناعي التوليدي','الذكاء الاصطناعي التوليدي وعالم المال','المستشار المالي','الذكاء الاصطناعي التوليدي وخصوصية البيانات','الذكاء الاصطناعي التوليدي وأخلاقيات الأعمال'] },
    { id: 9, uid: 'u9', name: 'السياسات الاقتصادية', lessons: ['مقدمة في السياسات الاقتصادية والسياسة المالية','تأثير السياسة المالية في النشاط الاقتصادي','السياسة النقدية: أدواتها، وتأثيرها في النشاط الاقتصادي','السياسة التجارية: أدواتها وتأثيرها في النشاط الاقتصادي','السياسة الصناعية: أدواتها، وتأثيرها في النشاط الاقتصادي'] }
  ]}
};

var LBL = ['أ', 'ب', 'ج', 'د'];
var currentMode = 'train';
var currentUser = null;
var currentQuiz = [];
var userAnswers = {};
var timerInterval = null;
var timeLeft = 0;

// ── USER MANAGEMENT ──
function checkExistingUser() {
  var saved = localStorage.getItem('fin_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    showDashboard();
  } else {
    showScreen('screen-start');
  }
}

function saveNewUser() {
  var name = document.getElementById('student-name').value.trim();
  var school = document.getElementById('student-school').value.trim();
  if (!name) { alert('الرجاء إدخال اسمك'); return; }
  currentUser = { name: name, school: school, mode: currentMode };
  localStorage.setItem('fin_user', JSON.stringify(currentUser));
  showDashboard();
}

function logout() {
  localStorage.removeItem('fin_user');
  currentUser = null;
  location.reload();
}

function setMode(m) {
  currentMode = m;
  document.getElementById('mode-train').classList.toggle('active', m === 'train');
  document.getElementById('mode-exam').classList.toggle('active', m === 'exam');
}

// ── SCREEN MANAGEMENT ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
}

function showDashboard() {
  document.getElementById('user-display').textContent = currentUser.name + (currentUser.school ? ' | ' + currentUser.school : '');
  currentMode = currentUser.mode || 'train';
  renderDashboard();
  showScreen('screen-dashboard');
}

// ── DASHBOARD RENDER ──
function renderDashboard() {
  document.getElementById('dash-content').innerHTML = renderSemesterPicker();
}

function renderSemesterPicker() {
  return '<div class="dash-step" id="step-sem">' +
    '<div class="step-label"><span class="step-num">١</span> اختر الفصل الدراسي</div>' +
    '<div class="sem-cards">' +
    '<div class="sem-card" onclick="selectSem(1)">' +
      '<div class="sem-icon">📘</div>' +
      '<div class="sem-title">الفصل الأول</div>' +
      '<div class="sem-sub">٥ وحدات — ' + countSemQs(1) + ' سؤال</div>' +
    '</div>' +
    '<div class="sem-card" onclick="selectSem(2)">' +
      '<div class="sem-icon">📗</div>' +
      '<div class="sem-title">الفصل الثاني</div>' +
      '<div class="sem-sub">٤ وحدات — ' + countSemQs(2) + ' سؤال</div>' +
    '</div>' +
    '<div class="sem-card sem-card-both" onclick="selectSem(0)">' +
      '<div class="sem-icon">📚</div>' +
      '<div class="sem-title">الفصلان معاً</div>' +
      '<div class="sem-sub">نموذج شامل — ' + bank.length + ' سؤال</div>' +
    '</div>' +
    '</div></div>';
}

function countSemQs(sem) {
  return bank.filter(function(q) { return q.sem === sem; }).length;
}

function selectSem(sem) {
  // Highlight selected
  document.querySelectorAll('.sem-card').forEach(function(c) { c.classList.remove('selected'); });
  var cards = document.querySelectorAll('.sem-card');
  var idx = sem === 1 ? 0 : sem === 2 ? 1 : 2;
  if (cards[idx]) cards[idx].classList.add('selected');

  if (sem === 0) {
    // Direct ministerial
    startQuiz('ministerial', {});
    return;
  }

  // Show units for selected semester
  var existing = document.getElementById('step-unit');
  if (existing) existing.remove();
  var existing2 = document.getElementById('step-lesson');
  if (existing2) existing2.remove();

  var units = CUR[sem].units;
  var html = '<div class="dash-step" id="step-unit">' +
    '<div class="step-label"><span class="step-num">٢</span> اختر الوحدة</div>' +
    '<div class="unit-cards">';
  units.forEach(function(u) {
    var cnt = bank.filter(function(q) { return q.unit === u.id; }).length;
    html += '<div class="unit-card-btn" onclick="selectUnit(' + sem + ',' + u.id + ',\'' + u.name + '\')">' +
      '<div class="uc-num">و' + u.id + '</div>' +
      '<div class="uc-name">' + u.name + '</div>' +
      '<div class="uc-cnt">' + cnt + ' سؤال</div>' +
    '</div>';
  });
  html += '</div>' +
    '<div class="or-divider">— أو —</div>' +
    '<button class="btn btn-unit-all" onclick="startQuiz(\'sem\',{semNum:' + sem + '})">' +
      '📋 اختبار كامل للفصل (' + countSemQs(sem) + ' سؤال)' +
    '</button>' +
  '</div>';
  document.getElementById('dash-content').insertAdjacentHTML('beforeend', html);
  document.getElementById('step-unit').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectUnit(sem, unitId, unitName) {
  // Highlight
  document.querySelectorAll('.unit-card-btn').forEach(function(c) { c.classList.remove('selected'); });
  event.currentTarget.classList.add('selected');

  var existing = document.getElementById('step-lesson');
  if (existing) existing.remove();

  var unit = CUR[sem].units.find(function(u) { return u.id === unitId; });
  if (!unit) return;

  var html = '<div class="dash-step" id="step-lesson">' +
    '<div class="step-label"><span class="step-num">٣</span> اختر الدرس</div>' +
    '<div class="lesson-list">';

  unit.lessons.forEach(function(l) {
    var cnt = bank.filter(function(q) { return q.lesson === l; }).length;
    if (cnt === 0) return;
    html += '<div class="lesson-item" onclick="selectLesson(\'' + l.replace(/'/g, "\\'") + '\',\'' + unitName.replace(/'/g, "\\'") + '\')">' +
      '<div class="li-icon">📄</div>' +
      '<div class="li-info"><div class="li-name">' + l + '</div><div class="li-cnt">' + cnt + ' سؤال</div></div>' +
      '<div class="li-arrow">←</div>' +
    '</div>';
  });

  html += '</div>' +
    '<div class="or-divider">— أو —</div>' +
    '<button class="btn btn-unit-all" onclick="startQuiz(\'unit\',{unitId:' + unitId + '})">' +
      '📋 اختبار كامل للوحدة' +
    '</button>' +
  '</div>';

  document.getElementById('dash-content').insertAdjacentHTML('beforeend', html);
  document.getElementById('step-lesson').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectLesson(lessonName, unitName) {
  var existing = document.getElementById('step-action');
  if (existing) existing.remove();

  var cnt = bank.filter(function(q) { return q.lesson === lessonName; }).length;
  var html = '<div class="dash-step lesson-action-card" id="step-action">' +
    '<div class="la-lesson-name">📄 ' + lessonName + '</div>' +
    '<div class="la-cnt">' + cnt + ' سؤال متاح</div>' +
    '<button class="btn btn-start-quiz" onclick="startQuiz(\'lesson\',{lessonName:\'' + lessonName.replace(/'/g, "\\'") + '\'})">' +
      '🚀 اختبر نفسك الآن' +
    '</button>' +
  '</div>';

  document.getElementById('dash-content').insertAdjacentHTML('beforeend', html);
  document.getElementById('step-action').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── QUIZ ENGINE ──
function startQuiz(type, params) {
  params = params || {};
  currentQuiz = selectQuestions(type, params);
  userAnswers = {};

  if (currentQuiz.length === 0) {
    alert('لا توجد أسئلة في هذا القسم');
    return;
  }

  renderQuiz();

  if (currentMode === 'exam') {
    var totalSec = currentQuiz.length * 60;
    startTimer(totalSec);
  }

  showScreen('screen-quiz');
  window.scrollTo(0, 0);
}

function renderQuiz() {
  var html = '';
  currentQuiz.forEach(function(q, i) {
    html += '<div class="question-card" id="qcard-' + i + '">' +
      '<div class="q-header">' +
        '<span class="q-badge">س' + (i+1) + '</span>' +
        '<span class="q-meta">' + q.lesson + '</span>' +
      '</div>' +
      '<div class="q-text">' + q.text + '</div>' +
      '<div class="options-list">';
    q.options.forEach(function(opt, j) {
      html += '<div class="option" id="opt-' + i + '-' + j + '" onclick="pickAnswer(' + i + ',' + j + ')">' +
        '<span class="opt-circle">' + LBL[j] + '</span>' +
        '<span class="opt-text">' + opt + '</span>' +
      '</div>';
    });
    html += '</div>';
    if (currentMode === 'train') {
      html += '<div class="train-feedback" id="fb-' + i + '" style="display:none"></div>';
    }
    html += '</div>';
  });

  document.getElementById('quiz-area').innerHTML = html;
  document.getElementById('quiz-header').innerHTML =
    '<div class="quiz-progress">' +
      '<span>السؤال 1 من ' + currentQuiz.length + '</span>' +
      '<div class="prog-bar"><div class="prog-fill" id="prog-fill" style="width:0%"></div></div>' +
    '</div>' +
    (currentMode === 'exam' ? '<div class="timer-box">⏱ <span id="timer">--:--</span></div>' : '');
}

function pickAnswer(qIdx, optIdx) {
  if (userAnswers[qIdx] !== undefined && currentMode === 'exam') return;
  userAnswers[qIdx] = optIdx;

  var q = currentQuiz[qIdx];
  var opts = document.querySelectorAll('[id^="opt-' + qIdx + '-"]');

  opts.forEach(function(el) { el.classList.remove('selected', 'correct', 'wrong', 'show-correct'); });
  document.getElementById('opt-' + qIdx + '-' + optIdx).classList.add('selected');

  if (currentMode === 'train') {
    opts.forEach(function(el, j) {
      el.style.pointerEvents = 'none';
      if (j === q.answer) el.classList.add('correct');
      else if (j === optIdx && optIdx !== q.answer) el.classList.add('wrong');
    });
    var fb = document.getElementById('fb-' + qIdx);
    if (fb) {
      fb.style.display = 'block';
      fb.className = 'train-feedback ' + (optIdx === q.answer ? 'fb-correct' : 'fb-wrong');
      fb.innerHTML = optIdx === q.answer
        ? '✅ إجابة صحيحة! أحسنت.'
        : '❌ إجابة خاطئة. الصحيح: <strong>' + LBL[q.answer] + ' — ' + q.options[q.answer] + '</strong>';
    }
  }

  // Update progress
  var answered = Object.keys(userAnswers).length;
  var pct = Math.round(answered / currentQuiz.length * 100);
  var fill = document.getElementById('prog-fill');
  if (fill) fill.style.width = pct + '%';
  var progSpan = document.querySelector('.quiz-progress span');
  if (progSpan) progSpan.textContent = 'تمت الإجابة على ' + answered + ' من ' + currentQuiz.length;
}

function finishQuiz() {
  clearInterval(timerInterval);
  var total = currentQuiz.length;
  var correct = 0;
  currentQuiz.forEach(function(q, i) {
    if (userAnswers[i] === q.answer) correct++;
  });
  var pct = Math.round(correct / total * 100);
  showResult(correct, total, pct);
}

function showResult(correct, total, pct) {
  var grade = pct >= 90 ? { g: 'ممتاز', icon: '🏆', c: '#27ae60' }
    : pct >= 80 ? { g: 'جيد جداً', icon: '⭐', c: '#2980b9' }
    : pct >= 70 ? { g: 'جيد', icon: '👍', c: '#8e44ad' }
    : pct >= 60 ? { g: 'مقبول', icon: '📖', c: '#f39c12' }
    : { g: 'راسب', icon: '💪', c: '#e74c3c' };

  document.getElementById('result-icon').innerHTML = '<div style="font-size:60px;text-align:center;margin-bottom:10px">' + grade.icon + '</div>';
  document.getElementById('final-score').innerHTML = pct + '%';
  document.getElementById('final-score').style.borderColor = grade.c;
  document.getElementById('final-score').style.color = grade.c;

  var wrong = total - correct - (total - Object.keys(userAnswers).length);
  var skipped = total - Object.keys(userAnswers).length;

  document.getElementById('analysis-text').innerHTML =
    '<div style="font-size:16px;font-weight:700;margin-bottom:10px">التقدير: ' + grade.g + '</div>' +
    '<div>✅ الإجابات الصحيحة: <strong>' + correct + '</strong></div>' +
    '<div>❌ الإجابات الخاطئة: <strong>' + wrong + '</strong></div>' +
    '<div>⏭️ غير مجاب عليها: <strong>' + skipped + '</strong></div>' +
    '<div style="margin-top:8px">الطالب: <strong>' + (currentUser ? currentUser.name : '') + '</strong></div>';

  showScreen('screen-result');
  window.scrollTo(0, 0);
}

// ── TIMER ──
function startTimer(seconds) {
  timeLeft = seconds;
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(function() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  var el = document.getElementById('timer');
  if (!el) return;
  var m = Math.floor(timeLeft / 60);
  var s = timeLeft % 60;
  el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  el.style.color = timeLeft <= 60 ? '#e74c3c' : '';
}

// ── LEGACY COMPAT ──
function showCategory(type) {
  if (type === 'unit' || type === 'lesson') {
    document.getElementById('step-sem') && document.getElementById('step-sem').scrollIntoView({behavior:'smooth'});
  }
}
