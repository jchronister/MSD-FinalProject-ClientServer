"use strict";

const http = require("http");
const https = require("https");


module.exports.getServiceToUse = function (search) {

  // Poll Service Registry
  return request(search)

  // Verify Successful Response
  .then( ({status, data, error}) => {

    if (status === "Success") {
    
      if (data.length) { 

        // Return Service Info
        return data[0];
      
      } else {
        throw "Service Not Found";
      }

    } else {

      // Service Not Found
      throw "Service Not Available: " + error;

    }

  });
 
};


/** HTTP POST Request
 * @param {object} search - Search Data
 * @returns {Promise} HTTP Request Promise
*/
function request (search) {

  return new Promise((resolve, reject) => {

    const options = {
      method: "GET",
      headers: {'content-type': 'application/json'}
    };

    /** HTTP Request Handler Function
     * @param {Object} response - Server Response Object
     * @returns {undefined}
    */
    const responseHandler = function(response) {
      
      let data = [];

      response.on('data', function (chunk) {
        data = [...data, chunk];
      });

      response.on('end', function () {
        resolve(JSON.parse(Buffer.concat(data).toString()));
      });


    };

    // Query Parameters
    const searchQuery = Object.entries(search)

      // Format
      .reduce((a, [key, value], i) => a + (i ? "&" : "?") + key + "=" + value, "")

      // Remove Spaces
      .replace(" ", "%20");

    
    // Request
    const url = process.env.MICROSERVICE_REGISTRY_URL + searchQuery;
    const req = (/^https/.test(url) ? https : http).request(process.env.MICROSERVICE_REGISTRY_URL + searchQuery, options, responseHandler);
    req.on("error", reject);
    req.end();

  });

}





