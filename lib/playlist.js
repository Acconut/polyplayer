"use strict";

var Backbone = require("backbone"),
    Player = require("./player"),
    _ = require("underscore");

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

module.exports = Playlist;
