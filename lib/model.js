Player.Model = Backbone.Model.extend({
    
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