'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET_ORIGIN = process.env.BUCKET_ORIGIN;
const BUCKET_DESTINATION = process.env.BUCKET_DESTINATION;
const URL = process.env.URL;

exports.handler = function(event, context, callback) {
  const key = event.queryStringParameters.key;
  const match = key.match(/(\d+)x(\d+)\/(.*)\.(.*)/);
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  const originalKey = match[3];
  const originalExtenstion = match[4];

  S3.getObject({Bucket: BUCKET_ORIGIN, Key: originalKey}).promise()
    .then(data => Sharp(data.Body)
      .resize(width, height)
      .toBuffer()
    )
    .then(buffer => S3.putObject({
        Body: buffer,
        Bucket: BUCKET_DESTINATION,
        ContentType: 'image/${originalExtenstion}',
        CacheControl: 'max-age=12312312',
        Key: key,
      }).promise()
    )
    .then(() => callback(null, {
        statusCode: '301',
        headers: {'location': `${URL}/${key}`},
        body: '',
      })
    )
    .catch(err => callback(err))
}
