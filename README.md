# ESP32 Dual-Mode RC Car (Wi-Fi & RF)

## 📌 Project Overview
This project modernizes a standard RC car by integrating an ESP32 microcontroller to handle dual-mode control operations. It features a custom-built Web/Smartphone interface using WebSockets and gyroscope data, seamlessly backed up by a robust, custom-built hardware remote utilizing the nRF24L01 2.4GHz radio transceiver.

## 🚀 Features
- **Dual-Control Modes:** Switch dynamically between Wi-Fi and Radio control seamlessly.
- **Smartphone Gyroscope Control:** Control the vehicle's steering and throttle by physically tilting a smartphone via a web interface.
- **Real-Time WebSockets:** Low-latency communication between the web client and the ESP32.
- **Custom RF Transmitter:** A scratch-built remote control operating on the nRF24L01 transceiver for fail-safe, low-latency physical control.
- **FreeRTOS Architecture:** Efficient dual-core processing, separating asynchronous network tasks from deterministic hardware polling and motor control.

## 🛠️ Hardware Requirements
**The Vehicle:**
- ESP32 Development Board
- nRF24L01 Wireless Transceiver Module
- Motor Driver (e.g., L298N / TB6612FNG)
- DC Motors & Chassis
- Power Supply (LiPo Battery + Buck Converter)

**The Custom Remote:**
- Microcontroller (e.g., Arduino Nano / ESP32)
- nRF24L01 Wireless Transceiver Module
- Joysticks / Potentiometers

## 🧮 Software Stack
- **Firmware:** C/C++ (Arduino framework / ESP-IDF)
- **RTOS:** FreeRTOS for task and queue management
- **Frontend:** HTML, CSS, JavaScript (DeviceOrientation API for Gyroscope)
- **Communication Protocols:** SPI (Radio), WebSockets (Wi-Fi), PWM (Motors)

## ⚙️ Setup & Installation
1. Clone this repository.
2. Create a `secrets.h` file in the root directory and define your Wi-Fi credentials (this file is ignored by Git for security):
```cpp
   #define WIFI_SSID "your_ssid"
   #define WIFI_PASSWORD "your_password"
```
 3. Upload the frontend files to the ESP32's SPIFFS/LittleFS.
 4. Flash the ESP32 using your preferred IDE.
## 🗺️ Roadmap / Status
 * [ ] Establish Wi-Fi Access Point and basic Web Server
 * [ ] Implement WebSocket communication
 * [ ] Integrate Smartphone Gyroscope data extraction
 * [ ] Build custom nRF24L01 remote transmitter
 * [ ] Implement FreeRTOS Finite State Machine for safe mode switching

