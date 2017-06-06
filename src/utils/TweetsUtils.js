import MoodUtils from './MoodUtils'
import ClassifierUtils from './ClassifierUtils'

class TweetsUtils {

    static alreadyClassified(classifiedTweets, allTweets){
        if(!classifiedTweets || classifiedTweets.length === 0){
            return false;
        }
        return classifiedTweets[0].tweet.id === allTweets[0].id;
    }

    static filterAlreadyClassifiedTweets(classifiedTweets, allTweets){
        if(!classifiedTweets || classifiedTweets.length === 0){
            return allTweets;
        }

        let alreadyClassifiedIds = classifiedTweets.map(item => item.tweet.id);
        let tweetsToClassify = allTweets.filter(item => !alreadyClassifiedIds.includes(item.id));
        return tweetsToClassify;
    }

    static async classifyTweets(tweets){
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

}

export default TweetsUtils