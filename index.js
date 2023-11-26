import express from "express";
import cors from "cors";
import { config } from "dotenv";

config({
  path: ".env.local",
});

// eslint-disable-next-line no-undef
const uri = process.env.DB_URI;

const app = express();

// eslint-disable-next-line no-undef
const port = process.env.port || 3000;

app.use(cors());
app.use(express.json());


app.get("/", async (req, res) => {
  res.send("ParcelBee server is Running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
