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
  return res.send("ParcelBee server is Running");
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
      return res.status(400).send(err.message);
    } else {
      return res.status(409).send("User already exists");
    }
  }
});

app.put("/users", async (req, res) => {
  try {
    const result = await User.updateOne(
      { _id: req.body._id },
      {
        $set: {
          name: req.body.name,
          phone: req.body.phone,
          status: req.body.status,
          photo: req.body.photo,
        },
      }
    );
    return res.status(200).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/parcels", async (req, res) => {
  try {
    const { booking_status, ...query } = req.query;
    if (booking_status && booking_status !== "all")
      query.booking_status = booking_status;
    return res.send(await Parcel.find(query).populate("user"));
  } catch (err) {
    console.error(err);
  }
});

app.post("/parcels", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    await User.updateOne(
      { _id: req.body.user },
      { $set: { phone: req.body.phone } }
    );
    const parcel = new Parcel(req.body);
    const result = await parcel.save();
    await session.commitTransaction();

    return res.status(201).send(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.put("/parcels/:id", async (req, res) => {
  const { _id, user, name, email, phone, ...rest } = req.body;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    await User.updateOne({ _id: user }, { $set: { phone: phone } });
    const result = await Parcel.updateOne({ _id: _id }, { $set: { ...rest } });
    await session.commitTransaction();
    return res.status(200).send(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
