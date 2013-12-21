window.Player = function Player(givenOptions) {
    
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
        
        var result = /^(https?:\/\/)?(www.)?([a-z0-9\-]+)\.[a-z]+(\/(.*))?/i.exec(url);
        
        if(result === null) {
            throw "Invalid url";
        }
        
        var urlProvider = result[3].toLowerCase(),
            path = result[5] || "";
        
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
            
            result.videoId = parseInt(path.substr(1));
            
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