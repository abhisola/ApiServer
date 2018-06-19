#include <NewPing.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#define TRIGGER_PIN  D4
#define ECHO_PIN     D3
#define MAX_DISTANCE 100
#define FOOT_TRIGGER_PIN D5
#define FOOT_ECHO_PIN D6
#define FOOT_MAX_DISTANCE 170
#define FOOT_DISTANCE_COUNTING 150

#define WIFI_AP "Awesome_Speed_Shop"//ENTER YOUR SSID HERE
#define WIFI_PASSWORD "khozemaahas" // ENTER YOUR PASSWORD HERE
#define TOKEN "4fu6l8boLku5RKBk4gFC"

bool debug = true;
bool foot_debug = true;
bool FOOT = false;
bool HEAD = true;

int base = 0;
String racknum = "000003";

//Head Count Timers
int stableTime = 0;
int fluxTime = 0;
int realTime = 0;
int stableThreshold = 5000;
int fluxThreshold = 3500;
int realElapsed = 0;
bool stableTimeStarted = false;
bool fluxTimeStarted = false;
bool realTimeStarted = false;

//Foot Count Timers
int foot_stableTime = 0;
int foot_fluxTime = 0;
int foot_stableThreshold = 500;
int foot_fluxThreshold = 500;
int foot_realElapsed = 0;
bool foot_stableTimeStarted = false;
bool foot_fluxTimeStarted = false;
bool foot_realTimeStarted = false;

WiFiClient wifiClient;
PubSubClient client(wifiClient);

char mymqttserver[] = "192.168.1.102";
int status = WL_IDLE_STATUS;
int state;
int status_pin = 12;
int stat_bool = 0;
int head_count = 0;

NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE);
NewPing foot(FOOT_TRIGGER_PIN, FOOT_ECHO_PIN, FOOT_MAX_DISTANCE);
void InitWiFi()
{
  Serial.println("Connecting to AP ...");

  WiFi.begin(WIFI_AP, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to AP");
}
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
   while (!client.connected()) {
    status = WiFi.status();
    if ( status != WL_CONNECTED) {
      WiFi.begin(WIFI_AP, WIFI_PASSWORD);
      while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      Serial.println("Connected to AP");
    }
  
    Serial.print("Connecting to My Target Rack Node ...");
    String SensorName = "HeadCountSensor";
    SensorName += racknum;
    char Sensor[40];
    SensorName.toCharArray(Sensor, 40);
    // Attempt to connect (clientId, username, password)
    if ( client.connect(Sensor, NULL, NULL) ) {
      Serial.println( "[DONE]" );
    } else {
      Serial.print( "[FAILED] [ rc = " );
      Serial.print( client.state() );
      Serial.println( " : retrying in 5 seconds]" );
      // Wait 5 seconds before retrying
      delay( 5000 );
    }
    }
  }

void setup() {
Serial.begin(115200);
  InitWiFi();
  client.setServer( mymqttserver, 1883 );
  client.setCallback(callback);
  if (!client.connected()) {
    reconnect();
  }
}

void startFluxTimer(int now, bool head) {
  if(head) {
      if(!fluxTimeStarted) { 
      fluxTimeStarted = true; 
      fluxTime = now;
    //Serial.println("Flux Timer Started ");
   }
  } else {
    if(!foot_fluxTimeStarted) { 
      foot_fluxTimeStarted = true; 
      foot_fluxTime = now;
    //Serial.println("Foot Flux Timer Started ");
  }
}
}
void stopFluxTimer(int now, bool head) {
  if(head) {
     fluxTimeStarted = false; 
     fluxTime = now;  
    //Serial.println("Stop Flux timer");
  } else {
     foot_fluxTimeStarted = false; 
     foot_fluxTime = now;  
    //Serial.println("Foot Stop Flux timer");
    }
  }


void startStableTimer(int now, bool head) {
  if(head) {
    if(!stableTimeStarted) { 
      stableTimeStarted = true; 
      stableTime = now;
      //Serial.println("Stable Timer Started ");
     }
  } else {
    if(!foot_stableTimeStarted) { 
      foot_stableTimeStarted = true; 
      foot_stableTime = now;
      //Serial.println("Foot Stable Timer Started ");
     }
  }
}
void stopStableTimer(int now, bool head) {
  if(head) {
    stableTimeStarted = false; 
    stableTime = now;
    //Serial.println("Stable Timer Stopped ");
  } else {
    foot_stableTimeStarted = false; 
    foot_stableTime = now;
    //Serial.println("Foot Stable Timer Stopped ");
  }
}

