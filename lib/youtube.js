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
            document.body.appendChild(tag);
            
            tag.onload = function() {
                YT.ready(callback);
            };
            
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
