const express = require('express');
const mongoose = require('mongoose');
const port = 8989;
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: "*",
  })
);
const connectionString = "mongodb://127.0.0.1:27017/compfi";
mongoose
  .connect(connectionString)
  .then((res) => console.log("database Connected"))
    .catch((err) => console.log("Erroe:" + err));
  const mainRoutes = require("./route");
const { urlencoded } = require('express');
app.use("/", mainRoutes);
app.listen(port, (err) => {
  if (err) console.log(err);
  else console.log(`Work on ${port}`);
});