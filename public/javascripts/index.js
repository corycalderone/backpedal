$('div.loader, div.songs').hide();

let songDiv = $('div.songs');
let songs;

$('form.generate').submit((e) => {
    e.preventDefault();
    $('.loader').show();
    $.post('/generate', $('form').serialize())
        .done((data => {
            songs = data;
            $('.loader').hide();
            $('div.songs').show();
            songs.forEach(song => $('.songs ul').append('<p>' +
                song.artist['#text'] + ' | ' +
                song.name + ' | ' +
                song.amountOfPlays))
        }));
});


$('form.playlist').submit((e) => {
    e.preventDefault();
    $('div.songs ul').empty();
    $.post('/playlist', {
            form: $('form').serialize(),
            songs: JSON.stringify(songs),
            title: $('#title').val()
        })
        .done((data => {
            songs = data;
            $('.loader').hide();
            $('div.songs').show();
            songs.forEach(song => $('.songs ul').append('<p>' +
                song.artist['#text'] + ' | ' +
                song.name + ' | ' +
                song.amountOfPlays))
        }));
});