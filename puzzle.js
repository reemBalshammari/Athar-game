const select = (s) => document.querySelector(s);
let completedTasks = [false, false, false],
  excludedFiles = new Set(),
  comparisonOperator = "<",
  selectedMergeSteps = [],
  started = false,
  projectDeployed = false,
  elapsedSeconds = 0,
  previousFocus = null,
  soundEnabled = false,
  releaseTestsPassed = false,
  projectStatusReviewed = false;
const missionDetails = [
  ["حماية المشروع", "ملفات لا ينبغي رفعها"],
  ["إصلاح الكود", "اختبار يحتاج تصحيحًا"],
  ["حلّ التعارض", "تعديلان يكملان بعضهما"],
];
function invalidateTask(i) {
  if (completedTasks[i]) {
    completedTasks[i] = false;
    updateProgress();
  }
}
function playTone(f = 700) {
  if (!soundEnabled) return;
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(),
      o = c.createOscillator(),
      g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.frequency.value = f;
    g.gain.setValueAtTime(0.04, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.13);
    o.start();
    o.stop(c.currentTime + 0.14);
    o.onended = () => c.close();
  } catch {}
}
function showToast(t) {
  select("#toast").textContent = t;
  select("#toast").hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (select("#toast").hidden = true), 3500);
}
function updateProgress() {
  const count = completedTasks.filter(Boolean).length;
  select("#missionList").innerHTML = missionDetails
    .map(
      (t, i) =>
        `<button class="mission ${completedTasks[i] ? "done" : ""}" data-open="${i}"><span class="num">${completedTasks[i] ? "✓" : "0" + (i + 1)}</span><span>${t[0]}<small>${t[1]}</small></span></button>`,
    )
    .join("");
  select("#progressText").textContent = count + " من ٣ مكتملة";
  select("#progressFill").style.width = (count / 3) * 100 + "%";
  select("#terminalIcon").classList.toggle("locked", count !== 3);
  document
    .querySelectorAll(".desktopIcon[data-open]")
    .forEach((b) => b.classList.toggle("done", completedTasks[Number(b.dataset.open)] === true));
  bindAppButtons();
  if (count === 3 && !projectDeployed)
    select("#osStatus").textContent = "كل الإصلاحات مكتملة. افتح الطرفية للإطلاق.";
}
function bindAppButtons() {
  document
    .querySelectorAll("[data-open]")
    .forEach((b) => (b.onclick = () => openApp(b.dataset.open)));
}
function setWindowContent(html) {
  select("#windowContent").innerHTML = '<div class="appbody">' + html + "</div>";
}
function showFeedback(t, good = false) {
  select("#feedback").textContent = t;
  select("#feedback").className = "feedback" + (good ? " good" : "");
}
function completeTask(i, msg) {
  completedTasks[i] = true;
  updateProgress();
  playTone(1000);
  showFeedback(msg, true);
  if (!select("#returnDesktop")) {
    const b = document.createElement("button");
    b.id = "returnDesktop";
    b.className = "secondary";
    b.textContent = completedTasks.every(Boolean) ? "الانتقال للإطلاق" : "العودة لمساحة العمل";
    b.style.marginTop = "18px";
    b.onclick = () => {
      if (completedTasks.every(Boolean)) openApp("terminal");
      else closeApp();
    };
    select("#feedback").after(b);
  }
}
function openApp(id) {
  if (id === "terminal" && !completedTasks.every(Boolean)) {
    showToast("أكمل الإصلاحات الثلاثة قبل إطلاق المشروع");
    return;
  }
  previousFocus = document.activeElement;
  select("#windowOverlay").hidden = false;
  select("#closeWindow").focus();
  if (id === "brief") renderBrief();
  else if (id === "terminal") renderTerminal();
  else if (Number(id) === 0) renderFilesPuzzle();
  else if (Number(id) === 1) renderCodePuzzle();
  else if (Number(id) === 2) renderMergePuzzle();
}
function closeApp() {
  select("#windowOverlay").hidden = true;
  previousFocus?.focus();
}
function renderBrief() {
  select("#windowTitle").textContent = "README.md — ATHAR";
  setWindowContent(
    `<span class="eyebrow">مرحبًا بك في المشروع</span><h2>ثلاثة إصلاحات.<br>وإطلاق يستحق الانتظار.</h2><p class="description">نعمل على مشروع تقني يخدم المجتمع. قبل الإطلاق اكتشف الفريق أخطاء تحتاج انتباهك. افتح كل ملف وأصلح المشكلة بنفسك.</p><div class="briefList"><div class="briefItem"><b>01</b><span>ملفات المشروع: امنع رفع الأسرار والبيانات الحساسة إلى Git.</span></div><div class="briefItem"><b>02</b><span>محرّر الكود: أصلح شرط صلاحية رابط استعادة كلمة المرور ثم شغّل الاختبار.</span></div><div class="briefItem"><b>03</b><span>دمج التعديلات: اجمع وظائف الفرعين بالترتيب الصحيح.</span></div></div><div class="actions"><button class="primary" id="beginFiles">فتح ملفات المشروع</button></div>`,
  );
  select("#beginFiles").onclick = () => openApp("0");
}
// These filenames belong to the puzzle, not to real uploaded records.
const projectFiles = [
  ["README.md", "تعريف المشروع"],
  [".env", "مفتاح وصول وكلمة مرور"],
  ["src/app.js", "الكود الأساسي"],
  ["customers.csv", "بيانات عملاء حقيقية"],
  ["node_modules/", "حزم يمكن إعادة تثبيتها"],
];
function renderFilesPuzzle() {
  select("#windowTitle").textContent = "Project files — .gitignore";
  setWindowContent(
    `<span class="eyebrow">المهمّة ٠١ / حماية المشروع</span><h2>وش يبقى خارج المستودع؟</h2><p class="description">راجع ملفات المشروع. اضغط «استبعاد» على الملفات التي نضيفها إلى <b dir="ltr">.gitignore</b> واحتفظ بالكود وتعريف المشروع داخل Git.</p><div class="files"><div class="filehead"><span>FILE / PURPOSE</span><span>GIT STATUS</span></div>${projectFiles.map((f, i) => `<div class="fileRow ${excludedFiles.has(i) ? "excluded" : ""}" data-row="${i}"><span class="filename"><i>${i === 4 ? "▰" : "▤"}</i><span>${f[0]}<small style="display:block;font:10px Tahoma;color:#77906c;margin-top:5px;direction:rtl;text-align:left">${f[1]}</small></span></span><button data-file="${i}">${excludedFiles.has(i) ? "إعادة" : "استبعاد"}</button></div>`).join("")}</div><div class="actions"><button class="primary" id="checkFiles">فحص الملفات</button><button class="secondary" id="hint">تلميح</button></div><div class="feedback" id="feedback" role="status"></div>`,
  );
  document.querySelectorAll("[data-file]").forEach(
    (b) =>
      (b.onclick = () => {
        const i = Number(b.dataset.file);
        invalidateTask(0);
        excludedFiles.has(i) ? excludedFiles.delete(i) : excludedFiles.add(i);
        renderFilesPuzzle();
      }),
  );
  select("#hint").onclick = () =>
    showFeedback(
      "استبعد الأسرار والبيانات الحقيقية وكذلك الحزم التي يمكن تثبيتها مجددًا. ملفات الكود وREADME تبقى.",
    );
  select("#checkFiles").onclick = checkProjectFiles;
}
function renderCodePuzzle() {
  select("#windowTitle").textContent = "auth.js — Code editor";
  setWindowContent(
    `<span class="eyebrow">المهمّة ٠٢ / إصلاح الكود</span><h2>رابط صالح أو منتهي؟</h2><p class="description">هذا الشرط يحدّد صلاحية رابط استعادة كلمة المرور. الاختبار يفشل. اضغط العلامة الذهبية داخل الكود لتغيير المقارنة ثم شغّل الاختبارات.</p><div class="codeEditor"><div class="codetab">auth.js <span style="color:#d6b579;margin-left:20px">● 1 issue</span></div><div class="code"><span class="line"><span class="ln">1</span><span class="comment">// A valid link expires in the future.</span></span><span class="line"><span class="ln">2</span><span class="kw">function</span> <span class="fn">isLinkValid</span>(expiresAt, now) {</span><span class="line"><span class="ln">3</span>  <span class="kw">return</span> expiresAt <button class="codeToken" id="operator" aria-label="تغيير عامل المقارنة">${comparisonOperator === "<" ? "&lt;" : comparisonOperator === ">" ? "&gt;" : "==="}</button> now;</span><span class="line"><span class="ln">4</span>}</span></div></div><div class="tests" id="tests"><div class="testrow"><span>link expires in 10 minutes</span><span>WAITING</span></div><div class="testrow"><span>link expired 10 minutes ago</span><span>WAITING</span></div><div class="testrow"><span>link expires exactly now</span><span>WAITING</span></div></div><div class="actions"><button class="primary" id="runTests">تشغيل الاختبارات ▶</button><button class="secondary" id="hint">تلميح</button></div><div class="feedback" id="feedback" role="status"></div>`,
  );
  select("#operator").onclick = cycleComparisonOperator;
  select("#hint").onclick = () =>
    showFeedback("الرابط صالح إذا كان وقت انتهائه في المستقبل أي أكبر من الوقت الحالي.");
  select("#runTests").onclick = runLinkTests;
}
const mergeStatements = ["validateInput();", "updatePassword();", "sendConfirmation();"];
function renderMergePuzzle() {
  select("#windowTitle").textContent = "Merge conflict — password-reset.js";
  setWindowContent(
    `<span class="eyebrow">المهمّة ٠٣ / حلّ التعارض</span><h2>تعديلان. حلّ واحد مكتمل.</h2><p class="description">فرع أضاف التحقّق من المدخلات وفرع أضاف رسالة تأكيد. ابنِ النسخة النهائية بالضغط على الأسطر المطلوبة بالترتيب: التحقّق ثم التحديث ثم التأكيد.</p><div class="mergeGrid"><section class="mergePane"><div class="mergeTitle">AVAILABLE CHANGES / CLICK TO ADD</div>${[2, 0, 1].map((i) => `<button class="block" data-block="${i}" ${selectedMergeSteps.includes(i) ? "disabled" : ""}><span>${mergeStatements[i]}</span><b>＋</b></button>`).join("")}<div class="hint" style="padding:0 15px 15px;font-size:10px">كل سطر يُستخدم مرة واحدة.</div></section><section class="mergePane"><div class="mergeTitle">FINAL VERSION</div><div class="dropzone">${selectedMergeSteps.length ? selectedMergeSteps.map((b, i) => `<div class="selectedBlock"><b>${i + 1}</b>${mergeStatements[b]}</div>`).join("") : "<p>اضغط الأسطر من اللوحة المقابلة<br>لتكوين النسخة النهائية هنا.</p>"}</div></section></div><div class="actions"><button class="primary" id="mergeCheck">فحص الدمج</button><button class="secondary" id="clearMerge">مسح الترتيب</button></div><div class="feedback" id="feedback" role="status"></div>`,
  );
  document.querySelectorAll("[data-block]").forEach(
    (b) =>
      (b.onclick = () => {
        invalidateTask(2);
        selectedMergeSteps.push(Number(b.dataset.block));
        renderMergePuzzle();
      }),
  );
  select("#clearMerge").onclick = clearMergeSteps;
  select("#mergeCheck").onclick = checkMergedSteps;
}
function renderTerminal() {
  select("#windowTitle").textContent = "Terminal — release / production";
  setWindowContent(
    `<span class="eyebrow">الخطوة الأخيرة / إطلاق المشروع</span><h2>جاهز يوصل للمستخدم؟</h2><p class="description">هذه طرفية داخل اللعبة. راجع حالة المشروع وشغّل الاختبارات ثم نفّذ الإطلاق. اكتب الأوامر أو اضغطها بالأسفل.</p><div class="terminalBox"><div id="terminalLog" class="terminalLog">ATHAR RELEASE CONSOLE\nAll 3 repairs completed.\nType: git status / npm test / deploy\n\n</div><form class="terminalInput" id="terminalForm"><span>athar $</span><input id="command" aria-label="أمر الطرفية" autocomplete="off" spellcheck="false" dir="ltr"></form></div><div class="commandHelp"><button data-command="git status">git status</button><button data-command="npm test">npm test</button><button data-command="deploy">deploy</button></div><div class="feedback" id="feedback" role="status"></div>`,
  );
  releaseTestsPassed = false;
  projectStatusReviewed = false;
  select("#terminalForm").onsubmit = (e) => {
    e.preventDefault();
    runTerminalCommand(select("#command").value);
  };
  document
    .querySelectorAll("[data-command]")
    .forEach((b) => (b.onclick = () => runTerminalCommand(b.dataset.command)));
  select("#command").focus();
}
// Commands simulate the release flow inside the game only.
function runTerminalCommand(raw) {
  const c = raw.trim().toLowerCase();
  select("#command").value = "";
  const log = select("#terminalLog");
  log.textContent += "athar $ " + c + "\n";
  if (c === "git status") {
    projectStatusReviewed = true;
    log.textContent +=
      "✓ Sensitive files excluded.\n✓ Merge conflict resolved.\nReady for tests.\n\n";
    playTone();
  } else if (c === "npm test") {
    if (!projectStatusReviewed) {
      log.textContent += "First review the project: git status\n\n";
      return;
    }
    releaseTestsPassed = true;
    log.textContent += "✓ 3 / 3 tests passed.\nReady to deploy.\n\n";
    playTone(850);
  } else if (c === "deploy") {
    if (!releaseTestsPassed) {
      log.textContent += "Run npm test before deployment.\n\n";
      return;
    }
    if (projectDeployed) return;
    projectDeployed = true;
    log.textContent += "Deploying\n✓ RELEASE SUCCESSFUL\n\nA new folder has arrived.\n";
    select("#osStatus").textContent = "نجح الإطلاق. وصلتك رسالة جديدة.";
    document.querySelectorAll("[data-command]").forEach((b) => (b.disabled = true));
    showFeedback("نجح إطلاق المشروع. رسالة الأثر تنتظرك في مساحة العمل.", true);
    playTone(1100);
    setTimeout(() => {
      closeApp();
      select("#welcome").hidden = true;
      select("#finalFolder").hidden = false;
      select("#finalFolder").focus();
    }, 1100);
  } else log.textContent += "Command not found. Try git status, npm test, or deploy.\n\n";
}
function resetGame() {
  completedTasks = [false, false, false];
  excludedFiles = new Set();
  comparisonOperator = "<";
  selectedMergeSteps = [];
  projectDeployed = false;
  elapsedSeconds = 0;
  releaseTestsPassed = projectStatusReviewed = false;
  select("#finalFolder").hidden = true;
  select("#welcome").hidden = false;
  select("#videoOverlay").hidden = true;
  select("#finalLine").hidden = true;
  select("#windowOverlay").hidden = true;
  select("#video").pause();
  select("#video").currentTime = 0;
  select("#osStatus").textContent = "مساحة العمل جاهزة";
  updateProgress();
}
select("#start").onclick = startGame;
select("#closeWindow").onclick = closeApp;
select("#restart").onclick = restartGame;
select("#fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showToast("يمكن تكبير العرض من قائمة المتصفح.");
  }
};
select("#audio").onclick = toggleSound;
select("#finalFolder").onclick = openFinalVideo;
select("#closeVideo").onclick = closeFinalVideo;
select("#video").onended = () => {
  select("#finalLine").hidden = false;
  select("#finalLine").scrollIntoView({ behavior: "smooth", block: "nearest" });
};
select("#video").onerror = () => showToast("تعذّر تحميل المقطع. تأكد من الاتصال وحاول مجددًا.");
select("#replay").onclick = replayGame;
setInterval(() => {
  if (started && !projectDeployed && !document.hidden) {
    elapsedSeconds++;
    select("#clock").textContent =
      String(Math.floor(elapsedSeconds / 60)).padStart(2, "0") +
      ":" +
      String(elapsedSeconds % 60).padStart(2, "0");
  }
}, 1000);
document.addEventListener("keydown", (e) => {
  const overlay = !select("#videoOverlay").hidden
    ? select("#videoOverlay")
    : !select("#windowOverlay").hidden
      ? select("#windowOverlay")
      : null;
  if (!overlay) return;
  if (e.key === "Escape") {
    if (overlay.id === "videoOverlay") select("#closeVideo").click();
    else closeApp();
  }
  if (e.key === "Tab") {
    const all = [...overlay.querySelectorAll("button:not(:disabled),input,video")].filter(
      (x) => !x.hidden && x.offsetParent !== null,
    );
    const first = all[0],
      last = all.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
});
updateProgress();

// Interaction handlers are separate from the puzzle markup.
function checkProjectFiles() {
  if (excludedFiles.size === 3 && [1, 3, 4].every((i) => excludedFiles.has(i)))
    completeTask(
      0,
      "أحسنت. استبعدت الأسرار والبيانات والحزم. لو سبق رفع سرّ نلغيه ونستبدله أيضًا إضافته إلى .gitignore وحدها لا تمحو تاريخه.",
    );
  else {
    playTone(220);
    showFeedback(
      "باقي ملفات تحتاج مراجعة. نحافظ على الكود وتعريف المشروع ونستبعد الأسرار والبيانات الحساسة والحزم.",
    );
  }
}

function cycleComparisonOperator() {
  invalidateTask(1);
  comparisonOperator = comparisonOperator === "<" ? ">" : comparisonOperator === ">" ? "===" : "<";
  renderCodePuzzle();
}

function runLinkTests() {
  const fn = (a, b) =>
    comparisonOperator === "<" ? a < b : comparisonOperator === ">" ? a > b : a === b;
  const cases = [
    [110, 100, true, "future link"],
    [90, 100, false, "expired link"],
    [100, 100, false, "expires now"],
  ];
  const pass = cases.map(([a, b, expected]) => fn(a, b) === expected);
  select("#tests").innerHTML = cases
    .map(
      (c, i) =>
        `<div class="testrow ${pass[i] ? "pass" : "fail"}"><span>${c[3]}</span><span>${pass[i] ? "✓ PASS" : "✕ FAIL"}</span></div>`,
    )
    .join("");
  if (pass.every(Boolean))
    completeTask(
      1,
      "نجحت الاختبارات الثلاثة. الرابط صالح فقط إذا كان وقت انتهائه أكبر من الوقت الحالي. تغيير صغير لكنه يؤثر في تجربة المستخدم وأمانه.",
    );
  else {
    playTone(220);
    showFeedback("فيه اختبار فاشل. غيّر المقارنة الذهبية وجرّب مرة ثانية.");
  }
}

function clearMergeSteps() {
  invalidateTask(2);
  selectedMergeSteps = [];
  renderMergePuzzle();
}

function checkMergedSteps() {
  if (selectedMergeSteps.length === 3 && selectedMergeSteps.every((v, i) => v === i))
    completeTask(
      2,
      "تم حلّ التعارض. احتفظت بإضافة الفرعين: التحقّق قبل التحديث والتأكيد بعد نجاحه. الدمج الصحيح يحافظ على عمل الفريق.",
    );
  else {
    playTone(220);
    showFeedback(
      "راجع التسلسل: نتحقّق من المدخلات أولًا ثم نحدّث كلمة المرور وبعدها نرسل التأكيد",
    );
  }
}

function startGame() {
  started = true;
  select("#landing").hidden = true;
  select("#desktop").hidden = false;
  select("#scene").style.opacity = ".1";
  document.body.classList.add("playing");
  updateProgress();
  openApp("brief");
}

function restartGame() {
  resetGame();
  openApp("brief");
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  select("#audio").textContent = soundEnabled ? "الصوت: مفتوح" : "الصوت: مغلق";
  select("#audio").setAttribute("aria-pressed", soundEnabled);
  playTone();
}

function openFinalVideo() {
  select("#videoOverlay").hidden = false;
  select("#video")
    .play()
    .catch(() => showToast("اضغط التشغيل لبدء المقطع بالصوت."));
  select("#closeVideo").focus();
}

function closeFinalVideo() {
  select("#video").pause();
  select("#videoOverlay").hidden = true;
  select("#finalFolder").focus();
}

function replayGame() {
  resetGame();
  openApp("brief");
}
