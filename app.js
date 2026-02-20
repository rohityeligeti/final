
/* =========================
   STATE
   ========================= */

let questions = [];
let selectedQuestions = [];
let currentIndex = 0;
let remainingSeconds = 1800;
let timerInterval;

const IMAGE_BASE_PATH = "assets/images/";

/* =========================
   PHASE SYSTEM
   ========================= */

const PHASES = [
  "parked",
  "taxi",
  "departure",
  "enroute",
  "emergency",
  "arrival"
];

const MAX_PER_PHASE = 5;

let currentPhaseIndex = 0;
let selectedQuestionIds = new Set();

/* =========================
   UTILITIES
   ========================= */

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function loadJSON(path) {
  return fetch(path).then(r => r.json());
}

/* =========================
   SCENARIO GENERATOR (UNCHANGED)
   ========================= */

async function generateScenarioData() {
  const [
    registrations,
    depAirports,
    routes,
    runways,
    levels,
    pob,
    startTimes,
    types,
    destinations,
    stands,
    endurance,
    freqSets,
    atis,
    metars,
    tempDew,
    qnh,
    squawk
  ] = await Promise.all([
    loadJSON("data/flight/registrations.json"),
    loadJSON("data/flight/departure_airports.json"),
    loadJSON("data/flight/ats_routes.json"),
    loadJSON("data/flight/runways.json"),
    loadJSON("data/flight/flight_levels.json"),
    loadJSON("data/flight/pob.json"),
    loadJSON("data/flight/start_times.json"),
    loadJSON("data/flight/aircraft_types.json"),
    loadJSON("data/flight/destinations.json"),
    loadJSON("data/flight/stands.json"),
    loadJSON("data/flight/endurance.json"),
    loadJSON("data/frequencies/frequency_sets.json"),
    loadJSON("data/weather/atis.json"),
    loadJSON("data/weather/metar.json"),
    loadJSON("data/weather/temp_dew.json"),
    loadJSON("data/weather/qnh.json"),
    loadJSON("data/weather/squawk.json")
  ]);

  const s = {
    registration: pickRandom(registrations),
    departure: pickRandom(depAirports),
    route: pickRandom(routes),
    runway: pickRandom(runways),
    level: pickRandom(levels),
    pob: pickRandom(pob),
    startTime: pickRandom(startTimes),
    type: pickRandom(types),
    destination: pickRandom(destinations),
    stand: pickRandom(stands),
    endurance: pickRandom(endurance),
    freq: pickRandom(freqSets),
    atis: pickRandom(atis),
    metar: pickRandom(metars),
    tempDew: pickRandom(tempDew),
    qnh: pickRandom(qnh),
    squawk: pickRandom(squawk)
  };

  renderPanels(s);
}

/* =========================
   PANELS (UNCHANGED)
   ========================= */

function renderPanels(s) {
  document.getElementById("flight-info").innerHTML = `
    <b>Flight Information</b><br/>
    Reg: ${s.registration}<br/>
    DEP: ${s.departure}<br/>
    Route: ${s.route}<br/>
    RWY: ${s.runway}<br/>
    FL: ${s.level}<br/>
    POB: ${s.pob}<br/>
    Start: ${s.startTime}
  `;

  document.getElementById("aircraft-info").innerHTML = `
    <b>Aircraft</b><br/>
    Type: ${s.type}<br/>
    DEST: ${s.destination}<br/>
    Stand: ${s.stand}<br/>
    Endurance: ${s.endurance}
  `;

  document.getElementById("frequencies").innerHTML = `
    <b>Frequencies</b><br/>
    Ground: ${s.freq.ground}<br/>
    Tower: ${s.freq.tower}<br/>
    Approach: ${s.freq.approach}<br/>
    Control: ${s.freq.control}
  `;

  document.getElementById("weather").innerHTML = `
    <b>Weather</b><br/>
    ATIS: ${s.atis}<br/>
    METAR: ${s.metar}<br/>
    Temp/Dew: ${s.tempDew}<br/>
    QNH: ${s.qnh}<br/>
    Squawk: ${s.squawk}
  `;
}

/* =========================
   TIMER (UNCHANGED)
   ========================= */

