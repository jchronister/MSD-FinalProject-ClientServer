"use strict";

const Busboy = require("busboy");
const createHttpError = require("http-errors");

const router = require("express")();
const { imageFileExtensionOk, getImageScaler, httpRequest } = require("../middleware/image-processor");
const { sendJSON } = require("../middleware/return-object");
const { ObjectId } = require("mongodb");
const { verifyMongoId } = require("../middleware/verify-data");
const { s3StreamUpload } = require("../middleware/s3-interface");
const { saveImageDatatoDatabase } = require("../middleware/image-database");


// /images
router.route("/") 
  .get(getImages)
  .post(updateImages);


// /images/:id
router.route("/:id")
  .put(updateImage)
  .delete(deleteImage);




// Verify Mongo Id & Create ObjectID
router.param('id', (req, res, next)=> {
  if(verifyMongoId(req.params, 'id', next)){
      next();
  }
});



/** Return List of Images from Database
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @returns {undefined}
*/ 
function getImages(req, res) {

  let query = {deleted: null};
  const itemsPerRequest = 9;

  if (req.query.flagged) {
    query = {...query, flagged: true};
  }

  /////////////////
  // Get Page Links
  const page = +req.query.page || 0;

  // Create Query String
  const resQuery = Object.entries(req.query).reduce((a, [key, value], i) => {

    // Get All Query Except Page
    if (key !== "page") {
      a += (i > 0 ? "&" : "") + key + "=" + value;
    }

    return a;
  },"");
  
  
  // Setup Return Link Options       
  res.links({
    first: resQuery + '&page=0',
    prev: resQuery + '&page=' + ((page - 1) < 0 ? 0 : page - 1),
    next: resQuery + '&page=' + (page + 1),
  });
  
  // Needed to Read Header in Browser
  res.set('Access-Control-Expose-Headers', 'Link');
  
  // End Setup Pages
  ///////////////////////

  // Return List of Images
  req.db.db.collection(process.env.appDBImagesCollectionName).find(query)
    .skip(page * itemsPerRequest)
    .limit(itemsPerRequest)
    .toArray(sendJSON.bind(res));

}

/** Forward Image to Image Scaler
 * @param {object} req - Request Object
 * @param {object} res - Response Object
 * @param {function} next - Express next Function
 * @returns {undefined}
*/
function updateImages(req, res, next) {

  let description, id, imageProcessorURL, rawImageURL, thumbnailURL, user;
  let error = false;

  const busboy = new Busboy({ headers: req.headers, limits: { files: 1, fileSize: 10000000 }  } );


  // Exit Function for Errors
  const busboyStopProcessing = () => {
    req.unpipe(busboy); // Cancel More Data Processing
    error = true;
  };

  // Listen for File
  busboy.on("file", function(fieldname, fileStream, filename, encoding, mimetype) {  // eslint-disable-line no-unused-vars
    
    // Skip on Errors
    if (error) fileStream.resume();

    // Quick Check to See if File is Image
    const fileExtenstion = imageFileExtensionOk(filename);
    if (!fileExtenstion) {

      busboyStopProcessing();
      fileStream.resume();
      return next(createHttpError(400, "Invalid Image Extension"));

    }

    // Get Image Scaler URL
    getImageScaler()

    // Save File to Image Storage
    .then(url => {
        
        // Save URL
        imageProcessorURL = url;

        // Define Key
        id = new ObjectId().toHexString() + "." + fileExtenstion;

        // Set Metadata
        const metadata = {
          originfileName: filename,
          ...(description) && {description},
        };
        
        // Save File to S3
        return s3StreamUpload(fileStream, id, metadata);
        
    })

    // Send Info to Image Server
    .then(s3Data => {

      // Save Raw Image URL
      rawImageURL = s3Data.Location;

      const body = {
        s3Key: s3Data.key,
        metadata: {description}
      };

      return httpRequest(imageProcessorURL, body);
      
    })

    // Save Data to Database
    .then( (data) => {

      const dataObj = JSON.parse(data);

      if (dataObj.status !== "Success") {

        throw dataObj.error;

      } else {

        thumbnailURL = dataObj.data.thumbnailURL;

        // Add Data to Database
        return saveImageDatatoDatabase (req.db.db,
          {user, 
           originalFileName: filename, 
           description, 
           thumbnailURL, 
           rawImageURL});
         
      }

    })
    
    // Verify Database Updated
    .then(db => {

      if (db.insertedId) {
        sendJSON.call(res, null, {thumbnailURL});
      } else {
        throw "Database Error";
      }

    })
    .catch( error => {
     
      busboyStopProcessing();
      sendJSON.call(res, error.message || error, null);
      
    });


  });

  // Listen for Non-File (Description)
  busboy.on("field", function (fieldname, val) {
    
    if (fieldname === "description") description = val;
    if (fieldname === "user") user = val;

  });

  // busboy.on("finish", function() {
  //   // form.submit(urlImage, ()=>console.log("done"))
  //   // res.writeHead(200, { "Connection": "close" });
  //   // console.log("busboy done")
  //   // res.end("File Proessed");
  // });
   
  return req.pipe(busboy);    



}


/** Update Image Flag
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @returns {undefined}
*/
function updateImage (req, res) {

  const flagged = req.body && req.body.flagged;
  const deleted = req.body && req.body.deleted;

  const info = {
    ...(flagged!==undefined) && {flagged: typeof flagged === 'boolean' ? flagged : true},
    ...deleted && {deleted: new Date()}
  };

  req.db.db.collection(process.env.appDBImagesCollectionName)
    .updateOne({_id: req.params.id}, 
      {$set: info})
  .then(data => {
    if (data.modifiedCount) {
      sendJSON.call(res, null, "Updated " + data.modifiedCount);
    } else {
      sendJSON.call(res, "No Records Updated", null);
    }
  })
  .catch(sendJSON.bind(res));
  
  
  

}


/** Delete Image
 * @param {object} req Request Object
 * @param {object} res Response Object
 * @returns {undefined}
*/
function deleteImage (req, res) {

  req.db.db.collection(process.env.appDBImagesCollectionName)
    .deleteOne({_id: req.params.id})
    .then(data => {
      if (data.deletedCount) {
        sendJSON.call(res, null, "Deleted " + data.deletedCount);
      } else {
        sendJSON.call(res, "No Records Updated", null);
      }
    })
    .catch(sendJSON.bind(res));
  
    // Delete from S3



}











module.exports = router;


// Busboy Error Handling
// const Busboy = require("busboy");
// const PQueue = require("p-queue");
// const express = require("express");
// const handleAsync = require("express-async-handler");

// const router = new express.Router();

// router.post("/", handleAsync((req, res, next) => {
//     const busboy = new Busboy({ headers: req.headers });
//     const workQueue = new PQueue({ concurrency: 1 });

//     function abort() {
//       req.unpipe(busboy);
//       workQueue.pause();
//       if (!req.aborted) {
//         res.set("Connection", "close");
//         res.sendStatus(413);
//       }
//     }

//     async function abortOnError(fn) {
//       workQueue.add(async () => {
//         try {
//           await fn();
//         } catch (e) {
//           abort();
//         }
//       });
//     }

//     busboy.on("file", (fieldname, file, filename) => {
//       abortOnError(() => {
//         // my logic here...
//       });
//     });

//     req.on("aborted", abort);
//     busboy.on("error", abort);

//     req.pipe(busboy);
//   })
// );
