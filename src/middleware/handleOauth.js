const superagent = require('superagent')
const User = require('../models/users')

const TOKEN_SERVER_URL = 'https://gitlab.com/oauth/token'
const CLIENT_ID = 'b3539d4ce693d56948d5cbf5287e04c290f8fb89e168d0e3b45052dbae096fa3'
const CLIENT_SECRET = process.env.GITLAB_APP_CLIENT_SECRET
const API_SERVER = 'http://localhost:3000/oauth'
const REMOTE_API_ENDPOINT = 'https://gitlab.com/api/v4/user'

async function exchangeCodeForToken (code) {
  const response = await superagent
    .post(TOKEN_SERVER_URL)
    .send({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: API_SERVER
    })
  return response.body.access_token
}


async function getRemoteUsername (token) {
  const response = await superagent
    .get(`${REMOTE_API_ENDPOINT}?access_token=${token}`)
    // .set('Authorization', `Bearer ${token}`)
    // .set('user-agent', 'express-app')
  return response.body.username;
}

async function getUser (username) {
  const user = await User.findOneAndUpdate({ username }, { username },{ new: true, upsert: true })
  console.log(user);
  const token = user.generateToken()
  return [user, token]
}

async function handleOauth (req, res, next) {
  try {
    const { code } = req.query
    console.log('(1) CODE:', code)
    const remoteToken = await exchangeCodeForToken(code)
    console.log('(2) ACCESS TOKEN:', remoteToken)
    const remoteUsername = await getRemoteUsername(remoteToken)
    console.log('(3) GITHUB USER:', remoteUsername)
    const [user, token] = await getUser(remoteUsername)
    req.user = user
    req.token = token
    console.log('(4a) LOCAL USER:', user)
    console.log('(4b) USER\'S TOKEN:', token)
    next()
  } catch (err) {
    next(`ERROR: ${err.message}`)
  }
}

module.exports = handleOauth
