"use strict";

const { login, createAccount } = require('../middleware/authentication');
const { isMissing } = require('../middleware/verify-data');

const router = require('express')();



// /accounts/login
router.route("/login")
  .post(verifyLoginData, login);

// accounts
router.route("/")
  .post(verifyCreateAccountData, createAccount);


/** Verify Login Data
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @param {function} next Express next Function
 * @returns {undefined}
*/
function verifyLoginData (req, res, next) {

  const [email, password] = ["email", "password"];

  // Verify Info
  if (isMissing([email, password], req.body,next, ["Email", "Password"])) return;

  // Purge Unneeded Data
  req.body = {email: req.body.email, password: req.body.password};

  // Set DB Collection
  req.db.collection = req.db.db.collection(process.env.appDBAccountsCollectionName);

  next();

}


/** Verify Login Data
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @param {function} next Express next Function
 * @returns {undefined}
*/
function verifyCreateAccountData (req, res, next) {

  const fields = [    
    ["address", "Address"],
    ["city", "City"],
    ["email", "Email"],
    ["fullname", "Full Name"],
    ["password", "Password"],
    ["phone", "Phone"],
    ["state", "State"],
    ["username", "Username"],
    ["zip", "Zip"]];

  // Verify Info
  if (isMissing(fields.map(n=>n[0]), req.body,next, fields.map(n=>n[1]))) return;

  // Purge Unneeded Data
  req.body = {
    username: req.body.username,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    zip: req.body.zip,
    phone: req.body.phone,
    email: req.body.email,
    password: req.body.password,
    name: req.body.fullname
  };

  // Set DB Collection
  req.db.collection = req.db.db.collection("users");

  next();

}



module.exports = router;
