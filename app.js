const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const heightInput = qs('#height-value');
const heightUnit = qs('#height-unit');
const weightInput = qs('#weight-value');
const weightUnit = qs('#weight-unit');
const calculateBtn = qs('#calculate-btn');
const resetBtn = qs('#reset-btn');
const errorArea = qs('#error-area');
const bmiOutput = qs('#bmi-output');
const bmiCategory = qs('#bmi-category');
const tipsArea = qs('#health-tips');
const historyEmpty = qs('#history-empty');
const historyBody = qs('#history-body');
const form = qs('#bmi-form');
const a2hsBtn = qs('#a2hs-btn');
const a2hsModal = qs('#a2hs-instructions');
const a2hsDismiss = qs('#a2hs-dismiss');
const toastEl = qs('#toast');

let deferredPrompt = null;
let engaged = false;

const toMeters = (value, unit) => {
  const v = Number(value);
  if (!Number.isFinite(v)) return NaN;
  return unit === 'cm' ? v / 100 : v;
};

const toKilograms = (value, unit) => {
  const v = Number(value);
  if (!Number.isFinite(v)) return NaN;
  return unit === 'lbs' ? v * 0.45359237 : v;
};

const calculateBMI = (weightKg, heightM) => {
  const h2 = heightM * heightM;
  if (h2 <= 0) return NaN;
  return weightKg / h2;
};

const classifyBMI = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
};

const categoryLabel = (cat) => {
  if (cat === 'underweight') return 'Underweight';
  if (cat === 'normal') return 'Normal';
  if (cat === 'overweight') return 'Overweight';
  return 'Obese';
};

const tipsFor = (cat) => {
  if (cat === 'underweight') {
    return 'Consider nutrient-dense meals and strength training. Consult a professional.';
  }
  if (cat === 'normal') {
    return 'Maintain balanced diet, regular activity, and adequate sleep.';
  }
  if (cat === 'overweight') {
    return 'Increase activity, focus on whole foods, monitor portion sizes.';
  }
  return 'Seek guidance for a personalized plan; prioritize gradual, sustainable changes.';
};

const showError = (msg) => {
  errorArea.textContent = msg;
  errorArea.classList.add('show');
};
const clearError = () => {
  errorArea.textContent = '';
  errorArea.classList.remove('show');
};

const setCategoryBadge = (cat) => {
  bmiCategory.className = `badge ${cat}`;
  bmiCategory.textContent = categoryLabel(cat);
};

const saveHistory = (entry) => {
  const key = 'bmiHistory';
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  current.unshift(entry);
  localStorage.setItem(key, JSON.stringify(current.slice(0, 50)));
};
const loadHistory = () => {
  const key = 'bmiHistory';
  return JSON.parse(localStorage.getItem(key) || '[]');
};
const renderHistory = () => {
  const rows = loadHistory();
  historyBody.innerHTML = '';
  if (!rows.length) {
    historyEmpty.style.display = 'block';
    return;
  }
  historyEmpty.style.display = 'none';
  const frag = document.createDocumentFragment();
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    const tdDate = document.createElement('td');
    const tdHeight = document.createElement('td');
    const tdWeight = document.createElement('td');
    const tdBmi = document.createElement('td');
    const tdCat = document.createElement('td');
    tdDate.textContent = new Date(r.ts).toLocaleString();
    tdHeight.textContent = `${r.hv} ${r.hu}`;
    tdWeight.textContent = `${r.wv} ${r.wu}`;
    tdBmi.textContent = r.bmi.toFixed(1);
    tdCat.textContent = categoryLabel(r.cat);
    tr.append(tdDate, tdHeight, tdWeight, tdBmi, tdCat);
    frag.appendChild(tr);
  });
  historyBody.appendChild(frag);
};

const validateInputs = (hv, hu, wv, wu) => {
  if (hv === '' || wv === '') return 'Height and weight are required';
  const h = Number(hv);
  const w = Number(wv);
  if (!Number.isFinite(h) || !Number.isFinite(w)) return 'Enter valid numbers';
  if (h <= 0 || w <= 0) return 'Values must be greater than zero';
  const heightM = toMeters(h, hu);
  const weightKg = toKilograms(w, wu);
  if (!Number.isFinite(heightM) || !Number.isFinite(weightKg)) return 'Invalid unit conversion';
  if (heightM <= 0) return 'Height must be greater than zero';
  return '';
};

