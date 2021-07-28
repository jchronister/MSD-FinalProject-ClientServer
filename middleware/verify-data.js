"use strict";

const {ObjectId} = require("mongodb");
const createError = require('http-errors');

/** Checks for Invalid/Missing Data
* @param {any} value - Value to Check
* @returns {boolean} Is Data Valid true/false
*/
  let isInvalid = function (value) {
  return value === undefined || value === "";
};


/** Checks Object for Invalid/Missing Properties
* @param {string []} aryRequired - Array of Required Properties
* @param {object} objValues - Object to Check
* @param {function} next - Next Function for Errors
* @param {object []} aryRename - Rename Array for User { key: Rename }
* @returns {boolean} true if Data Missing
*/
const isMissing = function (aryRequired, objValues, next, aryRename) {

  // Filter Out Valid Data
  let missing = aryRequired.filter(n => isInvalid(objValues[n]));

  // Format Missing Data Return String
  if (missing.length) {

    // Rename
    missing = missing.map(n => aryRename && aryRename[n] || n);

    next(createError(400, "Missing Data for: " + missing.join(", ")));
    return true;
  }
  return false;
};

/** Checks Object for Extra Properties
* @param {String []} aryAllowed - Array of Allowed Properties
* @param {Object} objValues - Object to Check
* @param {function} next - Next Function for Errors
* @returns {boolean} true if Extra Data
*/
const isExtra = function(aryAllowed, objValues, next) {

  // Filter Out Allowed Data
  const extra = Object.keys(objValues).filter(n => !aryAllowed.includes(n));

  // Format Missing Data Return String
  if (extra.length) {
    next(createError(400, "Extra Invalid Data Included: " + extra.join(", ")));
    return true;
  }
  return false;
};



/** Checks Object for Valid Data if Key Exists
* @param {String} key - Object Property
* @param {Object} objValues - Object to Check
* @param {String []} valueAry - Array of Allowable Values
* @param {function} next - Next Function for Errors
* @returns {boolean} true if Valid
*/
const isValid = function(key, objValues, valueAry, next) {

  // If Key Exists AND Value in Valid
  if (objValues[key] && !valueAry.includes(objValues[key])) {
    next(createError(400, "Invalid Data for '" + key + "' Needs to be: " + valueAry.join(", ")));
    return false;
  }
  return true;
};

/** Checks Object to See if Data Exists
* @param {Object} objValues - Object to Check
* @param {function} next - Next Function for Errors
* @returns {boolean} true if Data Exists
*/
const doesDataExist = function(objValues, next) {

  // If Key Exists AND Value in Valid
  let keys = Object.keys(objValues);

  if (keys.length === 0) {
    next(createError(400, "No Data Provided"));
    return false;
  }

  // Check for Valid Data
  let invalid = keys.filter(n => isInvalid(objValues[n]));

   if (invalid.length) {
    next(createError(400, "Invalid Data for keys: " + invalid.join(", ")));
    return false;
  } 
  return true;
};

/** Convert String to Mongo Id
* @param {string} str - String to Convert
* @param {function} next - Next Function for Errors
* @returns {objectID} - MongoDB _id
*/
const getMongoId = function (str, next) {

  try {

    return ObjectId(str);

  } catch (err) {

    next(createError(400, "Invalid Mongo _id: " + str));

  }

};


/** Verify Mongo Id & Replaces Object Property with ObjectID
* @param {object} property - Object Property to Check
* @param {string} name - Property Name
* @param {function} next - Next Function for Errors
* @returns {undefined}
*/
const verifyMongoId = function (property, name, next) {

  const id = getMongoId(property[name], next);

  if (id) {
    property[name] = id;
    return true;
  }

};


module.exports = {
  isMissing,
  isExtra,
  isValid,
  getMongoId,
  doesDataExist,
  verifyMongoId
};