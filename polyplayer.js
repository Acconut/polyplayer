(function(window) {
var Player = function Player(givenOptions) {
    
    var options = {
        provider: null,
        videoId: null,
        videoUrl: null,
        prefetchInfo: false,
        container: document.body
    };
    
    _.extend(options, givenOptions);
    
    if(options.videoUrl) {
        
        var details = this._parseUrl(options.videoUrl);
        
        _.extend(options, details);
        
    }
    
    if(!(options.container instanceof Element)) {
        options.container = document.querySelector(options.container);
    }
    
    options.playerId = Player._generatePlayerId();
    
    return new this._providers[options.provider](options);
    
};

Player.prototype._providers = {
    "youtube": null,
    "vimeo": null,
    "soundcloud": null
};

Player.prototype._parseUrl = function parseUrl(url) {
    
    var result = {
        provider: null,
        videoUrl: null,
        videoId: null
    };
    
    try {
        
        var re = /^(https?:\/\/)?(www.)?([a-z0-9\-]+)\.[a-z]+(\/(.*))?/i.exec(url);
        
        if(re === null) {
            throw "Invalid url";
        }
        
        var urlProvider = re[3].toLowerCase(),
            path = re[5] || "";
        
        if(!(urlProvider in this._providers)) {
            throw "Unknown provider";
        }
        
        // Set provider and nice url
        result.provider = urlProvider;
        result.videoUrl = url;
        
        if(urlProvider === "youtube") {
            
            var id = /v=([A-Za-z0-9\-_]+)/.exec(url);
            
            /**
             * Valid: 
             *  http://www.youtube.com/watch?v=KniyOd1kwac
             */
            if(id === null) {
                throw "YouTube requires a URL containing the video ID (v)";
            }
            
            result.videoId = id[1];
            
        } else if(urlProvider === "vimeo") {
            
            /**
             * Valid:
             *  http://vimeo.com/12345
             * Invalid:
             *  http://vimeo.com/
             *  http://vimeo.com/foo
             *  http://vimeo.com/group/supercool
             */
            if(!/^[0-9]+$/.test(path)) {
                throw "Vimeo must be a numeric video url";
            }
            
            result.videoId = parseInt(path, 10);
            
        } else if(urlProvider === "soundcloud") {
            
            // Don't allow sets on soundcloud
            if(/^[0-9a-zA-Z-_]+\/sets\/[0-9a-zA-Z-_]+$/i.test(path)) {
                throw "Soundcloud sets are not implemented yet";
            }
            
            if(!/^[0-9a-zA-Z-_]+\/[0-9a-zA-Z-_]+$/i.test(path)) {
                throw "This is not a valid url to a song on Soundcloud";
            }
        }
        
    } catch(e) {
        throw e;
    }
    
    return result;
    
};

Player._lastPlayerId = 0;

Player._generatePlayerId = function() {
    return "polyplayer_" + this._lastPlayerId++;
};

Player.states = {
    LOADING: 0,
    READY: 1,
    PLAYING: 2,
    PAUSED: 3,
    FINISHED: 4,
    STOPPED: 5
};
var Playlist = Backbone.Collection.extend({
    
    model: function(attrs, options) {
        
        if(!attrs.container) {
            var el = document.createElement("div");
            options.collection._container.appendChild(el);
            attrs.container = el;
        }
        
        return new Player(attrs);
    },
    
    /**
     * Constructor
     *
     * @param {Array} models
     * @param {Object} options
     * @param {String|Element} options.container
     */
    initialize: function(models, options) {
        
        var container = options.container || document.body;
        
        if(!(container instanceof Element)) {
            container = document.querySelector(container);
        }
           
        this._container = container;
        
        this.on("finish", this._onFinish, this);
        
    },
    
    /**
     * Current loop mode used by _onFinish
     * Equals to Playlist.loopModes.NO
     *
     * @api public
     */
    loopMode: 0,
    
    /**
     * The current player's CID
     * Use getCurrentPlayer to get its instance
     *
     * @api private
     */
    _currentPlayer: null,
    
    /**
     * Removes old event listeners, sets the new one and listens to its events
     *
     * @param {Player} newPlayer
     * @param {Boolean} autoplay
     */
    setPlayer: function(newPlayer, autoplay) {
        
        // Remove old events listeners
        var old = this.getCurrentPlayer();
        if(old != null) {
            old.stop();
        }
        
        // Store new player
        this._currentPlayer = newPlayer;
        
        // Trigget event
        this.trigger("playerChange", newPlayer);
        
        // Autoplay
        if(!!autoplay) {
            newPlayer.play();
        }
        
        return newPlayer;
        
    },
    
    /**
     * Set current player by its Id
     *
     * @param {String} newPlayerId
     * @param {Boolean} autoplay
     * @api public
     */
    setPlayerById: function(newPlayerId, autoplay) {
        this.setPlayer(this.get(newPlayerId), autoplay);
    },
    
    /**
     * Returns the current player's model
     *
     * @return {Player}
     * @api public
     */
    getCurrentPlayer: function() {
        return this.get(this._currentPlayer);
    },
    
    getOrSetCurrentPlayer: function() {
        var player = this.getCurrentPlayer();
        if(player == null) {
            return this.nextPlayer();
        }
        return player;
    },
    
    /**
     * Player interactions
     */
    play: function() {
        this.getOrSetCurrentPlayer().play();
    },
    
    pause: function() {
        this.getCurrentPlayer().pause();
    },
    
    stop: function() {
        this.getCurrentPlayer().stop();
    },
    
    seek: function(percent) {
        this.getCurrentPlayer().seek(percent);
    },
    
    seekTo: function(ms) {
        this.getCurrentPlayer().seekTo(ms);
    },
    
    getState: function() {
        return this.getCurrentPlayer().getState();
    },
    
    getCurrentPosition: function() {
        return this.getCurrentPlayer().getCurrentPosition();
    },
    
    getDetails: function(callback) {
        this.getCurrentPlayer().getDetails(callback);
    },
    
    /**
     * Plays the next player in the list
     *
     * @param {Boolean} repeat True to start the playlist from the beginning if it ends
     */
    nextPlayer: function(startFromBeginning) {
        
        var current = this.getCurrentPlayer(),
            nextIndex = 0,
            startFromBeginning = !!startFromBeginning;
        
        if(current !== null) {
            nextIndex = this.indexOf(current) + 1;
        }
        
        if(!startFromBeginning && nextIndex >= this.length) {
            return;
        }
        
        nextIndex = nextIndex % this.length;
        
        return this.setPlayer(this.models[nextIndex], true);
    },
    
    previousPlayer: function(startFromEnd) {
        
         var current = this.getCurrentPlayer(),
            nextIndex = 0,
            startFromEnd = !!startFromEnd;
        
        if(current !== null) {
            nextIndex = this.indexOf(current) - 1;
        }
        
        if(nextIndex < 0) {
            if(startFromEnd) {
                nextIndex += this.length;
            } else {
                return;
            }
        }
        
        return this.setPlayer(this.models[nextIndex], true);
        
    },
    
    /**
     * Chooses a new random player to play next
     */
    randomPlayer: function() {
        
        return this.setPlayer(this.models[Math.floor(this.length * Math.random())], true);
        
    },
    
    /**
     * Callback for "finish" triggered by the current player
     *
     * @api private
     */
    _onFinish: function() {
        var loopMode = this.loopMode;
        
        switch(loopMode) {
            case Playlist.loopModes.NEXT:
                this.nextPlayer(false);
                break;
            case Playlist.loopModes.LOOP:
                this.nextPlayer(true);
                break;
            case Playlist.loopModes.RANDOM:
                this.randomPlayer();
                break;
        }
        
    }
    
});

Playlist.loopModes = {
    NO: 0,
    NEXT: 1,
    LOOP: 2,
    RANDOM: 3
}
var Model = Backbone.Model.extend({
    
    defaults: {
        rawDetails: null,
        details: null,
        videoId: null,
        videoUrl: null,
        playerId: null,
        state: Player.states.LOADING,
        currentPosition: null,
        duration: null
    },
    
    _setState: function(newState) {
        var state = Player.states[newState.toUpperCase()]
        this.set("state", state);
        this.trigger("stateChange", state);
    },
    
    _setCurrentPosition: function(ms) {
        this.set("currentPosition", ms);
        this.trigger("playProgress", {
            currentPosition: ms,
            relativePosition: ms / this.get("duration")
        });
    },
    
    seek: function(percent) {
        var this_ = this;
        this.getDetails(function(details) {
            this_.seekTo(percent * details.duration);
        });
    },
    
    getDetails: function(cb) {
        if(this.get("state") === Player.states.LOADING) {
            this.on("ready", _.bind(this.getDetails, this, cb));
            return;
        }
        
        var details = this.get("details")
        if(details !== null) {
            return cb(details);
        }
        
        var this_ = this;
        this._fetchDetails(function(details) {
            this_.set("details", details);
            cb(details);
        });
        
    },
    
    getCurrentPosition: function() {
        return this.get("currentPosition");
    },
    
    getDuration: function() {
        return this.get("duration");
    },
    
    getState: function() {
        return this.get("state");
    }
});
Player.prototype._providers.soundcloud = Model.extend({
    
    initialize: function(options) {
        
        this.set({
            playerId: options.playerId,
            url: options.videoUrl,
            videoId: options.videoId
        });
        
        var this_ = this;
        this_.widget = null;
        this._loadScript(function() {
            
            var el = document.createElement("iframe");
            el.setAttribute("id", options.playerId);
            el.setAttribute("src", "https://w.soundcloud.com/player/?url=" + encodeURIComponent(options.videoUrl));
            options.container.appendChild(el);
            
            
            var w = this_.widget = SC.Widget(el);
            w.bind(SC.Widget.Events.READY, _.bind(this_._onReady, this_));
            w.bind(SC.Widget.Events.PAUSE, _.bind(this_._onPause, this_));
            w.bind(SC.Widget.Events.PLAY, _.bind(this_._onPlay, this_));
            w.bind(SC.Widget.Events.FINISH, _.bind(this_._onFinish, this_));
            w.bind(SC.Widget.Events.PLAY_PROGRESS, _.bind(this_._onPlayProgress, this_));
        
        });
        
    },
    
    play: function() {
        this.widget.play();
    },
    
    pause: function() {
        this.widget.pause();
    },
    
    seekTo: function(ms) {
        this.widget.seekTo(ms);
        this._setCurrentPosition(ms);
    },
    
    stop: function() {
        this.pause();
        this.seek(0);
        this._setCurrentPosition(0);
        
        // The pause stateChanged will be fired after the stopped one
        // A timeout will prevent this
        var this_ = this;
        setTimeout(function() {
            this_._setState("stopped");
            this_.trigger("stop");
        }, 100);
    },
    
    _loadScript: function(callback) {
        
        // Soundcloud script already loaded
        if("SC" in window && SC) {
            callback();
            return;
        }
        
        var tag = document.createElement("script");
        tag.src = "https://w.soundcloud.com/player/api.js";
        
        tag.onload = function() {
            callback();
        };
        
        document.body.appendChild(tag);
        
    },
    
    _fetchDetails: function(cb) {
        
        this.widget.getCurrentSound(_.bind(function(sound) {
            this.set("rawDetails", sound);
            var details = {
                duration: sound.duration,
                id: sound.id,
                title: sound.title,
                createdAt: new Date(sound.created_at),
                thumbnails: [
                    {
                        width: 100,
                        height: 100,
                        url: sound.artwork_url
                    }
                ]
            };
            
            this.set("details", details);
            
            cb(details);
            
        }, this));
        
    },
    
    /**
     * Event listeners for SC.Widget.bind
     */
    _onReady: function() {
        var this_ = this;
        
        this.widget.getDuration(function(d) {
            this_.set("duration", d);
            this_._setState("ready");
            this_.trigger("ready");
        });
    },
    _onPause: function() {
        this._setState("paused");
        this.trigger("pause");
    },
    _onPlay: function() {
        this._setState("playing");
        this.trigger("play");
    },
    _onFinish: function() {
        this.stop();
        this._setState("finished");
        this.trigger("finish");
    },
    _onPlayProgress: function(data) {
        this.set("currentPosition", data.currentPosition);
        this.trigger("playProgress", data);
    }
    
});
Player.prototype._providers.youtube = Model.extend({
    
    initialize: function(options) {
        
        this.set({
            playerId: options.playerId,
            url: options.videoUrl,
            videoId: options.videoId
        });
        
        var el = document.createElement("div");
        el.setAttribute("id", options.playerId);
        options.container.appendChild(el);
        
        var this_ = this;
        var callback = function() {
            
            this_.player = new YT.Player(options.playerId, {
                videoId: options.videoId,
                events: {
                    onStateChange: function(event) {
                        this_._setStateById(event.data);
                    },
                    onReady: function() {
                        this_._onReady();
                    }
                }
            });
            
        }
        
        // Test if the youtube api is loaded
        if("YT" in window) {
            
            callback();
            
        } else {
            // Load YT iFrame API async
            var tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            
            onYouTubeIframeAPIReady._callbacks.push(callback);
        }
        
        this.on("play", this._setInterval);
        this.on("pause", this._clearInterval);
        this.on("finish", this._clearInterval);
    },
    
    _onReady: function() {
    
        // Duration is returned in secounds but we use ms
        this.set("duration", this.player.getDuration() * 1000);
        
        this._setState("ready");
        this.trigger("ready");
        
    },
    
    play: function() {
        // YouTube doesn't start the video from 0s
        // if it's stopped.
        // So we reset it manually
        if(this.get("state") === Player.states.STOPPED) {
            this.seekTo(0);
        }
        
        this.player.playVideo();
    },
    
    pause: function() {
        this.player.pauseVideo();
    },
    
    stop: function() {
        this.player.stopVideo();
        this.pause();
        
        this._setCurrentPosition(0);
        
        this._setState("stopped");
        this.trigger("stop");
    },
    
    seekTo: function(ms) {
        this._seekValue = ms;
        this._setCurrentPosition(ms);
        
        if(this._seekTimeoutSet) {
            return;
        }
        
        this._seekTimeoutSet = true;
        var this_ = this;
        setTimeout(function() {
            var ms = this_._seekValue;
            
            this_.player.seekTo(ms / 1000, true);
            this_._seekTimeoutSet = false;
        }, 500);
    },
    
    _seekValue: null,
    
    _seekTimeoutSet: false,
    
    _setInterval: function() {
        var this_ = this;
        
        this._intervalId = setInterval(function() {
            var pos = this_.player.getCurrentTime();
            this_._setCurrentPosition(pos * 1000);
        }, 1000);
    },
    
    _clearInterval: function() {
        clearInterval(this._intervalId);
        this._intervalId = null;
    },
    
    _fetchDetails: function(cb) {
        var this_ = this,
            xhr = new XMLHttpRequest();
        xhr.onload = function(ev) {
            var res = ev.target.responseText;
            try {
                res = JSON.parse(res).entry;
            } catch(e) {
                throw e;
            }
            this_.set("rawDetails", res);
            
            var details = {
                title: res.title.$t,
                duration: parseInt(res.media$group.yt$duration.seconds) * 1000,
                thumbnails: [],
                createdAt: new Date(res.published.$t)
            };
            
            _.each(res.media$group.media$thumbnail, function(img) {
                details.thumbnails.push({
                    height: img.height,
                    width: img.width,
                    url: img.url
                });
            });
            
            this_.set("details", details);
            cb(details);
        };
        xhr.open("get", "https://gdata.youtube.com/feeds/api/videos/" + this.get("videoId") + "?v=2&alt=json", true);
        xhr.send();
    },
    
    /**
     * This method is identically to _setState except it accepts states which are emitted by the youtube player.
     * It will also trigger play/pause events
     *
     * Possible values are:
       -1 (unstarted)
        0 (ended)
        1 (playing)
        2 (paused)
        3 (buffering)
        5 (video cued)
     *
     * @param {Number} state
     */
    _setStateById: function(ytState) {
        
        var states = {
            "-1": "loading",
            0: "finished",
            1: "playing",
            2: "paused",
            3: null,
            5: "ready"
        };
        
        var state = states[ytState];
        if(state === null) return;
        this._setState(state);
        
        if(state === "playing") {
            this.trigger("play");
        } else if(state == "paused") {
            this.trigger("pause");
        } else if(state == "finished") {
            this.trigger("finish");
        }
    }
    
});

if(window.onYouTubeIframeAPIReady && console && console.log) {
    
    console.log("[Polyplayer] There is already a function `onYouTubeIframeAPIReady` declared. It will be overwritten");
    
}

window.onYouTubeIframeAPIReady = function(playerId) {
    for(var i = 0; i < onYouTubeIframeAPIReady._callbacks.length; i++) {
        onYouTubeIframeAPIReady._callbacks[i]();
    }
}

window.onYouTubeIframeAPIReady._callbacks = [];

Player.prototype._providers.vimeo = Model.extend({
    
    initialize: function(options) {
        
        this.set({
            playerId: options.playerId,
            url: options.videoUrl,
            videoId: options.videoId
        });
        
        var iframe = document.createElement("iframe");
        iframe.setAttribute("id", options.playerId);
        iframe.setAttribute("src", "http://player.vimeo.com/video/" + options.videoId + "?api=1&player_id=" + options.playerId);
        options.container.appendChild(iframe);
        var player = this.player = $f(iframe);
        
        var this_ = this;
        player.addEvent("ready", function() {
            
            player.api("getDuration", function(num) {
                this_.set("duration", parseInt(num * 1000));
                
                this_._setState("ready");
                this_.trigger("ready");
            });
            
            player.addEvent("playProgress", function(data) {
                this_.trigger("progress", {
                    relativePosition: data.percent
                });
            });
            
            player.addEvent("play", function() {
                this_._setState("playing");
                this_.trigger("play");
            });
            
            player.addEvent("pause", function() {
                this_._setState("paused");
                this_.trigger("pause");
            });
            
            player.addEvent("finish", function() {
                this_.stop();
                this_._setState("finished");
                this_.trigger("finish");
            });
            
            player.addEvent("playProgress", function(data) {
                this_.set("currentPosition", data.seconds * 1000);
                this_.trigger("playProgress", {
                    currentPosition: data.seconds * 1000,
                    relativePosition: data.percent
                });
            });
        });
        
    },
    
    play: function() {
        this.player.api("play");
    },
    
    pause: function() {
        this.player.api("pause");
    },
    
    seekTo: function(ms) {
        this.player.api("seekTo", ms / 1000);
        this._setCurrentPosition(ms);
    },
    
    stop: function() {
        this.pause();
        this.seek(0);
        this._setCurrentPosition(0);
        
        this._setState("stopped");
        this.trigger("stop");
    },
    
    _fetchDetails: function(cb) {
        
        var this_ = this,
            xhr = new XMLHttpRequest();
        
        xhr.onload = function(ev) {
            var res = ev.target.responseText;
            try {
                res = JSON.parse(res)[0];
            } catch(e) {
                throw e;
            }
            this_.set("rawDetails", res);
            
            // FF and IE can't parse dates in the format YYYY-MM-DD HH:MM:SS, e.g. 2011-01-17 16:33:58
            // We need to extract the data by ourselves and put them onto Date
            // new Date(year, month [, day, hour, minute, second, millisecond]);
            // Date's month arguments begins with 0 (0 = Jan, 1 = Feb, etc)
            var re = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(res.upload_date),
                date = new Date(re[1], re[2] - 1, re[3], re[4], re[5], re[6]);
            
            var details = {
                title: res.title,
                duration: parseInt(res.duration) * 1000,
                thumbnails: [
                    {
                        width: 100,
                        height: 100,
                        url: res.thumbnail_small
                    },
                    {
                        width: 200,
                        height: 200,
                        url: res.thumbnail_medium
                    },
                    {
                        width: 640,
                        height: 640,
                        url: res.thumbnail_large
                    }
                ],
                createdAt: date
            };
            
            
            this_.set("details", details);
            cb(details);
        };
        xhr.open("get", "http://vimeo.com/api/v2/video/" + this.get("videoId") + ".json", true);
        xhr.send();
        
    }
    
});


    var PP = {};
    PP.Player = Player;
    PP.Playlist = Playlist;
    
    window.PP = PP;
    
})(window);