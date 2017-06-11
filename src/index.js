import TweetsUtils from './utils/TweetsUtils'
import AWS from "aws-sdk";
import regeneratorRuntime from 'regenerator-runtime' // Important! This needs to be imported here for Babel to transpile correctly.

// Todo: add validation for CLASSIFIER_USERNAME/PASS and MOOD_USERNAME/PASS values.
var index = async (event, context, callback) => {
    const S3_REGION = process.env.S3_REGION || "us-west-2";
    const S3_BUCKET = process.env.S3_BUCKET;
    const FILENAME = process.env.FILENAME;
    const MAX_TWEETS = process.env.MAX_TWEETS || 100; // Max number of Tweets to store data on

    if(!S3_BUCKET || !FILENAME){
        return callback(new Error("Please specify FILENAME and S3_BUCKET variables."));
    }

    let message = event.Records[0].Sns.Message;
    console.log('Message received from SNS:', message);
    let allTweets = JSON.parse(message);

    const s3 = new AWS.S3();
    let params = {
        Bucket: S3_BUCKET,
        Key: FILENAME
    };

    let data = await s3.getObject(params).promise();
    let classifiedTweets = JSON.parse(data.Body);
    if (TweetsUtils.alreadyClassified(classifiedTweets, allTweets)) {
       return callback(null);
    }

    let tweetsToClassify = TweetsUtils.filterAlreadyClassifiedTweets(classifiedTweets, allTweets);
    let newlyClassifiedTweets = await TweetsUtils.classifyTweets(tweetsToClassify);
    let newData = newlyClassifiedTweets.concat(classifiedTweets);
    newData = newData.slice(0, MAX_TWEETS);
    params = {
        Body: JSON.stringify(newData),
        ACL: "public-read",
        Bucket: S3_BUCKET,
        Key: FILENAME,
        ContentType: "application/json"
    };

    try {
        await s3.putObject(params).promise();
        console.log("SUCCESS: put data in S3 bucket");
    } catch(err){
        console.error(err);
    }
};

exports.handler = index;