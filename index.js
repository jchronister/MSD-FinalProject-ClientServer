"use strict";

const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const {getReturnObject} = require("./middleware/return-object");
const images = require("./routes/images");
const accounts = require("./routes/accounts");
const fs = require("fs");
// const { isValidUser } = require("./middleware/authentication");
const passDBConnection = require("./middleware/database");
const createHttpError = require("http-errors");

const app = express();


app.use(logger("dev"));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, "public")));




app.use(cors());

// Setup process.env from .env File
require("dotenv").config();

// Send Index File
app.get("/",(req, res) => {
  fs.createReadStream("./static/index.html").pipe(res);
});

// Send Application Setup File
app.get("/admin/setup",(req, res) => {
  fs.createReadStream("./static/setup.html").pipe(res);
});

// Authentication -- Future
// app.use(isValidUser);


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

  // Troubleshoot
  msg = err.message || err;
  
  res.status(err.status || 500).json(getReturnObject(msg, null));

});


app.listen(process.env.PORT || 3000,()=>{
  console.log("application is running on port : " + (process.env.PORT || 3000));
});