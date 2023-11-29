import express from "express";
import cors from "cors";
import { config } from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.model.js";
import Parcel from "./models/Parcel.model.js";

config({
  path: ".env.local",
});

const app = express();

// eslint-disable-next-line no-undef
const port = process.env.port || 3000;

// eslint-disable-next-line no-undef
mongoose.connect(process.env.DB_URI);

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("ParcelBee server is Running");
});

app.get("/users", async (req, res) => {
  try {
    return res.send(await User.find(req.query));
  } catch (err) {
    console.error(err);
  }
});

app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    const result = await user.save();
    return res.status(201).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      res.status(400).send(err.message);
    } else {
      res.status(409).send("User already exists");
    }
  }
});

app.get("/parcels", async (req, res) => {
  try {
    return res.send(await Parcel.find(req.query).populate('user'));
  } catch (err) {
    console.error(err);
  }
});

app.post("/parcels", async (req, res) => {
  try {
    const parcel = new Parcel(req.body);
    const result = await parcel.save();
    return res.status(201).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      res.status(400).send(err.message);
    } else {
      res.status(500).send("Something went wrong");
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
