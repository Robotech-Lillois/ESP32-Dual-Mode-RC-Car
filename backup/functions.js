/*// ----------------- CONSTANTES -----------------
const ANGLE_MILIEU = 90;      // Neutre
const AMPLITUDE = 45;          // ±45° visuel et servo
const ANGLE_GAUCHE = ANGLE_MILIEU - AMPLITUDE;
const ANGLE_DROITE = ANGLE_MILIEU + AMPLITUDE;

let old_angle = ANGLE_MILIEU;
let old_accel = 0;
let reverse_mode = 0;
let isDragging = false;
let controlMode = "tactile"; // tactile | logitech | gyro
let gyroOffset = 0;           // pour calibrage

// ----------------- ELEMENTS -----------------
let volant, angleDisplay, curseur, reverseDiv, accelDisplay, switchBtn, calibrateBtn;

document.addEventListener("DOMContentLoaded", () => {
  volant = document.querySelector(".volant_svg");
  angleDisplay = document.getElementById("debug-angle");
  curseur = document.getElementById("curseur");
  accelDisplay = document.getElementById("debug-accel") || document.createElement("div");
  reverseDiv = document.querySelector(".recule_drive");
  switchBtn = document.getElementById("switch-mode");
  calibrateBtn = document.getElementById("calibrate-gyro");

  if (!document.getElementById("debug-accel")) {
    accelDisplay.id = "debug-accel";
    reverseDiv.parentNode.insertBefore(accelDisplay, reverseDiv.nextSibling);
  }

  // ----- SWITCH MODE -----
  switchBtn.addEventListener("click", () => {
    if (controlMode === "tactile") controlMode = "logitech";
    else if (controlMode === "logitech") controlMode = "gyro";
    else controlMode = "tactile";
    switchBtn.textContent = `Mode: ${controlMode.charAt(0).toUpperCase() + controlMode.slice(1)}`;

    // Remise à zéro si tactile
    if (controlMode === "tactile") {
      stopDrag();
    }
  });

  // ----- CALIBRAGE GYRO -----
  if (calibrateBtn) {
    calibrateBtn.addEventListener("click", () => {
      gyroOffset = 0; // reset offset
    });
  }

  // ----- VOLANT -----
  volant.addEventListener("mousedown", startDrag);
  volant.addEventListener("touchstart", startDrag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchend", stopDrag);
  volant.addEventListener("touchcancel", stopDrag);
  document.addEventListener("mousemove", rotateVolant);
  document.addEventListener("touchmove", rotateVolant);

  // ----- ACCELERATEUR (toujours tactile) -----
  curseur.addEventListener("input", updateAcceleration);
  document.addEventListener("mouseup", stopAcceleration);
  document.addEventListener("touchend", stopAcceleration);
  document.addEventListener("touchcancel", stopAcceleration);

  // ----- DRIVE / REVERSE -----
  reverseDiv.addEventListener("click", toggleReverse);

  // ----- GYROSCOPE -----
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", handleGyro);
  }
});

// ----------------- FONCTIONS VOLANT -----------------
function startDrag(e) {
  if (controlMode !== "tactile") return;
  e.preventDefault();
  isDragging = true;
}

function stopDrag() {
  if (!isDragging && controlMode === "tactile") return;
  isDragging = false;
  volant.style.transform = `rotate(0deg)`;
  setAngle(ANGLE_MILIEU);
}

function rotateVolant(e) {
  if (!isDragging || controlMode !== "tactile") return;

  const rect = volant.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

  const dx = clientX - cx;
  const dy = cy - clientY;

  let angle = Math.atan2(dx, dy) * 180 / Math.PI;
  angle = Math.max(-AMPLITUDE, Math.min(AMPLITUDE, angle));

  volant.style.transform = `rotate(${angle}deg)`;
  setAngle(ANGLE_MILIEU + angle);
}

function setAngle(angle) {
  angleDisplay.textContent = "Angle volant: " + Math.round(angle);
  if (Math.abs(old_angle - angle) > 1) {
    old_angle = angle;
    sendSteeringAngle(Math.round(angle));
  }
}

// ----------------- ACCELERATEUR -----------------
function updateAcceleration() {
  const accel = Number(curseur.value);
  accelDisplay.textContent = "Accélération: " + accel + "%";
  if (Math.abs(old_accel - accel) > 1) {
    old_accel = accel;
    sendAccelerationPercentage(accel);
  }
}

function stopAcceleration() {
  curseur.value = 0;
  accelDisplay.textContent = "Accélération: 0%";
  old_accel = 0;
  sendAccelerationPercentage(0);
}

// ----------------- DRIVE / REVERSE -----------------
function toggleReverse() {
  reverse_mode = reverse_mode ? 0 : 1;

  const driveEl = reverseDiv.querySelector("#drive");
  const reverseEl = reverseDiv.querySelector("#reverse");

  if (driveEl) driveEl.style.display = reverse_mode ? "none" : "block";
  if (reverseEl) reverseEl.style.display = reverse_mode ? "block" : "none";

  sendReverse(reverse_mode);
}

// ----------------- ENVOI REQUETES -----------------
async function sendSteeringAngle(angle) {
  await fetch(`/volant?angle=${angle}`);
}

async function sendAccelerationPercentage(accel) {
  await fetch(`/pedale?accelPercent=${accel}`);
}

async function sendReverse(mode) {
  await fetch(`/reverse_drive?reverse=${mode}`);
}

// ----------------- GAMEPAD -----------------
function updateGamepad() {
  if (controlMode !== "logitech") {
    requestAnimationFrame(updateGamepad);
    return;
  }

  const gp = navigator.getGamepads()[0];
  if (!gp) {
    requestAnimationFrame(updateGamepad);
    return;
  }

  let angle = ANGLE_MILIEU + gp.axes[0] * AMPLITUDE;
  angle = Math.max(ANGLE_GAUCHE, Math.min(ANGLE_DROITE, angle));
  setAngle(angle);

  if (gp.buttons[0].pressed && reverse_mode === 0) toggleReverse();
  else if (!gp.buttons[0].pressed && reverse_mode === 1) toggleReverse();

  requestAnimationFrame(updateGamepad);
}

function handleGyro(e) {
  if (controlMode !== "gyro") return;

  const alpha = e.alpha; // rotation autour axe vertical du téléphone
  const debug = document.getElementById("debug-gamma");
  debug.textContent = "Alpha (rotation verticale) : " + (alpha?.toFixed(1) ?? "--") + "°";

  const GYRO_AMPLITUDE = 90; // amplitude max
  let tilt = alpha - gyroOffset; // appliquer l'offset

  if (tilt > 180) tilt -= 360;
  if (tilt < -180) tilt += 360;

  //tilt = Math.max(-GYRO_AMPLITUDE, Math.min(GYRO_AMPLITUDE, tilt));

  volant.style.transform = `rotate(${tilt}deg)`;
  setAngle(ANGLE_MILIEU + tilt);
}

// Fonction pour calibrer le centre
function calibrateGyro() {
  if (typeof lastAlpha !== "undefined") {
    gyroOffset = lastAlpha;
    console.log("Calibration gyro : offset =", gyroOffset);
  }
}

// Sauvegarde de la dernière valeur alpha pour calibration
let lastAlpha = 0;
window.addEventListener("deviceorientation", (e) => {
  lastAlpha = e.alpha;
});









// ----------------- EVENT GAMEPAD -----------------
window.addEventListener("gamepadconnected", () => {
  console.log("Gamepad connecté !");
  updateGamepad();
});

window.addEventListener("gamepaddisconnected", () => {
  console.log("Gamepad déconnecté !");
});

*/


