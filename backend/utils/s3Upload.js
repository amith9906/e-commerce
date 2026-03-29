const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
  }
});

const uploadToS3 = async (fileBuffer, mimetype, folderPath = 'uploads') => {
  const bucketName = process.env.AWS_S3_BUCKET || 'my-ecom-bucket';
  
  // Extension based on mimetype
  const ext = mimetype.split('/')[1] || 'bin';
  const fileName = `${folderPath}/${uuidv4()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimetype,
    ACL: 'public-read' // Assumes public bucket setup
  });

  await s3Client.send(command);
  
  // Return the public URL
  return `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
};

module.exports = { uploadToS3 };
