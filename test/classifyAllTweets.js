import TweetsUtils from '../src/utils/TweetsUtils'
import axios from 'axios'

async function test() {

    let response = await axios.get("https://t35q76g94l.execute-api.us-east-1.amazonaws.com/prod/tweets");
    let allTweets = response.data;
    let tweetsToClassify = allTweets;
    let newlyClassifiedTweets = await TweetsUtils.classifyTweets(tweetsToClassify);
    let newData = newlyClassifiedTweets;
    console.log(JSON.stringify(newData));
};

test();