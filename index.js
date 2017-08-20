'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

const BUCKET_ORIGIN = process.env.BUCKET_ORIGIN;
const BUCKET_DESTINATION = process.env.BUCKET_DESTINATION;
const URL = process.env.URL;

exports.handler = function(event, context, callback) {
  const key = event.queryStringParameters.key;
  const match = key.match(/(.*)\.(.*)/);
  const originalKey = match[1];
  const originalExtension = match[2];
  //const originalQuery = match[3];

  var contentType;
  if (originalExtension=="css") {
    contentType = "text/css";
  } else if (originalExtension=="js") {
    contentType = "application/javascript";
  } else {
    console.err("Unexpected file extenstion", originalExtension);
    throw "Format error";
  }

  S3.getObject({Bucket: BUCKET_ORIGIN, Key: originalKey+"."+originalExtension}).promise()
    .then((data) => {
      console.log("DATA:",data);
      return S3.putObject({
        Body: data.Body,
        Bucket: BUCKET_DESTINATION,
        ContentType: 'image/${originalExtension}',
        CacheControl: 'max-age=12312312',
        Key: key,
      }).promise();
    }
    )
    .then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/${key}`},
        body: '',
      })
    )
    .catch(err => callback(err))
}
