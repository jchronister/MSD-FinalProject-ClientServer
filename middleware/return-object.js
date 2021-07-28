"use strict";

/** Object to Return to Client
 * @param {Error} err - Error Message
 * @param {Object} data = Data Object
 * @returns {Object} - Object for Client
 */
 module.exports.getReturnObject = function (err, data) {

    // Return Object
    return {
        status: err ? "Failed" : "Success",
        data: err ? null : data,
        error: err || null,
    };
};

/** Send JSON Object to Client (Bind res to Function Call)
 * @param {Error} err - Error Message
 * @param {Object} data = Data Object
 * @returns {undefined}
 */
 module.exports.sendJSON = function (err, data) {
    // Send Response
    this.json(module.exports.getReturnObject(err, data));
};