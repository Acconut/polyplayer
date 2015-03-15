# Polyplayer

Polyplayer allows you to rule YouTube's, Soundcloud's and Vimeo's player using one API.

## Features
* Playing, pausing, stopping
* Seek to absolute or relative position
* Fetch details about videos
* Listen to events

## Example

More examples are in `examples/`.

```html
<!DOCTYPE html>
<html>
    <body>
    
        <!-- This element wil be the player's parent node -->
        <div id="player"></div>
        
        <!-- Polyplayer requires Backbone and Underscore -->
        <script src="../node_modules/underscore/underscore.js"></script>
        <script src="../node_modules/backbone/backbone.js"></script>
        
        <!-- Polyplayer itself including vendor scripts -->
        <script src="../polyplayer.vendor.min.js"></script>
        
        <script>
            
            /**
             * Create new Soundcloud player
             */
            var player = new PP.Player({
                
                videoUrl: "https://soundcloud.com/mashupgermany/mashup-germany-berlin-banquet",
                
                container: "#player"
                
            });
            
            /**
             * Wait until the player is ready to play
             */
            player.on("ready", function() {
                
                /**
                 * Play and pause after 6s
                 */
                player.play();
                
                setTimeout(function() {
                    player.pause();
                }, 6000);
                
            });
        </script>
    </body>
</html>
```

## API
### Player
`Player` is an instace of `Backbone.Model` and has all its [functions](http://backbonejs.org/#Model) inherited. It's located under the PP namespace inside `window` (`PP.Player`).

`new Player(options)`

Creates a new player instance. `options` in an object:
* `videoUrl` String: Video URL, e.g. http://www.youtube.com/watch?v=eKW5iugJChk, https://soundcloud.com/mashupgermany/mashup-germany-berlin-banquet, http://vimeo.com/18890266
* `container` String: CSS selector string to match the parent element

`Player#play()`

Plays the video. This will fire a `play` event and change the state to `PLAYING`.

`Player#pause()`

Pauses the video. This will fire a `pause` event and change the state to `PAUSED`.

`Player#stop()`

Stops the video. This will fire a `stop` event and change the state to `STOPPED`.
The video will start from the beginning when played.

`Player#getDetails(callback)`

Fetches details about the video. `callback` is a node-like callback function (`err, result`).
`result` is an object containing following properties:
* `title` String: The video's title
* `duration` Number: Duration in ms
* `createdAt` Date: Video's creating date
* `thumbnails` Array: Video's thumbnail. Each element has `width`, `height` and `url` properties

`Player#getCurrentPosition()`

Returns the current position in ms.

`Player#getState()`

Returns the current state:

* Player.states.LOADING: 0
* Player.states.READY: 1
* Player.states.PLAYING: 2
* Player.states.PAUSED: 3
* Player.states.FINISHED: 4
* Player.states.STOPPED: 5

`Player#seek(percent)`

Seeks to a relative position in the video. `percent` is a number between 0 and 1, e.g. 0.5.
This will fire a `playProgress` event.

`Player#seekTo(ms)`

Seeks to a absolute position in the video. `ms` is the number in ms to seek to, e.g. 12000.
This will fire a `playProgress` event.

**Events**

Use Backbone.Model's `on`, `off` and `once` function to listen to events.

`play`

Fired when the video starts to play.

`pause`

Fired when the video pauses.

`stop`

Fired when the video stops.

`finish`

Fired when the video finishs to play.

`playProgress`

Fired continously when the video plays or seeks.

`stateChange`

Fired when the states changes. See `Player#getState()`.

### Playlist

`Playlist` is an instace of `Backbone.Collection` and has all its [functions](http://backbonejs.org/#Collection) inherited. It's located under the PP namespace inside `window` (`PP.Playlist`).

`new Player(players, options)`

* `players` is an array which contains `Player`s which should be add instantly.
Creates a new player instance. `options` in an object:
* `container` String: CSS selector string to match the parent element in which later added players are injected.

`Playlist#add(player)`

Add a player to the list. `player` is either an instance of `Player` or an options object which will be passed to the `Player`'s contructor.

`Playlist#getCurrentPlayer()`

Returns the current player object or `null`.

`Playlist#setPlayer(playerObj)`

`playerObj` should be an instance on `Player` which will be set as the current player.

`Playlist#setPlayerById(playerId)`

Same as `setPlayer` but gets the player using its `id`.

`Playlist#nextPlayer(startFromBeginning)`

Set the next player in the list as the current one. If `startFromBeginning` is true it will start from the beginning again if it reaches the bottom.

`Playlist#previousPlayer(startFromEnd)`

Sets the previous player in the list as the current one. If `startFromEnd` is true it will start from the end again it it reaches the top.

`Playlist#randomPlayer()`

Sets a random player as the current player.

`Playlist#loopMode`

Represents the current strategy what happends when a player finishes (`finish` event is fired):

* Playlist.loopModes.NO: 0 (Nothing, default)
* Playlist.loopModes.NEXT: 1 (Play the next player but don't repeat the list)
* Playlist.loopModes.LOOP: 2 (Play the next player and repeat the list)
* Playlist.loopModes.RANDOM: 3 (Choose a random player to be next)

It also exposes following functions which behave the same as `Player` does on the current player:

* `Playlist#play()`
* `Playlist#pause()`
* `Playlist#stop()`
* `Playlist#getCurrentPosition()`
* `Playlist#getState()`
* `Playlist#seek(percent)`

**Events**

Since it's a Backbone.Collection, `Playlist` triggers all events which are emitted by its models (see Player's event).
Additionally it fires a `playerChange` event when a new player is set.

## Browser support

Tested successfully in Chrome 31 and Firefox 26.
IE 11 has problems using the YouTube iFrame API (we cannot fix this; it's YT's problem).
Mobile browsers need flash or support HTML5's video and audio elements.

## Testing

Use `test/player.html` and `test/playlist.html` to run tests. You'll need Flash in order to succed all tests.

## Building

We use [gulp](https://github.com/wearefractal/gulp) for building and npm for dependency management:

```bash
# Install gulp
npm install -g gulp

# Fetch all dependecies
npm install

# Build polyplayer.js
gulp build

# Build polyplayer.min.js
gulp build-minify

# Build polyplayer.vendor.min.js
gulp build-vendor

# Buid all
gulp all
```

See `gulpfile.js` for all tasks.

## License

> (MIT License)

> Copyright (c) 2013 Marius maerious@gmail.com

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
