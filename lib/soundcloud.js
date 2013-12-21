Player.prototype._providers.soundcloud = Player.Model.extend({
    
    initialize: function(options) {
        
        this.set({
            playerId: options.playerId,
            url: options.videoUrl,
            videoId: options.videoId
        });
        
        var el = document.createElement("iframe");
        el.setAttribute("id", options.playerId);
        el.setAttribute("src", "https://w.soundcloud.com/player/?url=" + encodeURIComponent(options.videoUrl));
        options.container.appendChild(el);
        
        
        var w = this.widget = SC.Widget(el);
        w.bind(SC.Widget.Events.READY, _.bind(this._onReady, this));
        w.bind(SC.Widget.Events.PAUSE, _.bind(this._onPause, this));
        w.bind(SC.Widget.Events.PLAY, _.bind(this._onPlay, this));
        w.bind(SC.Widget.Events.FINISH, _.bind(this._onFinish, this));
        w.bind(SC.Widget.Events.PLAY_PROGRESS, _.bind(this._onPlayProgress, this));
        
        
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