// ----------------- CONSTANTES -----------------
const ANGLE_MILIEU = 90;      // Neutre
const AMPLITUDE = 45;          // ±45° visuel et servo
const ANGLE_GAUCHE = ANGLE_MILIEU - AMPLITUDE;
const ANGLE_DROITE = ANGLE_MILIEU + AMPLITUDE;

let old_angle = ANGLE_MILIEU;
let old_accel = 0;
let reverse_mode = 0;
let isDragging = false;
let controlMode = "tactile"; // tactile | logitech | gyro
let gyroOffset = 0;           // pour calibrage
let lastAlpha = 0;
let prevButtonState = false;  // pour toggle reverse gamepad

// ----------------- ELEMENTS -----------------
let volant, angleDisplay, curseur, reverseDiv, accelDisplay, switchBtn, calibrateBtn;

document.addEventListener("DOMContentLoaded", () => {
  volant = document.querySelector(".volant_svg");
  angleDisplay = document.getElementById("debug-angle");
  curseur = document.getElementById("curseur");
  accelDisplay = document.getElementById("debug-accel") || document.createElement("div");
  reverseDiv = document.querySelector(".recule_drive");
  switchBtn = document.getElementById("switch-mode");
  calibrateBtn = document.getElementById("calibrate-gyro");

  if (!document.getElementById("debug-accel")) {
    accelDisplay.id = "debug-accel";
    reverseDiv.parentNode.insertBefore(accelDisplay, reverseDiv.nextSibling);
  }

  // ----- SWITCH MODE -----
  switchBtn.addEventListener("click", () => {
    if (controlMode === "tactile") controlMode = "logitech";
    else if (controlMode === "logitech") controlMode = "gyro";
    else controlMode = "tactile";
    switchBtn.textContent = `Mode: ${controlMode.charAt(0).toUpperCase() + controlMode.slice(1)}`;

    if (controlMode === "tactile") stopDrag();
  });

  // ----- CALIBRAGE GYRO -----
  if (calibrateBtn) {
    calibrateBtn.addEventListener("click", calibrateGyro);
  }

  // ----- VOLANT -----
  volant.addEventListener("mousedown", startDrag);
  volant.addEventListener("touchstart", startDrag);
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchend", stopDrag);
  volant.addEventListener("touchcancel", stopDrag);
  document.addEventListener("mousemove", rotateVolant);
  document.addEventListener("touchmove", rotateVolant);

  // ----- ACCELERATEUR (toujours tactile) -----
  curseur.addEventListener("input", updateAcceleration);
  document.addEventListener("mouseup", stopAcceleration);
  document.addEventListener("touchend", stopAcceleration);
  document.addEventListener("touchcancel", stopAcceleration);

  // ----- DRIVE / REVERSE -----
  reverseDiv.addEventListener("click", toggleReverse);

  // ----- GYROSCOPE -----
  if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", (e) => {
      lastAlpha = e.alpha;
      handleGyro(e);
    });
  }

  // ----- GAMEPAD -----
  window.addEventListener("gamepadconnected", () => {
    console.log("Gamepad connecté !");
    updateGamepad();
  });
  window.addEventListener("gamepaddisconnected", () => {
    console.log("Gamepad déconnecté !");
  });

  // Démarrage boucle gamepad si déjà connecté
  if (navigator.getGamepads()[0]) updateGamepad();
});

