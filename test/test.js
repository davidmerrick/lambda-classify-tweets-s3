import ClassifierUtils from '../src/utils/ClassifierUtils'
import MoodUtils from '../src/utils/MoodUtils'
import AWS from "aws-sdk";
//import regeneratorRuntime from 'regenerator-runtime' // Important! This needs to be imported here for Babel to transpile correctly.

const message = `[{"created_at":"Tue Jun 06 01:20:17 +0000 2017","id":871899511525961700,"id_str":"871899511525961728","text":"That\'s right, we need a TRAVEL BAN for certain DANGEROUS countries, not some politically correct term that won\'t help us protect our people!","truncated":false,"entities":{"hashtags":[],"symbols":[],"user_mentions":[],"urls":[]},"source":"Twitter for iPhone","in_reply_to_status_id":null,"in_reply_to_status_id_str":null,"in_reply_to_user_id":null,"in_reply_to_user_id_str":null,"in_reply_to_screen_name":null,"user":{"id":25073877,"id_str":"25073877","name":"Donald J. Trump","screen_name":"realDonaldTrump","location":"Washington, DC","description":"45th President of the United States of America","url":null,"entities":{"description":{"urls":[]}},"protected":false,"followers_count":31638478,"friends_count":45,"listed_count":70840,"created_at":"Wed Mar 18 13:46:38 +0000 2009","favourites_count":22,"utc_offset":-14400,"time_zone":"Eastern Time (US & Canada)","geo_enabled":true,"verified":true,"statuses_count":35006,"lang":"en","contributors_enabled":false,"is_translator":false,"is_translation_enabled":true,"profile_background_color":"6D5C18","profile_background_image_url":"http://pbs.twimg.com/profile_background_images/530021613/trump_scotland__43_of_70_cc.jpg","profile_background_image_url_https":"https://pbs.twimg.com/profile_background_images/530021613/trump_scotland__43_of_70_cc.jpg","profile_background_tile":true,"profile_image_url":"http://pbs.twimg.com/profile_images/1980294624/DJT_Headshot_V2_normal.jpg","profile_image_url_https":"https://pbs.twimg.com/profile_images/1980294624/DJT_Headshot_V2_normal.jpg","profile_banner_url":"https://pbs.twimg.com/profile_banners/25073877/1496423644","profile_link_color":"1B95E0","profile_sidebar_border_color":"BDDCAD","profile_sidebar_fill_color":"C5CEC0","profile_text_color":"333333","profile_use_background_image":true,"has_extended_profile":false,"default_profile":false,"default_profile_image":false,"following":false,"follow_request_sent":false,"notifications":false,"translator_type":"regular"},"geo":null,"coordinates":null,"place":null,"contributors":null,"is_quote_status":false,"retweet_count":8332,"favorite_count":28813,"favorited":false,"retweeted":false,"lang":"en"}]`;

const event = {
    Records: [
        {
            Sns: {
                Message: message
            }
        }
    ]
};

async function test() {
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

test();