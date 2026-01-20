// Basit "hücre" sistemi: Konumu 0.001 derece karelere böler (~100m civarı)
const CELL_SIZE = 0.001;

let watchId = null;
let myLat = null, myLon = null;
let myScore = 0;

// Sahiplik verisi (localStorage): { "latIdx:lonIdx": "me" }
const storeKey = "warGameOwnership";

function getOwnership() {
  try { return JSON.parse(localStorage.getItem(storeKey)) || {}; }
  catch { return {}; }
}
function setOwnership(obj) {
  localStorage.setItem(storeKey, JSON.stringify(obj));
}

function cellIndex(lat, lon) {
  const latIdx = Math.floor(lat / CELL_SIZE);
  const lonIdx = Math.floor(lon / CELL_SIZE);
  return `${latIdx}:${lonIdx}`;
}

function prettyCell(cellId) {
  const [a,b] = cellId.split(":");
  return `Hücre(${a}, ${b})`;
}

function updateUI() {
  const posEl = document.getElementById("pos");
  const cellEl = document.getElementById("cell");
  const scoreEl = document.getElementById("score");
  const ownedEl = document.getElementById("owned");

  if (myLat == null) {
    posEl.textContent = "—";
    cellEl.textContent = "—";
  } else {
    posEl.textContent = `${myLat.toFixed(6)}, ${myLon.toFixed(6)}`;
    const id = cellIndex(myLat, myLon);
    cellEl.textContent = prettyCell(id);
  }

  const own = getOwnership();
  const ownedCount = Object.values(own).filter(v => v === "me").length;

  scoreEl.textContent = myScore;
  ownedEl.textContent = ownedCount;

  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  if (myLat == null) return;

  const centerLatIdx = Math.floor(myLat / CELL_SIZE);
  const centerLonIdx = Math.floor(myLon / CELL_SIZE);

  const own = getOwnership();

  // 2x2 grid basit, istersen 3x3 yaparız
  const cells = [
    [centerLatIdx, centerLonIdx],
    [centerLatIdx, centerLonIdx + 1],
    [centerLatIdx + 1, centerLonIdx],
    [centerLatIdx + 1, centerLonIdx + 1],
  ];

  for (const [la, lo] of cells) {
    const id = `${la}:${lo}`;
    const owner = own[id] || "neutral";

    const div = document.createElement("div");
    div.className = "tile " + (owner === "me" ? "mine" : owner === "enemy" ? "enemy" : "neutral");
    div.textContent = owner === "me" ? "✅ Senin Üs" : owner === "enemy" ? "❌ Düşman" : "⚪ Boş";
    grid.appendChild(div);
  }
}

function claimCurrentCell() {
  if (myLat == null) return;

  const id = cellIndex(myLat, myLon);
  const own = getOwnership();

  if (own[id] === "me") {
    alert("Burası zaten senin 😄 Komutanım aynı yere bayrak dikiyorsun!");
    return;
  }

  // Basit düşman simülasyonu: %20 ihtimalle hücre 'enemy' olsun
  if (!own[id] && Math.random() < 0.2) {
    own[id] = "enemy";
  }

  if (own[id] === "enemy") {
    // savaş!
    const win = Math.random() < 0.55; // şans
    if (win) {
      own[id] = "me";
      myScore += 15;
      alert("⚔️ Çatışma kazandın! Bölge SENİN!");
    } else {
      myScore = Math.max(0, myScore - 5);
      alert("💥 Kaybettin! Geri çekil. (Skor -5)");
    }
  } else {
    own[id] = "me";
    myScore += 10;
    alert("🏴 Bölge ele geçirildi! (+10 skor)");
  }

  setOwnership(own);
  updateUI();
}

function startGPS() {
  if (!navigator.geolocation) {
    alert("Bu cihaz konum desteklemiyor 😢");
    return;
  }

  document.getElementById("claimBtn").disabled = false;

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      myLat = pos.coords.latitude;
      myLon = pos.coords.longitude;
      updateUI();
    },
    (err) => {
      alert("Konum alınamadı: " + err.message);
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
  );
}

document.getElementById("startBtn").addEventListener("click", startGPS);
document.getElementById("claimBtn").addEventListener("click", claimCurrentCell);

updateUI();