// ----------------- FONCTIONS VOLANT -----------------
function startDrag(e) {
  if (controlMode !== "tactile") return;
  e.preventDefault();
  isDragging = true;
}

function stopDrag() {
  if (!isDragging && controlMode === "tactile") return;
  isDragging = false;
  setAngle(ANGLE_MILIEU);
  volant.style.transform = `rotate(0deg)`; // optionnel si tu veux retour visuel
}

function rotateVolant(e) {
  if (!isDragging || controlMode !== "tactile") return;

  const rect = volant.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

  const dx = clientX - cx;
  const dy = cy - clientY;

  let angle = Math.atan2(dx, dy) * 180 / Math.PI;
  angle = Math.max(-AMPLITUDE, Math.min(AMPLITUDE, angle));

  volant.style.transform = `rotate(${angle}deg)`;
  setAngle(ANGLE_MILIEU + angle);
}

function setAngle(angle) {
  angleDisplay.textContent = "Angle volant: " + Math.round(angle);
  if (Math.abs(old_angle - angle) > 1) {
    old_angle = angle;
    sendSteeringAngle(Math.round(angle));
  }
}

// ----------------- ACCELERATEUR -----------------
function updateAcceleration() {
  const accel = Number(curseur.value);
  setAcceleration(accel);
}

