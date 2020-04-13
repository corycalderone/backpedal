var config = require('../config.json');
var rp = require('request-promise');

const LAST_FM_API_KEY = config.LAST_FM_API_KEY;
const BASE = 'http://ws.audioscrobbler.com/2.0/?method=';

const getLastFmDataParallel = async function(url, page = 1, songs = [], pageLimit) {
    let promiseArray = [
    rp(url + '&page=' + page),
    rp(url + '&page=' + (page + 1)),
    rp(url + '&page=' + (page + 2))];
    return Promise.all(promiseArray).then(async responses => {
        responses = responses.map(response => JSON.parse(response))
        responses.forEach( response => {
            if (page == 1) {
                pageLimit = response.recenttracks['@attr'].totalPages;
            }
            console.log(`${page} of ${response.recenttracks['@attr'].totalPages}`);
            if (response.recenttracks.track.length) {
                songs = [...songs, ...response.recenttracks.track];
            }
        })
        if (songs.length >= responses[0].recenttracks['@attr'].total) {
            return songs.filter(song => !song['@attr']);
        } else {
            return await getLastFmDataParallel(url, page += 3, songs, )
        }
    }).catch(err => console.log(err))
}

const getLastFmDataSlowly = async function(url, page = 1, songs = [], pageLimit = -1) {
    // todo: set a page limit variable ASAP to avoid reaching too far with a +1 page.
    let data = JSON.parse(await rp(url + '&page=' + page))
    if (page == 1) {
        console.log(`Expected total: ${data.recenttracks['@attr'].total}`)
    }
    if (data.recenttracks.track.length) {
        songs = [...songs, ...data.recenttracks.track];
    }
    if (songs.length >= data.recenttracks['@attr'].total) {
        return songs.filter(song => !song['@attr']);
    } else {
        return await getLastFmDataSlowly(url, page++, songs);
    }
}

const getTotalPages = async function(url) {
    let data = JSON.parse(await rp(url));
    return data.recenttracks.totalPages;
}
const buildDataModel = function(songs) {
    let model = {}
    songs.forEach((song) => {
        model[song.url] = model[song.url] ? model[song.url] + 1 : 1;
    });
    let unsortedEntries = Object.entries(model) // [['url1', 'count1'], ['url2', 'count2'], ...]
    console.log('Sorting...');
    let sortedEntries = mergeSort(unsortedEntries);
    let sortedSongsArray = [];
    console.log('Compiling song data...')

    // The `songObject` is each song's object from the original response.
    // It's going to have the newly-calculated play count tacked onto it.
    sortedEntries.forEach((songEntry) => {
        let songObject = songs.find((element) => element.url == songEntry[0])
        songObject.amountOfPlays = songEntry[1];
        sortedSongsArray.push(songObject);
    });
    console.log('Done.')
    return sortedSongsArray.reverse();
}


const mergeSort = function(unsortedArray) {
    if (unsortedArray.length <= 1) {
        return unsortedArray;
    }
    const middle = Math.floor(unsortedArray.length / 2);
    const left = unsortedArray.slice(0, middle);
    const right = unsortedArray.slice(middle);
    return merge(
        mergeSort(left), mergeSort(right)
    );
}

const merge = function(left, right) {
    let resultArray = [],
        leftIndex = 0,
        rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex][1] < right[rightIndex][1]) {
            resultArray.push(left[leftIndex]);
            leftIndex++;
        } else {
            resultArray.push(right[rightIndex]);
            rightIndex++;
        }
    }

    return resultArray
        .concat(left.slice(leftIndex))
        .concat(right.slice(rightIndex));
}

module.exports.getLastFmDataSlowly = getLastFmDataSlowly;
module.exports.getLastFmDataParallel = getLastFmDataParallel;
module.exports.buildDataModel = buildDataModel;