const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

const getGitHubUser = async (req, res, next) => {
  try {
    console.log(`Fetching Data`);
    const { username } = req.params;

    const response = await (
      await fetch(`https://api.github.com/users/${username}`)
    ).json();

    client.setex(username, 10, response.followers);

    return res.json({
        message: `${req.params.username} has ${response.followers} followers`
    });
  } catch (e) {
    return next(e);
  }
};

const cacheMiddleWare = async (req, res, next) => {
  try {
    client.get(req.params.username, (err, data) => {
      if (err) throw err;

      if (!data) return next();

      return res.json({
        message: `${req.params.username} has ${data} followers`,
      });
    });
  } catch (e) {
    return next(e);
  }
};

app.get('/repos/:username',cacheMiddleWare, getGitHubUser);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
