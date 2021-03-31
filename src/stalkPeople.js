const fs = require('fs');
const dataFolder = './data/';
const { TwitterClient } = require('twitter-api-client');
/*const {
  twitter_api_key,
  twitter_api_secret,
  twitter_access_token,
  twitter_access_token_secret
} = require('../config');*/
const twitter_api_key = process.env.twitter_api_key;
const twitter_api_secret = process.env.twitter_api_secret;
const twitter_access_token = process.env.twitter_access_token;
const twitter_access_token_secret = process.env.twitter_access_token_secret;

const diskdb = require('diskdb');

const twitterClient = new TwitterClient({
  apiKey: twitter_api_key,
  apiSecret: twitter_api_secret,
  accessToken: twitter_access_token,
  accessTokenSecret: twitter_access_token_secret
});

const stalkAccounts = bot => {
  fs.readdir(dataFolder, (err, files) => {
    files
      .filter(f => !f.includes('-ignored'))
      .forEach(f => {
        let ignoredName = f.split('.json')[0] + '-ignored';
        let db = diskdb.connect('./data', [ignoredName])[ignoredName];
        fs.readFile('./data/' + f, (err, data) => {
          accounts = JSON.parse(data);
          accounts.forEach(async a => {
            const tweets = await twitterClient.tweets.search({
              q: `from:${a.user} since:2021-01-01`
            });
            tweets.statuses
              .filter(t => !t.retweeted_status)
              .forEach(t => {
                if (t.favorite_count + t.retweet_count > a.number) {
                  let results = db.find({ id: t.id_str });
                  if (results.length > 0) {
                    return;
                  }
                  bot.telegram.sendMessage(
                    f.split('.json')[0],
                    `Tuit potencialmente dramático de @${a.user}: https://twitter.com/${a.user}/status/${t.id_str} `
                  );
                  db.save({ id: t.id_str });
                }
              });
          });
        });
      });
  });
};

module.exports = {
  stalkAccounts
};
