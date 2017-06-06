import ClassifierUtils from '../utils/ClassifierUtils'
import MoodUtils from '../utils/MoodUtils'
import AWS from "aws-sdk";
import regeneratorRuntime from 'regenerator-runtime' // Important! This needs to be imported here for Babel to transpile correctly.

const S3_REGION = process.env.S3_REGION || "us-west-2";
const S3_BUCKET = process.env.S3_BUCKET;
const FILENAME = process.env.FILENAME;


async function test() {
    const s3 = new AWS.S3();
    let params = {
        Bucket: S3_BUCKET,
        Key: FILENAME
    };

    let screenName = event.screen_name || process.env.SCREEN_NAME;
    let tweets = await TwitterUtils.getTweets(screenName);
    let filteredTweets = TwitterUtils.filterOutRetweets(tweets);

    s3.getObject(params, async (err, data) => {
        if (err) {
            return callback(err);
        }

        let jsonData = data.Body;

        // If these Tweets have already been classified, return
        if (jsonData.length > 0 && jsonData[0].tweet.id === filteredTweets[0].id) {
            return callback(null);
        }

        let alreadyClassifiedIds = jsonData.map(item => item.tweet.id);
        let tweetsToClassify = filteredTweets.filter(item => !alreadyClassifiedIds.includes(item.id));

        for (var i = 0; i < tweetsToClassify.length; i++) {
            let tweet = tweetsToClassify[i];
            let classification = await ClassifierUtils.classifyText(tweet.text);
            let mood = await MoodUtils.analyzeText(tweet.text);
            let newItem = {
                tweet: tweet,
                classification: classification,
                mood: mood
            }

            jsonData.push(newItem);
        }

        let params = {
            Body: jsonData,
            ACL: "public-read",
            Bucket: S3_BUCKET,
            Key: FILENAME
        };
        s3.putObject(params, (err, data) => {
            if (err) {
                return callback(err);
            }

            return callback(null);
        });
    });
};

test();