import ClassifierUtils from './utils/ClassifierUtils'
import MoodUtils from './utils/MoodUtils'
import AWS from "aws-sdk";
import regeneratorRuntime from 'regenerator-runtime' // Important! This needs to be imported here for Babel to transpile correctly.

// Todo: add validation for CLASSIFIER_USERNAME/PASS and MOOD_USERNAME/PASS values.
var index = async (event, context, callback) => {
    const S3_REGION = process.env.S3_REGION || "us-west-2";
    const S3_BUCKET = process.env.S3_BUCKET;
    const FILENAME = process.env.FILENAME;

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
    let classifiedTweets = data.Body;
    //if (alreadyClassified(classifiedTweets, allTweets)) {
    //    return callback(null);
    //}

    //let tweetsToClassify = filterAlreadyClassifiedTweets(classifiedTweets, allTweets);
    let tweetsToClassify = allTweets;
    let newlyClassifiedTweets = await classifyTweets(tweetsToClassify);
    let newData = newlyClassifiedTweets.concat(classifiedTweets);
    params = {
        Body: JSON.stringify(newData),
        ACL: "public-read",
        Bucket: S3_BUCKET,
        Key: FILENAME
    };

    try {
        await s3.putObject(params).promise();
        console.log("SUCCESS: put data in S3 bucket");
    } catch(err){
        console.error(err);
    }
};

function alreadyClassified(classifiedTweets, allTweets){
    if(!classifiedTweets || classifiedTweets.length === 0){
        return false;
    }
    return classifiedTweets[0].tweet.id === allTweets[0].id;
}

function filterAlreadyClassifiedTweets(classifiedTweets, allTweets){
    if(!classifiedTweets || classifiedTweets.length === 0){
        return allTweets;
    }

    let alreadyClassifiedIds = classifiedTweets.map(item => item.tweet.id);
    let tweetsToClassify = allTweets.filter(item => !alreadyClassifiedIds.includes(item.id));
    return tweetsToClassify;
}

async function classifyTweets(tweets){
    let classifiedTweets = [];
    for(var i = 0; i < tweets.length; i++) {
        let tweet = tweets[i];
        let classification = await ClassifierUtils.classifyText(tweet.text);
        let mood = await MoodUtils.analyzeText(tweet.text);
        let newItem = {
            tweet: tweet,
            classification: classification,
            mood: mood
        }

        classifiedTweets.push(newItem);
    };
    return classifiedTweets;
}

exports.handler = index;