import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    require: true,
    type: String,
  },
  status: {
    type: String,
    enum: ["admin", "delivery_man", "user"],
    default: "user",
    require: true,
  },
  email: {
    require: true,
    type: String,
    unique: true,
  },
  phone: {
    require: false,
    type: String,
    default: ''
  },
  photo: {
    require: false,
    type: String,
    default: ''
  },
});

const User = mongoose.model("User", userSchema);
export default User;
