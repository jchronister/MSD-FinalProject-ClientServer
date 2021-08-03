"use strict";

const AWS = require('aws-sdk');
const Bucket = process.env.S3Bucket;

const s3 = new AWS.S3({ accessKeyId: process.env.S3AccessKey, 
                        secretAccessKey: process.env.S3SecretKey});


/** Stream File to S3
 * @param {stream} dataFile - Data File or Data Stream
 * @param {string} Key - Data Key
 * @param {object} metadata - Key/Value Metadata
 * @returns {Promise} Returns Upload Status
*/
module.exports.s3StreamUpload = function (dataFile, Key, metadata) {
  
  const params = {
    Bucket, 
    Key, 
    Body: dataFile,

    // Add Metadata if Exists
    ...(metadata) && {Metadata: metadata},
  };

  return s3.upload(params).promise();

};

/** Stream File From S3
 * @param {string} Key - Data Key
 * @returns {stream} Returns Read Stream
*/
module.exports.s3StreamDownload = function (Key) {

  return s3.getObject({Bucket, Key}).createReadStream();

};