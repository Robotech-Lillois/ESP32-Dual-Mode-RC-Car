// ! Ne pas en tenir compte
let old_angle = 0,
  new_angle = 0;
let old_accel = 0,
  new_accel = 0;

let reverse_activated = 0;
let isReverseClick = 0;
// !

// ---------- ANGLE D ----------
const ANGLE_MILIEU = 83;
// ! 84 degres Voiture 1, a revoir

// ---------- ANGLE VOLANT A CHANGER AVEC CELUI DU .CPP ----------
const ANGLE_MIN = 30;
const ANGLE_MAX = 150;

// ---------- DEBUG ----------
const DEBUG = true;

const PRECISION_VOLANT = 1; // Precision en degrès, compromis avec rapidite système et précision...
const PRECISION_ACCEL = 2; // Precision en pourcent, compromis avec rapidite système et précision...

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------- LE VOLANT ----------------------------
  const volant_pos = document.querySelector(".volant_svg");

  let rotationAngle = 0;
  let isMouseDownOnVolant = false;

  // Débute la rotation du volant
  function startRotationVolant(event) {
    event.preventDefault();
    isMouseDownOnVolant = true;
  }
  // Arrête la rotation du volant
  function stopRotationVolant() {
    if (isMouseDownOnVolant) {
      isMouseDownOnVolant = false;
      volant_pos.style.transform = `rotate(0)`;
      rotationAngle = ANGLE_MILIEU;
      sendSteeringAngle(rotationAngle);
    }
  }
  // Calcul de la rotation puuis ensuite envoie avec fonction adéquat
  function moveRotationVolant(event) {
    if (isMouseDownOnVolant) {
      let deltaX, deltaY;

      const rect = volant_pos.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // TODO : A revoir car seul un doigt detecter :/
      if (event.type === "touchmove") {
        // ! A TEST
        const { clientX, clientY } = event.targetTouches[0];
        deltaX = clientX - centerX;
        deltaY = clientY - centerY;

        console.log("Doigt sur volant : ");
        console.log(event.targetTouches[0]);
        console.log(clientX);
        console.log(clientY);
        // !
      } else {
        deltaX = event.clientX - centerX;
        deltaY = event.clientY - centerY;
      }

      // Calculez l'angle avec atan2
      rotationAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 180;

      rotationAngle = Math.round(rotationAngle); // Arrondi important sinon précision inutile

      // Limite d'angle
      if (ANGLE_MIN > rotationAngle || rotationAngle > 270) {
        rotationAngle = ANGLE_MIN;
      } else if (ANGLE_MIN < rotationAngle && rotationAngle > ANGLE_MAX) {
        rotationAngle = ANGLE_MAX;
      }

      // Corrige l'offset de l'angle pour l'affichage
      new_angle = rotationAngle - 90;

      // Rotation volant
      volant_pos.style.transform = `rotate(${new_angle}deg)`;

      if (
        old_angle != new_angle &&
        Math.abs(new_angle - old_angle) > PRECISION_VOLANT
      ) {
        old_angle = new_angle;
        sendSteeringAngle(rotationAngle);
      }
    }
  }

  // Appuie souris sur volant
  volant_pos.addEventListener("mousedown", startRotationVolant);
  volant_pos.addEventListener("touchstart", startRotationVolant);

  // Relachement de toutes les variables mousedown
  document.addEventListener("mouseup", stopRotationVolant);
  volant_pos.addEventListener("touchend", stopRotationVolant);

  // Si la souris bouge dans la page
  document.addEventListener("mousemove", moveRotationVolant);
  volant_pos.addEventListener("touchmove", moveRotationVolant);

  // ---------------------------- REVERSE / DRIVE ----------------------------
  const recule_drive = document.querySelector(".recule_drive_svg");

  // Action
  recule_drive.addEventListener("mousedown", function () {
    isReverseClick = 1;
  });

  recule_drive.addEventListener("touchstart", function () {
    isReverseClick = 1;
  });

  recule_drive.addEventListener("mouseup", reverseClick);
  recule_drive.addEventListener("touchend", reverseClick);

  // ---------------------------- ACCELERATEUR ----------------------------
  // TODO : Mettre un svg d'une pedale d'accelerateur qui se rempli au fur et a mesure
  const curseur = document.getElementById("curseur");

  // Curseur TEMPORAIRE
  curseur.addEventListener("input", function () {
    const new_accel = Number(curseur.value);

    if (
      Math.abs(old_accel - new_accel) > PRECISION_ACCEL &&
      old_accel != new_accel
    ) {
      old_accel = new_accel;
      sendAccelerationPercentage(new_accel);
    }
  });

  curseur.addEventListener("mouseup", stopAcceleration);
  curseur.addEventListener("touchend", stopAcceleration);
});