void startRealTimer(int now, bool head) {
  if(head) {
    if(!realTimeStarted) { 
      realTimeStarted = true; 
      realTime = now;
      //Serial.println("Real Timer Started ");
     }
  } else {
     foot_realTimeStarted = true; 
     foot_realElapsed = now;
     //Serial.println("Foot Real Timer Started ");
  }
}
void stopRealTimer(int now, bool head) {
    if(head) {
      realTimeStarted = false; 
       realTime = now;
    }
    else {
      foot_realTimeStarted = false;
      foot_realElapsed = now;
      //Serial.println("Foot Real Timer Stopped ");
    }
}
void sendData() {
  int endTime = millis();
  int timeTaken = endTime - realTime;
  
  Serial.print("Time Taken = ");
  Serial.println(timeTaken);
   // Prepare a JSON payload string
  String payload = "{";
  payload += "\"time\":"; payload += timeTaken;// payload += ",";
  payload += "}";

  // Send payload
  String temp = "headcount/target/"+racknum;
  char topic[50];
  char attributes[100];
  payload.toCharArray( attributes, 100 );
  temp.toCharArray(topic ,50);
  client.publish( topic, attributes );
  Serial.println( attributes );
}
void sendDebugData(int a) {
  Serial.println(a);
  /*String payload = "{";
  payload += "\"distance\":"; payload += a;// payload += ",";
  payload += "}";
  // Send payload
  String temp = "headcount/target/"+racknum+"/debug";
  char topic[50];
  char attributes[100];
  payload.toCharArray( attributes, 100 );
  temp.toCharArray(topic ,50);
  client.publish( topic, attributes );*/
}

void sendFootData() {
   // Prepare a JSON payload string
  String payload = "{";
  payload += "\"traffic\": 1";// payload += ",";
  payload += "}";

  // Send payload
  String temp = "footcount/target/"+racknum;
  char topic[50];
  char attributes[100];
  payload.toCharArray( attributes, 100 );
  temp.toCharArray(topic ,50);
  client.publish( topic, attributes );
  Serial.println( attributes );
}
void sendFootDebugData(int b) {
  //Serial.println(b);
  /*String payload = "{";
  payload += "\"distance\":"; payload += b;// payload += ",";
  payload += "}";
  // Send payload
  String temp = "footcount/target/"+racknum+"/debug";
  char topic[50];
  char attributes[100];
  payload.toCharArray( attributes, 100 );
  temp.toCharArray(topic ,50);
  client.publish( topic, attributes );*/
}

void loop() {
    // put your main code here, to run repeatedly:
  if (!client.connected()) {
    reconnect();
  }
  unsigned long now = millis();
  int a = sonar.ping_cm();
  int b = foot.ping_cm();
  if(debug) sendDebugData(a);
  if(foot_debug) sendFootDebugData(b);
  
  int fluxElapsed = now - fluxTime;
  int stableElapsed = now - stableTime;
  realElapsed = now - realTime;
  if(a > 5) {
    startFluxTimer(now, HEAD);
    stopStableTimer(now, HEAD);
    if(fluxElapsed > fluxThreshold) {
      startRealTimer(now, HEAD);
    }
  }
  if(a == 0) {
      startStableTimer(now, HEAD);
      if(stableElapsed > stableThreshold) {
        stopStableTimer(now, HEAD);
        stopFluxTimer(now, HEAD);
        if(realTimeStarted){
          sendData();
          stopRealTimer(now, HEAD);
          stopFluxTimer(now, HEAD);
          stopStableTimer(now, HEAD); 
        }
      }
  }

   int foot_fluxElapsed = now - foot_fluxTime;
    int foot_stableElapsed = now - foot_stableTime;
  if(b > FOOT_DISTANCE_COUNTING) {
    startFluxTimer(now, FOOT);
    stopStableTimer(now, FOOT);
    if(foot_fluxElapsed > foot_fluxThreshold) {
      startRealTimer(now, FOOT);
    }
  }  
  if(b < FOOT_DISTANCE_COUNTING) {
      startStableTimer(now, FOOT);
      if(foot_stableElapsed > foot_stableThreshold) {
        stopStableTimer(now, FOOT);
        stopFluxTimer(now, FOOT);
        if(foot_realTimeStarted){
          sendFootData();
          stopRealTimer(now, FOOT);
          stopFluxTimer(now, FOOT);
          stopStableTimer(now, FOOT); 
        }
      }
  }
  delay(100);
}
