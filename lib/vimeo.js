"use strict";

var Player = require("./player"),
    Model = require("./model"),
    $f = require("../vendor/froogaloop"),
    _ = require("underscore");

module.exports = Model.extend({
    
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
