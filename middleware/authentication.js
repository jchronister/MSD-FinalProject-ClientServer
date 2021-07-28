"use strict";

const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");
const { sendJSON } = require("./return-object");
const bcrypt = require("bcryptjs");

// Sign Data
const signData = (data) => jwt.sign(data, process.env.jwtToken);

module.exports.isValidUser = function (req, res, next) {

  let { authorization: token } = req.headers;

  // Verify Token
  if (token) {
    
    try {
      var decode = jwt.verify(token, process.env.jwtToken);
    } catch {
      return next(createHttpError(400, "Invalid Token"));
    }

    req.db.user = decode;
    return next();

  }

  next(createHttpError(401, "Invalid Token"));
};

module.exports.login = function (req, res, next) {
  // Verify User in Database
  req.db.collection
      .findOne({ [req.db.usernameField]: req.body[req.db.usernameField] })

      .then((data) => {
          // No Username Found
          if (!data) return next(createHttpError(401, "Invalid Username"));
          
          // Verify Password
          if (
              bcrypt.compareSync(
                  req.body[req.db.passwordField],
                  data[req.db.passwordField]
              )
          ) {
              // Send Token
              sendJSON.call(res, null, signData(req.db.tokenFx(data)));
          } else {
              return next(createHttpError(401, "Invalid Password"));
          }
      })
      .catch(next);
};

// Create Username/Password Account
module.exports.createAccount = function (req, res, next) {
  // Setup Default Collection
  if (!req.db.collection) {
      req.db.collection = req.db.db
          .db(process.env.appDBName)
          .collection(process.env.appUsersCollectionName);
  }

  // Check for User in Database
  req.db.collection
      .findOne({ [req.db.usernameField]: req.body[req.db.usernameField] })
      .then((data) => {
          // Username Already Exists
          if (data)
              return next(createHttpError(400, "Username Already Exists"));

          // Hash Password
          req.body[req.db.passwordField] = bcrypt.hashSync(
              req.body[req.db.passwordField],
              12
          );

          // Insert New User
          req.db.collection
              .insertOne(req.body)

              // Login If Successfull
              .then((data) => {
                  if (data.insertedCount === 1) {
                      // Send Token
                      sendJSON.call(
                          res,
                          null,
                          signData(req.db.tokenFx({...data.ops[0], _id: data.insertedId}))

                          
                      );
                  } else {
                      next(
                          createHttpError(
                              500,
                              "Account Creation Error. Please Try Again"
                          )
                      );
                  }
              })
              .catch(next);
      })
      .catch(next);
};