# speech-sentiment-analyser

Speech Sentiment Analyzer (SSA) is ML & AI powered tool which will help to analyse the sentiment in the audio file using AWS Transcribe and comprehend. It gives a detailed insight to what user describes.
SSA will help you analysis audio speech and creates a transcripts from audio file which in-turn will be used to derive the sentiment of user.

The process has two main steps

1. Uploading  an audio file , which will be automatically converted into transcripts.
2. Once step1 is completed , you can do sentiment analysis on a click of a button

## Prerequisite
1. AWS Account 
2. Create IAM User via IAM console with policy supporting Transcribe,Comprehend and S3
3. Generate the 'AccessKey' and 'AccessSecretKey'
4. Create an S3 Bucket

## Installation
1. Clone the repository
2. Move to cloned directory and install all dependencies 
```sh
npm install 
```
3. Edit '.env' file and replace dummy credential with your credentials 
4. Now start your server
```sh
npm start 
```
