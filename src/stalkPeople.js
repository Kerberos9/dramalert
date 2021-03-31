const fs = require('fs');
const dataFolder = './data/';
const { TwitterClient } = require('twitter-api-client');
const { Pool } = require('pg');
const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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

const stalkAccounts = async bot => {
  console.log('Stalkeando...');
  await client.query(`SELECT * FROM accounts;`, (err, data) => {
    //console.log(data.rows);
    if (data && data.rows.length > 0) {
      data.rows.forEach(async d => {
        console.log(d);
        let account = d.account;
        let id = d.user_id;
        let number = d.number;
        console.log('Stalkeando cuenta ' + account);
        const tweets = await twitterClient.tweets.search({
          q: `from:${account} since:2021-01-01`
        });
        console.log('Tuits totales: ' + tweets.statuses.length);
        tweets.statuses
          .filter(t => !t.retweeted_status)
          .forEach(async t => {
            if (t.favorite_count + t.retweet_count > number) {
              await client.query(
                `SELECT * FROM ignored where user_id = '${id}' and tweet = '${t.id_str}';`,
                async (err, data) => {
                  //console.log(data.rows);
                  if (data && data.rows.length > 0) {
                    return;
                  } else {
                    bot.telegram.sendMessage(
                      id,
                      `Tuit potencialmente dramático de @${account}: https://twitter.com/${account}/status/${t.id_str} `
                    );
                    console.log(
                      `Insertando query: INSERT INTO ignored (user_id, tweet) values ('${id}', '${t.id_str}');`
                    );
                    client.query(
                      `INSERT INTO ignored (user_id, tweet) values ('${id}', '${t.id_str}');`,
                      async (err, data) => {
                        if (err) {
                          console.log('Error al insertar ' + err);
                        }
                      }
                    );
                  }
                }
              );
            }
          });
      });
    }
  });
};

module.exports = {
  stalkAccounts
};
