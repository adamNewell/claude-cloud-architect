import express from "express";
import axios from "axios";
import { EventEmitter } from "events";

const app = express();
const emitter = new EventEmitter();

// Should match: core-http-route-express (2 routes)
app.get("/users/:id", async (req, res) => { res.json({}); });
app.post("/orders", (req, res) => { res.json({ created: true }); });

// Should match: core-axios-call
const response = await axios.get("https://api.example.com/data");

// Should match: core-event-emit + core-event-subscribe
emitter.emit("order.created", { id: "123" });
emitter.on("payment.received", (data) => console.log(data));

// Should match: core-secret-in-env-hardcoded (DEBT)
const apiKey = "AKIA1234567890EXAMPLE";