function updateTimer() {
  const m = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const s = String(remainingSeconds % 60).padStart(2, '0');
  document.getElementById("timer").textContent = `${m}:${s}`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) return clearInterval(timerInterval);
    remainingSeconds--;
    updateTimer();
  }, 1000);
}

/* =========================
   PHASE RENDERING
   ========================= */

function renderPhase() {
  const phase = PHASES[currentPhaseIndex];
  const container = document.getElementById("question-selector");

  container.innerHTML = `<h3>Phase: ${phase.toUpperCase()}</h3>`;

  const phaseQuestions = questions.filter(q => q.phase === phase);

  phaseQuestions.forEach(q => {
    const row = document.createElement("div");

    row.innerHTML = `
      <label>
        <input type="checkbox" data-id="${q.id}" data-phase="${phase}">
        ${q.text}
      </label>
    `;

    const checkbox = row.querySelector("input");

    checkbox.checked = selectedQuestionIds.has(q.id);
    checkbox.addEventListener("change", enforcePhaseLimit);

    container.appendChild(row);
  });

  renderPhaseControls(container);
}

function enforcePhaseLimit(event) {
  const phase = event.target.dataset.phase;
  const id = Number(event.target.dataset.id);

  const checked = document.querySelectorAll(
    `input[data-phase="${phase}"]:checked`
  );

  if (checked.length > MAX_PER_PHASE) {
    event.target.checked = false;
    alert(`Maximum ${MAX_PER_PHASE} questions allowed for ${phase}`);
    return;
  }

  if (event.target.checked) selectedQuestionIds.add(id);
  else selectedQuestionIds.delete(id);
}

function renderPhaseControls(container) {
  const controls = document.createElement("div");
  controls.style.marginTop = "20px";

  if (currentPhaseIndex > 0) {
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Previous Phase";
    prevBtn.className = "secondary-btn";
    prevBtn.onclick = () => {
      currentPhaseIndex--;
      renderPhase();
    };
    controls.appendChild(prevBtn);
  }

  if (currentPhaseIndex < PHASES.length - 1) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Phase";
    nextBtn.className = "primary-btn";
    nextBtn.style.marginLeft = "10px";
    nextBtn.onclick = () => {
      currentPhaseIndex++;
      renderPhase();
    };
    controls.appendChild(nextBtn);
  } else {
    const startBtn = document.createElement("button");
    startBtn.textContent = "Start Exam";
    startBtn.className = "primary-btn";
    startBtn.style.marginLeft = "10px";
    startBtn.onclick = startExamFromPhaseSelection;
    controls.appendChild(startBtn);
  }

  container.appendChild(controls);
}

/* =========================
   QUESTION RENDERING (IMPROVED)
   ========================= */

function renderQuestion() {
  if (currentIndex >= selectedQuestions.length) {
    alert("Exam Complete");
    return;
  }

  const q = selectedQuestions[currentIndex];

  document.getElementById("question-text").textContent = q.text;

  const imageEl = document.getElementById("question-image");

  if (q.image) {
    imageEl.src = IMAGE_BASE_PATH + q.image;
    imageEl.style.display = "block";
  } else {
    imageEl.src = "";
    imageEl.style.display = "none";
  }
}

/* =========================
   START EXAM (UPDATED)
   ========================= */

async function startExamFromPhaseSelection() {
  selectedQuestions = questions.filter(q =>
    selectedQuestionIds.has(q.id)
  );

  if (!selectedQuestions.length) {
    alert("Select at least one question");
    return;
  }

  document.getElementById("pre-exam").classList.add("hidden");
  document.getElementById("exam-area").classList.remove("hidden");

  await generateScenarioData();
  renderQuestion();
  startTimer();
}

/* =========================
   EXAM NAVIGATION
   ========================= */

document.getElementById("next-btn").onclick = () => {
  currentIndex++;
  renderQuestion();
};

document.getElementById("skip-btn").onclick = () => {
  currentIndex++;
  renderQuestion();
};

/* =========================
   LOAD QUESTIONS
   ========================= */

async function loadQuestions() {
  questions = await loadJSON("data/questions.json");

  /* CRITICAL: questions.json MUST contain phase */

  renderPhase();
}

/* =========================
   INIT
   ========================= */

loadQuestions();
updateTimer();