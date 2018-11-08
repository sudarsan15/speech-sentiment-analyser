
/*
Author Name  : Sudarsan PS 
website      : www.sudarsanps.com
Description  : This enables you to upload audio files for further processing 
*/

var express = require('express');
var router = express.Router();


var AWS = require('aws-sdk');
var multer = require('multer');
var multerS3 = require('multer-s3');

// ==== AWS Config and services===
var config = require('../config/awsconfig');
var s3 = new AWS.S3();
var transcribeservice = new AWS.TranscribeService();

//== S3 Upload functionality =====
var uploadAudio = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl : 'public-read',
        serverSideEncryption: 'AES256',
        metadata: function (req, file, cb) {
          cb(null, {fieldName: file.fieldname});
        },
        key: function (req, file, cb) {
          let temp1 = file.originalname.split('.');
          let justName  = temp1[0];
          let ext = temp1[1];
          let tempFileName = justName + Date.now();
          cb(null, tempFileName + '.' + ext);
        }
    }),
    limits: {
      fileSize: 6 * 1000 * 1000
   },
  fileFilter: function (req, file, cb) {
      var type = file.mimetype;
      console.log("file.mimetype:"+file.mimetype);
      // Currently restricting forma to MP3 only
      if (type !== 'audio/mp3') {
          cb(new Error('fileExtensionError'));
      } else {
          cb(null, true);
      }
  }
}).single('audioFile');


/* GET home page. */


router.route('/')
  .get((req,res,next)=>{
    res.render('index', { title: 'Express' ,success: req.flash('success', ''),error: req.flash('error', '') });
  })
  .post((req,res,next)=>{
    console.log("----file upload process started--- ");
    uploadAudio(req,res,(err)=>{
        if(err == "Error: fileExtensionError"){
            req.flash('error','Invalid file format.Currenlty supports only MP3 format');
            res.redirect('/');
        }
        else if(err == 'MulterError: File too large'){
          req.flash('error','File size is exceeded the limit.Maximum size allocated is 6 MB ');
          res.redirect('/');
        }
        else if(err){
            console.log("err in file upload:"+err);
            req.flash('error','Seems like something went wrong.Please try after sometime');
            res.redirect('/');
        }else{
            console.log("----file upload Success !--- ");
            let S3File = req.file.location;
            
            //Setting Job name using date and time 
            let today = new Date();
            let dateT = today.getFullYear()+(today.getMonth()+1)+today.getDate();
            let time = today.getHours() + today.getMinutes() + today.getSeconds();
            let dateTime = dateT+time;

            let jobName = "test_"+dateTime;
            let transcribeParam = {
              LanguageCode: 'en-US' , /* required */
              Media: { /* required */
                MediaFileUri: S3File
              },
              MediaFormat: 'mp3', /* required */
              TranscriptionJobName: jobName  , /* required */
             // MediaSampleRateHertz: 2400,
              OutputBucketName: process.env.S3_BUCKET,
              Settings: {
                ChannelIdentification: false,
                ShowSpeakerLabels:false
              }
            };
            console.log("-- transcribe process going to start..! --");
            transcribeservice.startTranscriptionJob(transcribeParam, function(err, data) {
                if(err){
                  console.log("err in startTranscriptionJob:"+err);
                  req.flash('error','Seems like something went wrong in transcribe proccess. Please try after some time');
                  res.redirect('/');
                }
                else {
                  
                    let jobName = null;
                    let jobStatus = null;
                    let mediaFile = null;
                    if(data.TranscriptionJob != null){
                      jobName = data.TranscriptionJob.TranscriptionJobName;
                      jobStatus = data.TranscriptionJob.TranscriptionJobStatus;
                      mediaFile = data.TranscriptionJob.Media.MediaFileUri;
                    }

                  let successMsg = "Transcribe process started successfully,  Job Name: "+jobName+",    Status :"+jobStatus+",    file :"+mediaFile+"   Please check list tab for status updates";

                  req.flash('success',successMsg);
                  res.redirect('/');
                }
            });
        } 
     });
  });

module.exports = router;