function setAcceleration(accel) {
  accelDisplay.textContent = "Accélération: " + Math.round(accel) + "%";
  if (Math.abs(old_accel - accel) > 1) {
    old_accel = accel;
    sendAccelerationPercentage(Math.round(accel));
  }
}

function stopAcceleration() {
  curseur.value = 0;
  setAcceleration(0);
}

// ----------------- DRIVE / REVERSE -----------------
function toggleReverse() {
  reverse_mode = reverse_mode ? 0 : 1;

  const driveEl = reverseDiv.querySelector("#drive");
  const reverseEl = reverseDiv.querySelector("#reverse");

  if (driveEl) driveEl.style.display = reverse_mode ? "none" : "block";
  if (reverseEl) reverseEl.style.display = reverse_mode ? "block" : "none";

  sendReverse(reverse_mode);
}

// ----------------- ENVOI REQUETES -----------------
async function sendSteeringAngle(angle) {
  try { await fetch(`/volant?angle=${angle}`); } catch(e){console.error(e);}
}

async function sendAccelerationPercentage(accel) {
  try { await fetch(`/pedale?accelPercent=${accel}`); } catch(e){console.error(e);}
}

async function sendReverse(mode) {
  try { await fetch(`/reverse_drive?reverse=${mode}`); } catch(e){console.error(e);}
}

// ----------------- GAMEPAD -----------------
function updateGamepad() {
  const gp = navigator.getGamepads()[0];
  
  if (!gp || controlMode !== "logitech") {
    requestAnimationFrame(updateGamepad);
    return;
  }

  // VOLANT (axe horizontal)
  let angle = ANGLE_MILIEU + (gp.axes[0] || 0) * AMPLITUDE;
  angle = Math.max(ANGLE_GAUCHE, Math.min(ANGLE_DROITE, angle));
  setAngle(angle);

  // REVERSE (bouton 0)
  const reverseButton = gp.buttons[0];
  if (reverseButton.pressed && !prevButtonState) toggleReverse();
  prevButtonState = reverseButton.pressed;

  // ACCELERATEUR (gâchette droite)
  let accel = 0;
  if (gp.buttons[7] !== undefined) accel = gp.buttons[7].value * 100;
  else if (gp.axes[5] !== undefined) accel = ((gp.axes[5]+1)/2) * 100;
  accel = Math.max(0, Math.min(100, accel));
  setAcceleration(accel);

  requestAnimationFrame(updateGamepad);
}

// ----------------- GYROSCOPE -----------------
function handleGyro(e) {
  if (controlMode !== "gyro") return;

  const alpha = e.alpha;
  const debug = document.getElementById("debug-gamma");
  debug.textContent = "Alpha (rotation verticale) : " + (alpha?.toFixed(1) ?? "--") + "°";

  let tilt = alpha - gyroOffset;
  if (tilt > 180) tilt -= 360;
  if (tilt < -180) tilt += 360;

  const GYRO_AMPLITUDE = 90;
  tilt = Math.max(-GYRO_AMPLITUDE, Math.min(GYRO_AMPLITUDE, tilt));

  volant.style.transform = `rotate(${tilt}deg)`;
  setAngle(ANGLE_MILIEU + tilt);
}

function calibrateGyro() {
  if (typeof lastAlpha !== "undefined") {
    gyroOffset = lastAlpha;
    console.log("Calibration gyro : offset =", gyroOffset);
  }
}
