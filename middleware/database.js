"use strict";

// Mongo DB
const { MongoClient } = require("mongodb");
let db, mongoClient;

/** Create and Store Database Connection. Logs Errors to Console
 * @param {function} fx - Callback Function (Database as Argument)
 * @param {function} next - Express Next Function
 * @returns {undefined}
 */
function connectToMongoDatabase(fx, next) {

  const uri = process.env.MongoDatabaseConnectionString;

  if (!mongoClient) mongoClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  
  mongoClient.connect()
    .then(function (client) {
        db = client;
        fx(client);
    })
    .catch(error => next(error.messge || error));

}

/** Pass Database Connection Reference & Info to Route Handlers
 *   @param {object} req - Request Object
 *   @param {object} res - Response Object
 *   @param {function} next - Next Function
 *   @returns {undefined}
 */
let passDBConnection = function (req, res, next) {
  
    // Object to Attach to Request
    let dbInfo = {
        db: db.db(process.env.appDBName),
        collection: "",
        collectionName: "",
        id: null,
        baseUrl: "",
        user: null,
        username: "",
        role: "",
        tokenFx: ({ _id, username, name, address, city, state, zip, phone, email }) => 
        ({ _id, username, name, address, city, state, zip, phone, email }),  
        usernameField: "email",
        passwordField: "password",
    };

    // Attach Info and Continue
    req.db = dbInfo;
    return next();
};

// Connect to Database and Pass Reference with Request
module.exports = function (req, res, next) {

    // Pass DB Reference / Connect If Needed
    if (db) {
        passDBConnection(req, res, next);
    } else {
        connectToMongoDatabase(() => passDBConnection(req, res, next), next);
    }
};
