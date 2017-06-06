import ToneAnalyzerV3 from 'watson-developer-cloud/tone-analyzer/v3'

class MoodUtils {

    static analyzeText(text) {
        return new Promise((resolve, reject) => {
            let tone_analyzer = new ToneAnalyzerV3({
                username: process.env.MOOD_USERNAME,
                password: process.env.MOOD_PASSWORD,
                version_date: process.env.VERSION_DATE || "2016-05-19"
            });

            let params = {
                text: text
            };

            tone_analyzer.tone(params, (error, response) => {
                if (error) {
                    return reject(error);
                }
                return resolve(response);
            });
        });
    }
}

export default MoodUtils