const SpotifyWebApi = require('spotify-web-api-node');

const generateSpotifyPlaylist = function(spotifyApi, songs, title) {
    let playlistId;
    spotifyApi.getMe()
        .then(userData => {
            return spotifyApi.createPlaylist(userData.body.id, title, { public: false })
        })
        .then(playlistData => {
            playlistId = playlistData.body.id;
            return getSpotifyIds(songs, spotifyApi);
        })
        .then(spotifyIds => {
            return spotifyApi.addTracksToPlaylist(playlistId, spotifyIds)
        })
        .catch(err => console.log(err))
}

async function getSpotifyIds(songs, spotifyApi) {
    let spotifyIds = [];
    let failed = [];
    for (let i = 0; i < songs.length; i++) {
        let song = songs[i];
        let regex = /.+?(?= - |\(feat)/
        if (song.name.match(regex)) {
            song.name = song.name.match(regex)[0];
        }
        let searchResults = await spotifyApi.searchTracks('track:' + song.name + ' artist:' + song.artist['#text']);
        if (searchResults.body.tracks.items.length) {
            spotifyIds.push(searchResults.body.tracks.items[0].uri)
        } else {
            failed.push(song);
        }
    }
    console.log(failed)
    return spotifyIds;
}

module.exports.generateSpotifyPlaylist = generateSpotifyPlaylist;