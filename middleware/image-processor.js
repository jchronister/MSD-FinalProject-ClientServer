"use strict";

const http = require("http");
const https = require("https");
const { getServiceToUse } = require("./service-finder");


/** Verify File Extension is Image - Does Not Scan File
 * @param {string} filename - File Name
 * @returns {boolean} Is Image
*/
module.exports.imageFileExtensionOk = function (filename) {

  const fileSplit = filename.split(".");

  const extension = fileSplit[fileSplit.length - 1].toLowerCase();
  
  const imageExtensions = [
    "jpg", "jpeg", "jpe", "jif", "jfif", "jfi", //JPG 
    "png", //PNG
    "webp", //WEBP
    "gif", //GIF
    "gif", //AVIF
    "tiff", "tif", //TIFF
    "raw", "arw", "cr2", "nrw", "k25", //RAW
    "svg", "svgz", //SVG
  ];

  return imageExtensions[imageExtensions.indexOf(extension)];

};

/** Get Image Scaler Endpoint
 * @returns {Promise} Resolves to Imagescaler Endpoint
*/
module.exports.getImageScaler = function () {

  const imageScalerInfo =  {identity: "jc.imagescaler.thumbnail Image Scaler 1"};

  return getServiceToUse(imageScalerInfo).then(({endpoint}) => {
  
  return endpoint;
});

};  



/** HTTP Request
 * @param {string} url - HTTP Endpoint
 * @param {object} body - Data to Send
 * @returns {Promise} HTTP Request Resolve to Response
*/
module.exports.httpRequest = function (url, body) {

    const options = { 
        
        method: "POST",
        headers: {
          'content-type': "application/json"
        }

      };

    return new Promise( (resolve, reject) => {
    
      const request = (/^https/.test(url) ? https : http).request(url, options, (res) => {

        let data = '';  
        
        // Handle Data Chunks from Stream
        res.on('data', (chunk) => data += chunk);

        // Finished Processing Resolve Promise
        res.on('end', () => resolve(data));
  
      // Reject Promise on Error
    }).on("error", reject);

    // Send Data & End Request
    request.write(JSON.stringify(body));
    request.end();
    });

};