#include <Arduino.h>
#include <ArduinoJson.h>

// Constants
const int LED_PIN = 13;
const int BAUD_RATE = 115200;
const int SETUP_TIMEOUT = 5000;  // 5 seconds
const int BLINK_COUNT = 5;
const int BLINK_DELAY = 200;  // milliseconds
const int HEARTBEAT_INTERVAL = 1000;  // milliseconds
const int STATUS_CHECK_INTERVAL = 5000;  // 5 seconds
const String FIRMWARE_VERSION = "1.1";

// Chip structure
struct Chip {
  String id;
  String name;
  int pin;
  bool isOnline;
};

// Global variables
bool isSetupComplete = false;
unsigned long lastHeartbeatTime = 0;
unsigned long lastStatusCheckTime = 0;
bool isServerOnline = false;
Chip chips[3];  // Assuming we have 3 chips as per the JSON

void setup() {
  Serial.begin(BAUD_RATE);
  pinMode(LED_PIN, OUTPUT);

  // Initialize chips
  chips[0] = {"ldpc1", "LDPC Chip 1", 2, false};
  chips[1] = {"ldpc2", "LDPC Chip 2", 3, false};
  chips[2] = {"ldpc3", "LDPC Chip 3", 4, false};

  for (const auto& chip : chips) {
    pinMode(chip.pin, OUTPUT);
    digitalWrite(chip.pin, LOW);
  }

  // Wait for serial connection or timeout
  unsigned long startTime = millis();
  while (!Serial && millis() - startTime < SETUP_TIMEOUT) {
    // Wait for serial port to connect
  }
}

void setChipStatus(const String& chipId, bool isOnline) {
  for (auto& chip : chips) {
    if (chip.id == chipId) {
      chip.isOnline = isOnline;
      digitalWrite(chip.pin, isOnline ? HIGH : LOW);
      break;
    }
  }
}

void blinkLED(int count, int delayTime) {
  for (int i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayTime);
    digitalWrite(LED_PIN, LOW);
    delay(delayTime);
  }
}

void sendJsonMessage(const String& type, const String& content = "") {
  DynamicJsonDocument doc(128);
  doc["type"] = type;
  if (content.length() > 0) {
    doc["content"] = content;
  }
  serializeJson(doc, Serial);
  Serial.println();
  Serial.flush();
}

void runTest(int testId, const String& chipId) {
  sendJsonMessage("test_started", String(testId) + " " + chipId);
  blinkLED(BLINK_COUNT, BLINK_DELAY);
  for (int i = 1; i <= 10; i++) {
    DynamicJsonDocument resultDoc(128);
    resultDoc["testId"] = testId;
    resultDoc["chipId"] = chipId;
    resultDoc["count"] = i;
    serializeJson(resultDoc, Serial);
    Serial.println();
    Serial.flush();
    delay(1000);
  }
  // Send test completion message
  DynamicJsonDocument completeDoc(128);
  completeDoc["type"] = "test_completed";
  completeDoc["testId"] = testId;
  completeDoc["chipId"] = chipId;
  serializeJson(completeDoc, Serial);
  Serial.println();
  Serial.flush();
}

void processCommand(const String& command) {
  Serial.println("\nReceived command: " + command);
  Serial.flush();
  if (command.startsWith("TEST")) {
    int spaceIndex = command.indexOf(' ');
    if (spaceIndex != -1) {
      int testId = command.substring(4, spaceIndex).toInt();
      String chipId = command.substring(spaceIndex + 1);
      if (testId > 0) {
        Serial.println("Running test with ID: " + String(testId) + " on chip: " + chipId);
        Serial.flush();
        runTest(testId, chipId);
      } else {
        Serial.println("Invalid test ID");
        Serial.flush();
      }
    } else {
      Serial.println("Invalid TEST command format");
      Serial.flush();
    }
  } else if (command == "STATUS") {
  } else {
    Serial.println("Unknown command. Use 'TEST<id> <chipId>' to run a test or 'STATUS' to check chip status.");
    Serial.flush();
  }
}

void sendHeartbeat() {
  unsigned long currentTime = millis();
  if (currentTime - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    sendJsonMessage("heartbeat");
    lastHeartbeatTime = currentTime;
  }
}


void sendChipStatus() {
  DynamicJsonDocument doc(256);
  JsonArray chipArray = doc.createNestedArray("chips");
  for (const auto& chip : chips) {
    JsonObject chipObj = chipArray.createNestedObject();
    chipObj["id"] = chip.id;
    chipObj["status"] = chip.isOnline ? "online" : "offline";
  }
  serializeJson(doc, Serial);
  Serial.println();
  Serial.flush();
}

void checkServerStatus() {
  unsigned long currentTime = millis();
  if (currentTime - lastStatusCheckTime >= STATUS_CHECK_INTERVAL) {
    sendJsonMessage("status_check");
    lastStatusCheckTime = currentTime;
  }
}

void loop() {
  if (!isSetupComplete) {
    Serial.println("Teensy 4.1 is ready for testing!");
    Serial.println("Firmware version: " + FIRMWARE_VERSION);
    Serial.flush();
    isSetupComplete = true;
  }

  sendHeartbeat();
  checkServerStatus();

  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command.startsWith("CHIP_STATUS")) {
      int spaceIndex = command.indexOf(' ');
      if (spaceIndex != -1) {
        String chipId = command.substring(spaceIndex + 1, command.indexOf(' ', spaceIndex + 1));
        String status = command.substring(command.lastIndexOf(' ') + 1);
        setChipStatus(chipId, status == "ONLINE");
      }
    } else if (command == "SERVER_ONLINE") {
      isServerOnline = true;
      digitalWrite(LED_PIN, HIGH);
    } else if (command == "SERVER_OFFLINE") {
      isServerOnline = false;
      digitalWrite(LED_PIN, LOW);
    } else {
      processCommand(command);
    }
  }
}