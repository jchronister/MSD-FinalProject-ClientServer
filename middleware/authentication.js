"use strict";

const jwt = require("jsonwebtoken");
const createHttpError = require("http-errors");
const { sendJSON } = require("./return-object");
const bcrypt = require("bcryptjs");

const inValidDataHTTPCode = 200;

/** Setup Default Database Collection
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {function} next - Express next Function
 * @returns {undefined}
*/
module.exports.setDBCollection = function (req, res, next) {

  // Setup Default Collection
  req.db.collection = req.db.db.collection(process.env.appDBUsersCollectionName);
  next();

};


/** Sign Data
* @param {any} data - Data to Sign
* @returns {string} JWT Token
*/
const signData = (data) => jwt.sign(data, process.env.jwtToken);


/** Validate JWT Token
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {function} next - Express next Function
 * @returns {undefined}
*/
module.exports.isValidUser = function (req, res, next) {

  let { authorization: token } = req.headers;

  // Verify Token
  if (token) {
    
    try {
      var decode = jwt.verify(token, process.env.jwtToken);
    } catch {
      return next(createHttpError(inValidDataHTTPCode, "Invalid Token"));
    }

    req.db.user = decode;
    return next();

  }

  next(createHttpError(inValidDataHTTPCode, "Invalid Token"));
};


/** Login
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {function} next - Express next Function
 * @returns {undefined}
*/
module.exports.login = function (req, res, next) {

  // Verify User in Database
  req.db.collection
    .findOne({ [req.db.usernameField]: req.body[req.db.usernameField] })

    .then((data) => {

        // No Username Found
        if (!data) return next(createHttpError(inValidDataHTTPCode, "Invalid Username"));
        
        // Verify Password
        if (bcrypt.compareSync(req.body[req.db.passwordField], data[req.db.passwordField])) {
            
          // Send Token
            sendJSON.call(res, null, signData(req.db.tokenFx(data)));

        } else {
            return next(createHttpError(inValidDataHTTPCode, "Invalid Password"));
        }
    })
    .catch(next);
};


/** Create Username/Password Account
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {function} next - Express next Function
 * @returns {undefined}
*/
module.exports.createAccount = function (req, res, next) {

  // Check for User in Database
  req.db.collection

    .findOne({ [req.db.usernameField]: req.body[req.db.usernameField] })

    .then((data) => {

      // Username Already Exists
      if (data) {
        return next(createHttpError(inValidDataHTTPCode, "Username Already Exists"));
      }

      // Hash Password
      req.body[req.db.passwordField] = 
        bcrypt.hashSync(req.body[req.db.passwordField], 12);

      // Insert New User
      req.db.collection
        .insertOne(req.body)

        // Login If Successfull
        .then((data) => {

          if (data.insertedCount === 1) {

            // Send Token
            sendJSON.call(res, null, signData(req.db.tokenFx({...data.ops[0], _id: data.insertedId})));
              
          } else {
            next(createHttpError(inValidDataHTTPCode, "Account Creation Error. Please Try Again"));
          }
        }).catch(next);

      }).catch(next);
};