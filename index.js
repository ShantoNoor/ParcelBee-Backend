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

app.get("/home_stats", async (req, res) => {
  try {
    const r = await Promise.all([
      Parcel.countDocuments(),
      Parcel.countDocuments({
        booking_status: "delivered",
      }),
      User.countDocuments(),
    ]);

    const result = {
      booked: r[0],
      delivered: r[1],
      registered: r[2],
    };

    res.send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/users", async (req, res) => {
  try {
    return res.send(await User.find(req.query));
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
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
  const data = {};
  if (req?.body?.name) data.name = req.body.name;
  if (req?.body?.phone) data.phone = req.body.phone;
  if (req?.body?.status) data.status = req.body.status;
  if (req?.body?.photo) data.photo = req.body.photo;

  try {
    const result = await User.updateOne(
      { _id: req.body._id },
      {
        $set: data,
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

app.get("/users_stats", async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        $match: {
          status: "user",
        },
      },
      {
        $lookup: {
          from: "parcels",
          localField: "_id",
          foreignField: "user",
          as: "product_details",
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          booked: { $size: "$product_details" },
          total_price: {
            $cond: {
              if: { $eq: [{ $size: "$product_details" }, 0] },
              then: 0,
              else: {
                $sum: "$product_details.price",
              },
            },
          },
        },
      },
      {
        $skip: 5 * req.query.page,
      },
      {
        $limit: 5,
      },
    ]);

    const total_count = await User.countDocuments({ status: "user" });

    return res.send({
      data: result,
      total_count,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/delivery_man_stats", async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        $match: {
          status: "delivery_man",
        },
      },
      {
        $lookup: {
          from: "parcels",
          localField: "_id",
          foreignField: "delivery_man",
          as: "product_details",
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          delivered: {
            $cond: {
              if: { $isArray: "$product_details" },
              then: {
                $size: {
                  $filter: {
                    input: "$product_details",
                    cond: { $eq: ["$$this.booking_status", "delivered"] },
                  },
                },
              },
              else: 0,
            },
          },
          avg_rating: {
            $cond: {
              if: { $ne: [{ $size: "$product_details" }, 0] },
              then: {
                $avg: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$product_details",
                        cond: { $ne: ["$$this.rating", 0] },
                      },
                    },
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.rating", null] },
                        then: 0,
                        else: "$$this.rating",
                      },
                    },
                  },
                },
              },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          phone: 1,
          delivered: 1,
          avg_rating: { $ifNull: ["$avg_rating", 0] },
        },
      },
    ]);

    return res.send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/delivery_man_top_five", async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        $match: {
          status: "delivery_man",
        },
      },
      {
        $lookup: {
          from: "parcels",
          localField: "_id",
          foreignField: "delivery_man",
          as: "product_details",
        },
      },
      {
        $project: {
          name: 1,
          photo: 1,
          delivered: {
            $cond: {
              if: { $isArray: "$product_details" },
              then: {
                $size: {
                  $filter: {
                    input: "$product_details",
                    cond: { $eq: ["$$this.booking_status", "delivered"] },
                  },
                },
              },
              else: 0,
            },
          },
          avg_rating: {
            $cond: {
              if: { $ne: [{ $size: "$product_details" }, 0] },
              then: {
                $avg: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$product_details",
                        cond: { $ne: ["$$this.rating", 0] },
                      },
                    },
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.rating", null] },
                        then: 0,
                        else: "$$this.rating",
                      },
                    },
                  },
                },
              },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          photo: 1,
          delivered: 1,
          avg_rating: { $ifNull: ["$avg_rating", 0] },
        },
      },
      {
        $sort: {
          delivered: -1,
          avg_rating: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    return res.send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/graph_stats", async (req, res) => {
  try {
    const result = await Parcel.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%m-%d-%Y",
              date: { $toDate: "$_id" },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          x: "$_id",
          y: "$count",
        },
      },
    ]);
    return res.send(result);
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
    const { booking_status, start, end, ...query } = req.query;
    if (booking_status && booking_status !== "all")
      query.booking_status = booking_status;
    if (start && end) {
      query.requested_delivery_date = { $gte: start, $lte: end };
    } else if (start) {
      query.requested_delivery_date = { $gte: start };
    } else if (end) {
      query.requested_delivery_date = { $lte: end };
    }

    return res.send(await Parcel.find(query).populate("user"));
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
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
  // eslint-disable-next-line no-unused-vars
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
