import mongoose from "mongoose";
const { Schema } = mongoose;

const parcelSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    parcel_type: {
      type: String,
      require: true,
    },
    parcel_weight: {
      type: Number,
      require: true,
    },
    receiver_name: {
      type: String,
      require: true,
    },
    receiver_phone: {
      type: String,
      require: true,
    },
    delivery_address: {
      type: String,
      require: true,
    },
    address_latitude: {
      type: Number,
      min: -90,
      max: 90,
      require: true,
    },
    address_longitude: {
      type: Number,
      min: -180,
      max: 180,
      require: true,
    },
    requested_delivery_date: {
      type: Date,
      require: true,
    },
    delivery_date: {
      type: Date,
    },
    approximate_delivery_date: {
      type: Date,
    },
    price: {
      type: Number,
      require: true,
    },
    delivery_man: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    booking_status: {
      type: String,
      enum: ["pending", "on_the_way", "delivered", "returned", "cancelled"],
      default: "pending",
      require: true,
    },
    payment_status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      require: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    review: {
      type: String,
      default: "",
    },
    review_giving_date: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: "booking_date",
      updatedAt: "last_updated_date",
    },
  }
);

const Parcel = mongoose.model("Parcel", parcelSchema);
export default Parcel;
