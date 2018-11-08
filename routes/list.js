/*
    Author Name  : Sudarsan PS 
    website      : www.sudarsanps.com
    Description  : List status of all jobs which converts audio to speech . From here you can proceed to do sentiment analysis 
*/
var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('request');

var AWS = require('aws-sdk');
var config = require('../config/awsconfig');
var s3 = new AWS.S3();
var transcribeservice = new AWS.TranscribeService();
var comprehend = new AWS.Comprehend();



router.route('/')
    .get((req,res,next)=>{
        // Function for listing of AWS Transcribe jobs
        transcribeservice.listTranscriptionJobs({}, (err, jobData)=> {
           res.render('list', { title: 'List Jobs' ,success: req.flash('success', ''),error: req.flash('error', ''), data : jobData.TranscriptionJobSummaries });
        });    
    })
    .post((req,res,next)=>{
        let jobName = req.body.jobname;
        if(jobName != null && jobName != ''){
            let fileURL = process.env.S3_URL+process.env.S3_BUCKET+'/'+jobName+'.json';
            
            //config for updating the permission for output file
            let S3File =  jobName+'.json';    
            let S3Params = {
                Bucket: process.env.S3_BUCKET,
                Key: S3File,
                ACL: 'public-read'
            };

            s3.putObjectAcl(S3Params, function(err, s3Data) {
                if(err){
                    console.log("err in s3.putObjectAcl:"+err);
                    req.flash('error','Seems like somehthing went wrong.Please try again');
                    res.redirect('/list');
                }
                else{
                    request(fileURL , function (error, response, body) {
                        if(body != null && body != ''){
                            let speechOutput = JSON.parse(body);
                            if(speechOutput != null && speechOutput.results != null){
                                try{
                                    let userTranscript = speechOutput.results.transcripts[0]['transcript'];
                                    let langParam = {
                                        Text : userTranscript
                                    }
                                    async.waterfall(
                                    [
                                        (callback) =>{
                                            // Function for detecting the language
                                            comprehend.detectDominantLanguage(langParam, function(err, langDetails) {
                                                callback(err,langDetails);
                                            });
                                        },

                                        (langDetails,callback) =>{
                                            try{

                                                let tempParam  = {
                                                    LanguageCode : langDetails.Languages[0]['LanguageCode'],
                                                    Text : userTranscript
                                                }
                                                // Detecting the sentiments of transcripts
                                                comprehend.detectSentiment(tempParam,function(err,data){
                                                    langDetails.sentiment = data;
                                                    callback(err,langDetails);
                                                });
                                            }
                                            catch(e){
                                                callback(e,langDetails);
                                            }    
                                        },
                                        (langDetails,callback) =>{
                                            let tempParam  = {
                                                LanguageCode : langDetails.Languages[0]['LanguageCode'],
                                                Text : userTranscript
                                            }
                                            // Function for fetching the entites in transcripts
                                            comprehend.detectEntities(tempParam, function(err, entityDetails) {
                                                langDetails.entities = entityDetails;
                                                callback(err,langDetails);
                                            });
                                        },
                                        (langDetails,callback) =>{
                                            let tempParam  = {
                                                LanguageCode : langDetails.Languages[0]['LanguageCode'],
                                                Text : userTranscript
                                            }
                                            // Function for fetching the key phrases in transcripts
                                            comprehend.detectKeyPhrases(tempParam, function(err, keyPhrasesDetails) {
                                                langDetails.keyphrases = keyPhrasesDetails;
                                                callback(err,langDetails);
                                            });
                                        },
                                        //==== For syntax , please uncomment the below    ======
                                        // (langDetails,callback) =>{
                                        //     let tempParam  = {
                                        //         LanguageCode : langDetails.Languages[0]['LanguageCode'],
                                        //         Text : userTranscript
                                        //     }
                                        //     // Function for fetching syntax in transcripts
                                        //     comprehend.detectSyntax(tempParam, function(err, syntaxDetails) {
                                        //         langDetails.syntax = syntaxDetails;
                                        //         callback(err,langDetails);
                                        //     });
                                        // },
                                    ],(err,langDetails)=>{
                                        
                                        if(err){
                                            console.log("err in async:"+err);
                                            req.flash('error','Seems like somehthing went wrong.Please try again');
                                            res.redirect('/list');
                                        }
                                        else{
                                            res.render('result', { title: 'Final Result' ,success: req.flash('success', ''),error: req.flash('error', ''), result : langDetails , transcript : userTranscript  });
                                        }
                                    });
                                }
                                catch(e){
                                    console.log("e:"+e);
                                    res.redirect('/list');
                                }    
                            }
                            else{
                               
                                req.flash('error','Result not found');
                                res.redirect('/list');
                            }
                        }
                        else{
                            req.flash('error','Couldnt find anything to process');
                            res.redirect('/list');
                        }    
                    });
                }
            });
        }
        else{
            req.flash('error','Seems like somehthing went wrong.Please try again');
            res.redirect('/list');
        }
    });    
module.exports = router;

