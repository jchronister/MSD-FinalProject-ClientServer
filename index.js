"use strict";

const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const {getReturnObject} = require("./middleware/return-object");
const images = require("./routes/images");
const accounts = require("./routes/accounts");
const fs = require("fs");
const passDBConnection = require("./middleware/database");
const createHttpError = require("http-errors");

// Setup process.env from .env File
require("dotenv").config(); 

// Configuration
const app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(cors());


// Send Index File
app.get("/",(req, res) => {
  fs.createReadStream("./static/index.html").pipe(res);
});

// Send Application Setup File
app.get("/admin/setup",(req, res) => {
  fs.createReadStream("./static/setup.html").pipe(res);
});

// Send Architecture File
app.get("/admin/design",(req, res) => {
  fs.createReadStream("./static/design.html").pipe(res);
});


// Routes
app.use(passDBConnection);
app.use("/images", images);
app.use("/api/v1/accounts", accounts);


// No Routes Found
app.use((req, res, next) => {
  next(createHttpError(404, "Not Found"));
});

// Error Handler
app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars

  // Show Errors in Development Mode
  if (req.app.get("env") === "development") {
    var msg = err.message || err;
  } else {
    msg = "Server Error";
  }

  res.status(err.status || 500).json(getReturnObject(msg, null));

});

// Catch All Error
app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars
  res.send(err.message || err);
});


app.listen(process.env.PORT || 3000,()=>{
  console.log("application is running on port : " + (process.env.PORT || 3000));
});