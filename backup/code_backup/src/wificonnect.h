#ifndef WIFI_CONNECT_H
#define WIFI_CONNECT_H

#include "WiFi.h"

// Set your Static IP address
IPAddress local_IP(192, 168, 4, 2);

IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

const char* ssid = "Wifi_Voiture1"; // A modif pour voiture 2
const char* password = "piratech1";

#endif