// Fonction à utiliser pour envoyer le pourcentage d'accélération
async function sendAccelerationPercentage(accelPercent) {
  const response = await fetch(`/pedale?accelPercent=${accelPercent}`);
  if (response.ok) {
    if (DEBUG) console.log("Acceleration envoyé : " + accelPercent);
  } else {
    console.error("Erreur lors de l'envoi de l'acceleration");
  }
}
// Fonction à utiliser pour arreter d'accélérer
async function stopAcceleration() {
  const curseur = document.getElementById("curseur");
  curseur.value = 0;
  old_accel = 0;
  sendAccelerationPercentage(0);
}

// Fonction à utiliser pour envoyer l'angle de direction
async function sendSteeringAngle(angle) {
  if (DEBUG) console.log("Angle envoyé : " + angle);
  const response = await fetch(`/volant?angle=${angle}`);
  if (response.ok) {
    if (DEBUG) console.log("Angle receptionné : " + angle);
  } else {
    console.error("Erreur lors de l'envoi de l'angle");
  }
}

// Fonction pour changer l'affichage D en R et réciproquement
async function toggleDisplay() {
  const driveElement = this.querySelector("#drive");
  const reverseElement = this.querySelector("#reverse");

  if (driveElement.style.display == "block") {
    driveElement.style.display = "none";
    reverseElement.style.display = "block";
  } else {
    driveElement.style.display = "block";
    reverseElement.style.display = "none";
  }
}

// Fonction pour aller soit en avant, soit en arrière
async function reverseClick(event) {
  event.preventDefault();
  if (isReverseClick) {
    isReverseClick = 0;
    toggleDisplay.call(this);

    if (reverse_activated > 0) reverse_activated = 0;
    else reverse_activated = 1;

    const response = await fetch(`/reverse_drive?reverse=${reverse_activated}`);

    if (response.ok) {
      if (DEBUG) console.log("Reception" + reverse_activated);
    } else {
      console.error("Erreur lors de l'envoi de la commande");
    }
  }
}

async function updateFromGamepad() {
  const gamepads = navigator.getGamepads();
  if (!gamepads) return;

  const gamepad = gamepads[0]; // Prend le premier périphérique (volant)
  if (!gamepad) return;

  // Récupération des axes et boutons
  const volantAngle = gamepad.axes[0] * 90; // Convertir [-1,1] en [-90,90]
  const acceleration = (1 - gamepad.axes[2]) * 100; // Convertir [-1,1] en [0,100]
  const reverseButton = gamepad.buttons[0].pressed; // Exemple: bouton X pour marche arrière

  // Envoi des valeurs SI nécessaire
  if (Math.abs(old_angle - volantAngle) > PRECISION_VOLANT) {
    old_angle = volantAngle;
    sendSteeringAngle(volantAngle);
  }

  if (Math.abs(old_accel - acceleration) > PRECISION_ACCEL) {
    old_accel = acceleration;
    sendAccelerationPercentage(acceleration);
  }

  // Gestion du mode marche arrière (toggle)
  if (reverseButton && !isReverseClick) {
    isReverseClick = 1;
    reverseClick(new Event("click")); // Simule un clic
  } else if (!reverseButton) {
    isReverseClick = 0;
  }

  // Rafraîchir les données
  requestAnimationFrame(updateFromGamepad);
}

// Lancer la récupération
window.addEventListener("gamepadconnected", () => {
  console.log("Volant connecté !");
  updateFromGamepad();
});

window.addEventListener("gamepaddisconnected", () => {
  console.log("Volant déconnecté !");
});
