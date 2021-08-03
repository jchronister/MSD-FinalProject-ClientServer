# MSD Final Project - Image Scaler Microservice

## Client Public Server Part

### Node Express Server
* Recieves Image from Client
* Streams Image to S3 Storage
* Queries Service Registry to Find Image Scaler Address
* Sends Image Scaler Information About Image to Scale
* Saves Image Information in Mongo DB
* Returns S3 Address of Scaled Image to Client

