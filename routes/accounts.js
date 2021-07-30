"use strict";

const { login, createAccount, setDBCollection } = require('../middleware/authentication');
const { isMissing } = require('../middleware/verify-data');

const router = require('express')();

// /accounts/login
router.route("/login")
  .post(verifyLoginData, setDBCollection, login);

// accounts
router.route("/")
  .post(verifyCreateAccountData, setDBCollection, createAccount);


/** Verify Login Data
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @param {function} next Express next Function
 * @returns {undefined}
*/
function verifyLoginData (req, res, next) {

  // Username & Password Fields
  const loginInfo = [["email", "Email"], ["password", "Password"]];

  // Verify Info
  if (isMissing(loginInfo.map(n=>n[0]), req.body,next, loginInfo.map(n=>n[1]))) return;

  // Purge Unneeded Data
  req.body = {email: req.body.email, password: req.body.password};

  next();

}


/** Verify Login Data
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @param {function} next Express next Function
 * @returns {undefined}
*/
function verifyCreateAccountData (req, res, next) {

  // Required Fields
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
  req.body = fields.reduce((a, n) => ({...a, [req.body[n][0]]: req.body[n][0]}), {});
  next();

}


module.exports = router;
