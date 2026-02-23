import * as mqtt from "mqtt";
import * as awsIot from "aws-iot-device-sdk-v2";
import { iotshadow } from "aws-iot-device-sdk-v2";

// Should match: iot-mqtt-connect
const client = mqtt.connect("mqtts://endpoint.iot.region.amazonaws.com");
const device = new awsIot.mqtt.MqttClient();

// Should match: iot-mqtt-subscribe
client.subscribe("device/+/telemetry");
client.subscribe("#");  // Should match: iot-mqtt-wildcard-antipattern

// Should match: iot-mqtt-publish
client.publish("device/sensor-1/telemetry", JSON.stringify({ temp: 22.5 }), { qos: 0 });

// Should match: iot-device-shadow
const shadowClient = new iotshadow.IotShadowClient(connection);
await shadowClient.publishGetNamedShadow({ thingName: "device-001", shadowName: "reported" }, 1);
await shadowClient.publishUpdateNamedShadow({ thingName: "device-001", shadowName: "reported", state: {} }, 1);
