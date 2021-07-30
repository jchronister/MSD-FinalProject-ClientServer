"use strict";

/** Save Image Data to Database
*  @param {object} db - Database Reference
*  @param {object} imageInfo - Image Info
*  @returns {Promise} Database Query Promise
*/  
module.exports.saveImageDatatoDatabase = function (db, {user, originalFileName, description, thumbnailURL, rawImageURL}) {

  // Image Info
  const info = {
    user : user || "guest",
    originalFileName: originalFileName || "unknown",
    description: description || "unknown",
    thumbnailURL,
    rawImageURL,
    flagged: false,
    date: new Date(),
    deleted: null
  };

  // Return Database Insert Promise
  return db.collection(process.env.appDBImagesCollectionName).insertOne(info);

};