var express = require('express');
var router = express.Router();
var config = require('../config.json');
var rp = require('request-promise');

var lastfm = require('../util/lastfm-util')
var spotify = require('../util/spotify-util')

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
    clientId: config.SPOTIFY_CLIENT_ID,
    clientSecret: config.SPOTIFY_CLIENT_SECRET,
    redirectUri: config.SPOTIFY_REDIRECT_URI
});

const LAST_FM_API_KEY = config.LAST_FM_API_KEY;
const BASE = 'http://ws.audioscrobbler.com/2.0/?method=';


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'backpedal', loggedIntoSpotify: false });
});

router.post('/generate', function(req, res, next) {
    let method = 'user.getrecenttracks'
    const requestLength = req.body.amt;
    const limit = 200;
    const user = req.body.user;
    let from = new Date(req.body.from).getTime() / 1000;
    let to = new Date(req.body.to).getTime() / 1000;
    
    let url = BASE + method +
        '&limit=' + limit +
        '&user=' + user +
        '&api_key=' + LAST_FM_API_KEY +
        '&from=' + from +
        '&to=' + to +
        '&format=json';

    generate(url)
        .then(topSongs => res.json(topSongs.slice(0, requestLength)))
        .catch(err => console.log(err));
});

router.get('/login', function(req, res, next) {
    let scopes = ['playlist-modify-private', 'playlist-modify-public'];
    let authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
});

router.get('/callback', function(req, res, next) {
    let code = req.query.code;
    spotifyApi.authorizationCodeGrant(code)
        .then((data) => {
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
        })
        .catch(err => console.log(err));
    res.render('index', { title: 'backpedal', loggedIntoSpotify: true })
});

router.post('/playlist', function(req, res, next) {
    let songs = JSON.parse(req.body.songs);
    let title = req.body.title;
    spotify.generateSpotifyPlaylist(spotifyApi, songs, title);
});

async function generate(url) {
    let songs = await lastfm.getLastFmDataParallel(url);
    if (songs) {

    }
    return lastfm.buildDataModel(songs);
    // let songs = await lastfm.getLastFmData(url); // returns songs array
    // /**
    //  * The idea is:
    //  * - get all the individual json responses using Promise.all()
    //  * - iterate over json responses in here and build songs array
    //  * - send songs to buildDataModel() and back to router
    //  */
    // return lastfm.buildDataModel(songs);
}

module.exports = router;