const onCalculate = (ev) => {
  ev.preventDefault();
  clearError();

  const hv = heightInput.value.trim();
  const hu = heightUnit.value;
  const wv = weightInput.value.trim();
  const wu = weightUnit.value;

  console.debug('Calculate clicked', { hv, hu, wv, wu });

  const err = validateInputs(hv, hu, wv, wu);
  if (err) {
    showError(err);
    return;
  }
  const heightM = toMeters(Number(hv), hu);
  const weightKg = toKilograms(Number(wv), wu);
  const bmi = calculateBMI(weightKg, heightM);
  if (!Number.isFinite(bmi)) {
    showError('Could not compute BMI');
    return;
  }

  const bmiRounded = Math.round(bmi * 10) / 10;
  bmiOutput.textContent = bmiRounded.toFixed(1);
  const cat = classifyBMI(bmi);
  setCategoryBadge(cat);
  tipsArea.textContent = tipsFor(cat);
  engaged = true;
  maybeShowInstallOffer();

  saveHistory({
    ts: Date.now(),
    hv: Number(hv),
    hu,
    wv: Number(wv),
    wu,
    bmi: bmiRounded,
    cat,
  });
  renderHistory();
};

const onReset = () => {
  heightInput.value = '';
  weightInput.value = '';
  heightUnit.value = 'm';
  weightUnit.value = 'kg';
  bmiOutput.textContent = '--';
  bmiCategory.className = 'badge';
  bmiCategory.textContent = '--';
  tipsArea.textContent = '';
  clearError();
  heightInput.focus();
};

const onKeySubmit = (ev) => {
  if (ev.key === 'Enter') {
    ev.preventDefault();
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      const evt = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(evt);
    }
  }
};

form.addEventListener('submit', onCalculate);
resetBtn.addEventListener('click', onReset);
qsa('input, select').forEach((el) => el.addEventListener('keydown', onKeySubmit));

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios') && !ua.includes('chrome');
};
const showToast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 2400);
};
const showIosInstructions = () => {
  a2hsModal.classList.add('show');
  a2hsModal.setAttribute('aria-hidden', 'false');
};
const hideIosInstructions = () => {
  a2hsModal.classList.remove('show');
  a2hsModal.setAttribute('aria-hidden', 'true');
};
const maybeShowInstallOffer = () => {
  if (!engaged) return;
  if (isStandalone()) return;
  if (isIOS() && isSafari()) {
    a2hsBtn.hidden = false;
    a2hsBtn.onclick = showIosInstructions;
    return;
  }
  if (deferredPrompt) {
    a2hsBtn.hidden = false;
    a2hsBtn.onclick = async () => {
      a2hsBtn.disabled = true;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;
      a2hsBtn.disabled = false;
      a2hsBtn.hidden = true;
      if (choice.outcome === 'accepted') showToast('Installation started');
      else showToast('Installation dismissed');
    };
  } else {
    a2hsBtn.hidden = false;
    a2hsBtn.onclick = () => {
      showToast('Use browser menu to install');
    };
  }
};

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    console.debug('SW registered');
  }).catch((err) => {
    showError('Service worker registration failed');
    console.error(err);
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  maybeShowInstallOffer();
});
window.addEventListener('appinstalled', () => {
  showToast('Installed successfully');
  a2hsBtn.hidden = true;
});
a2hsDismiss.addEventListener('click', hideIosInstructions);

const runTests = () => {
  const cases = [
    { w: 70, wu: 'kg', h: 1.75, hu: 'm', expect: 22.9 },
    { w: 50, wu: 'kg', h: 160, hu: 'cm', expect: 19.5 },
    { w: 95, wu: 'kg', h: 1.8, hu: 'm', expect: 29.3 },
    { w: 120, wu: 'kg', h: 1.7, hu: 'm', expect: 41.5 },
    { w: 45, wu: 'kg', h: 1.7, hu: 'm', expect: 15.6 },
    { w: 154.324, wu: 'lbs', h: 1.75, hu: 'm', expect: 22.9 },
  ];
  const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const results = cases.map((c) => {
    const kg = toKilograms(c.w, c.wu);
    const m = toMeters(c.h, c.hu);
    const bmi = calculateBMI(kg, m);
    return { got: fmt(bmi), expect: c.expect.toFixed(1) };
  });
  const pass = results.every((r) => r.got === r.expect);
  console.log('BMI test results:', results, 'PASS:', pass);
};

document.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  runTests();
});
