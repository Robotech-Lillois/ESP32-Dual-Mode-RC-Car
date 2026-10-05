#include <ESP32Servo.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>

#include "wificonnect.h"

// ---------- ANGLE VOLANT A CHANGER AVEC CELUI DU .JS ----------
#define MIN_ANGLE 30
#define MAX_ANGLE 150

// ---------- 1 ou 0 en on fonction du sens de rotation du servomoteur ----------
#define SERVO_MOTEUR_SENS 1

// ---------- Activer le mode debug pour tous les printf utiles ----------
#define DEBUG 0 

// Serveur web
AsyncWebServer server(80); // Port 80

// PIN Servo moteur
Servo servo;
static const int servoPin = 2;

// PIN Moteur 1 et 2
int pinMOT1AVNT = 18; // Tout ou rien
int pinMOT1ARR = 5; // Tout ou rien
int pwmENABLEMOT1 = 17; // Puissance d'activation (0 à 100%)

int pinMOT2AVNT = 26; // Tout ou rien
int pinMOT2ARR = 27; // Tout ou rien
int pwmENABLEMOT2 = 33; // Puissance d'activation (0 à 100%)

// Paramètre PWM 
int pwmChannel = 3;
int frequence = 30000;
int resolution = 8;
int reculer = 0;

void setup() {
  // ----------------- Serial -----------------
  Serial.begin(115200);

  // ----------------- Servo -----------------
  servo.attach(servoPin);

  // ----------------- Moteur -----------------

  // Moteur 1
  pinMode(pwmENABLEMOT1, OUTPUT);
  pinMode(pinMOT1AVNT, OUTPUT);
  pinMode(pinMOT1ARR, OUTPUT);

  digitalWrite(pinMOT1AVNT, HIGH); // Position marche avant activé
  digitalWrite(pinMOT1ARR, LOW);

  // Moteur 2
  pinMode(pwmENABLEMOT2, OUTPUT);
  pinMode(pinMOT2AVNT, OUTPUT);
  pinMode(pinMOT2ARR, OUTPUT);

  digitalWrite(pinMOT2AVNT, HIGH); // Position marche avant activé
  digitalWrite(pinMOT2ARR, LOW);

  // ----------------- PWM -----------------
  // Permet d'activer la pwm contrôlant les moteurs
  ledcSetup(pwmChannel, frequence, resolution);

  ledcAttachPin(pwmENABLEMOT1, pwmChannel);
  ledcAttachPin(pwmENABLEMOT2, pwmChannel);

  // ----------------- Wifi -----------------
  WiFi.disconnect(true);
  WiFi.persistent(false);

  if (DEBUG) // ! DEBUG
    Serial.printf("\nSetting Access point : %s\n", ssid);

  WiFi.softAPConfig(local_IP, gateway, subnet);
  WiFi.softAP(ssid, password);

  if (DEBUG) // ! DEBUG
  {
    Serial.print("IP address : ");
    Serial.println(WiFi.softAPIP());
  }

  WiFi.setAutoConnect(true);

  // ----------------- LittleFS -----------------
  if (!LittleFS.begin(true)) { // true pour formater si nécessaire
    Serial.println("Erreur d'initialisation de LittleFS");
    return;
  }

  if (DEBUG) // ! DEBUG
    Serial.println("LittleFS monté avec succès.");

  File root = LittleFS.open("/");

  if (!root) {
    Serial.println("Erreur : impossible d'ouvrir la racine de LittleFS");
    return;
  }

  // Verifie l'ensemble des fichiers présents sur la racine
  File file = root.openNextFile();

  if (!file)
    Serial.println("Aucun fichier trouvé dans LittleFS."); // Veuillez les téléverser avec "Upload Filesystem Image)
  else
    while (file) {
      if (DEBUG) // ! DEBUG
        Serial.printf("File : %s\n", file.name());

      file.close();
      file = root.openNextFile();
    }

  // ----------------- Server -----------------
  // Fichiers sources
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(LittleFS, "/index.html", "text/html");
    });

  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(LittleFS, "/style.css", "text/css");
    });

  server.on("/functions.js", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(LittleFS, "/functions.js", "text/javascript");
    });

  // Mes fonctions
  server.on("/reverse_drive", HTTP_GET, [](AsyncWebServerRequest* request) {
    if (request->hasParam("reverse")) {
      reculer = request->getParam("reverse")->value().toInt();

      if (DEBUG) // ! DEBUG
        Serial.printf("%s\n", reculer ? "Reculer" : "Avancer");

      if (reculer) {
        digitalWrite(pinMOT1AVNT, LOW);
        digitalWrite(pinMOT2AVNT, LOW);
        digitalWrite(pinMOT1ARR, HIGH);
        digitalWrite(pinMOT2ARR, HIGH);
      }
      else {
        digitalWrite(pinMOT1ARR, LOW);
        digitalWrite(pinMOT2ARR, LOW);
        digitalWrite(pinMOT1AVNT, HIGH);
        digitalWrite(pinMOT2AVNT, HIGH);
      }
      request->send(200, "text/plain", "OK");
    }
    else
      request->send(400, "text/plain", "Paramètre 'reverse' manquant");
    });

  server.on("/volant", HTTP_GET, [](AsyncWebServerRequest* request) {
    if (request->hasParam("angle")) {
      int angle = request->getParam("angle")->value().toInt();

      if (angle >= MIN_ANGLE && angle <= MAX_ANGLE) {   // Vérifie que l'angle est dans les limites
        if (SERVO_MOTEUR_SENS) // Inverser sens, depend du servomoteur
          angle = 180 - angle;

        if (DEBUG) // ! DEBUG
          Serial.printf("Angle volant: %d\n", angle);

        servo.write(angle); // Déplace le servomoteur à l'angle calculé
        request->send(200, "text/plain", "OK");
      }
      else
        request->send(400, "text/plain", "Angle invalide, doit être compris entre 30 et 150");
    }
    else
      request->send(400, "text/plain", "Paramètre 'angle' manquant");
    });

  server.on("/pedale", HTTP_GET, [](AsyncWebServerRequest* request) {
    if (request->hasParam("accelPercent")) {

      int accelPercent = request->getParam("accelPercent")->value().toInt();

      if (accelPercent >= 0 && accelPercent <= 100) {   // Vérifie que le pourcent est dans les limites

        int duty = map(accelPercent, 0, 100, 100, 255);

        if (DEBUG) // ! DEBUG
          Serial.printf("Pourcent acceleration : %d\nPourcent duty après map : %d\n", accelPercent, duty);

        ledcWrite(pwmChannel, duty);

        request->send(200, "text/plain", "OK");
      }
      else
        request->send(400, "text/plain", "Acceleration invalide");
    }
    else
      request->send(400, "text/plain", "Paramètre 'accelPercent' manquant");
    });

  server.begin();

  if (DEBUG) // ! DEBUG
    Serial.println("Serveur actif!");

  servo.write(90); // Déplace le servomoteur au milieu pour l'initialiser au mileu
}

void loop() {
}