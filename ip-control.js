/*  Copyright 2013 Steven Liekens
Contact: steven.liekens@gmail.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  */

var STB = STB || ( function() {
        var STB = {};

        /*******************
         * Private Members *
         *******************/
        var baseUrl = "/cgi-bin/do";
        var Output = {
            command_status : "commandStatus",
            error_kind : "errorKind",
            error_description : "errorDescription",
            protocol_version : "protocolVersion",
            player_state : "playerState",
            playback_speed : "playbackSpeed",
            playback_duration : "playbackDuration",
            playback_position : "playbackPosition",
            playback_is_buffering : "playbackIsBuffering",
            playback_volume : "playbackVolume",
            playback_mute : "playbackMute",
            audio_track : "audioTrack",
            playback_window_fullscreen : "playbackWindowFullscreen",
            playback_window_rect_x : "playbackWindowRectLeftMargin",
            playback_window_rect_y : "playbackWindowRectTopMargin",
            playback_window_rect_width : "playbackWindowRectWidth",
            playback_window_rect_height : "playbackWindowRectHeight",
            osd_width : "onScreenDisplayWidth",
            osd_height : "onScreenDisplayHeight",
            playback_video_width : "playbackVideoWidth",
            playback_video_height : "playbackVideoHeight",
            video_enabled : "videoEnabled",
            video_zoom : "videoZoom",
            playback_dvd_menu : "playbackDvdMenu",
            playback_bluray_dmenu : "playbackBlurayMenu",
            playback_state : "playbackState",
            previous_playback_state : "previousPlaybackState",
            last_playback_event : "lastPlaybackEvent",
            playback_url : "playbackUrl",
            subtitles_track : "subtitlesTrack",
            playback_clip_rect_x : "playbackClippingRegionLeftMargin",
            playback_clip_rect_y : "playbackClippingRegionTopMargin",
            playback_clip_rect_width : "playbackClippingRegionWidth",
            playback_clip_rect_height : "playbackClippingRegionHeight",
            video_on_top : "videoOnTop",
            text : "text",
            pause_is_available : "pauseIsAvailable",
            teletext_available : "teletextAvailable",
            teletext_enabled : "teletextEnabled",
            teletext_mix_mode : "teletextMixMode",
            teletext_page_number : "teletextPageNumber",

            getValue : function(name, value) {
                switch (name) {
                    case "protocol_version":
                    case "playback_speed":
                    case "playback_duration":
                    case "playback_position":
                    case "playback_volume":
                    case "audio_track":
                    case "playback_window_rect_x":
                    case "playback_window_rect_y":
                    case "playback_window_rect_width":
                    case "playback_window_rect_height":
                    case "osd_width":
                    case "osd_height":
                    case "playback_video_width":
                    case "playback_video_height":
                    case "subtitles_track":
                    case "playback_clip_rect_x":
                    case "playback_clip_rect_y":
                    case "playback_clip_rect_width":
                    case "playback_clip_rect_height":
                    case "teletext_page_number":
                        return Number(value);
                    case "playback_is_buffering":
                    case "playback_mute":
                    case "playback_window_fullscreen":
                    case "video_enabled":
                    case "playback_dvd_menu":
                    case "playback_bluray_dmenu":
                    case "video_on_top":
                    case "pause_is_available":
                    case "teletext_enabled":
                    case "teletext_mix_mode":
                        return Boolean(Number(value));
                    default:
                        return value;
                }
            }
        };

        function Parameter(element) {
            this.name = element.getAttribute("name");
            this.value = Output.getValue(this.name, element.getAttribute("value"));
        }

        function Track() {
            this.language;
            this.codec;
        }

        function CommandResult(xml) {
            var parameters = xml.getElementsByTagName("param");
            for (var i = 0; i < parameters.length; i++) {
                var parameter = new Parameter(parameters[i]);
                
                if (parameter.value === "-1" || parameter.value === "und") {// skip parameters that are not applicable
                    continue;
                }

                if (Output.hasOwnProperty(parameter.name)) {
                    this[Output[parameter.name]] = parameter.value;
                } else if (parameter.name.indexOf("." > -1)) {
                    var index = parameter.name.slice(parameter.name.indexOf(".") + 1, parameter.name.lastIndexOf("."));
                    var track;

                    switch (parameter.name.slice(0, parameter.name.indexOf("."))) {
                        case "audio_track":
                            if (!this.audioTracks) {
                                this.audioTracks = []
                            };
                            if (!this.audioTracks[index]) {
                                this.audioTracks[index] = new Track();
                            }
                            track = this.audioTracks[index];
                            break;
                        case "subtitles_track":
                            if (!this.subtitlesTracks) {
                                this.subtitlesTracks = []
                            };
                            if (!this.subtitlesTracks[index]) {
                                this.subtitlesTracks[index] = new Track();
                            }
                            track = this.subtitlesTracks[index];
                            break;
                    }

                    switch (parameter.name.slice(parameter.name.lastIndexOf(".")+1)) {
                        case "lang":
                            track.language = parameter.value;
                            break;
                        case "codec":
                            track.codec = parameter.value;
                            break;
                    }
                } else {
                    console.log("Unknown parameter: " + parameter.name + " (" + parameter.value + ")");
                }
            }
        }

        function handleResponse(data) {
            if (!data) {
                return;
            }
            return new CommandResult(data);
        }

        function get(request, response) {
            if (!request) {
                return;
            }
            var jqXHR = $.ajax(baseUrl, {
                type : "GET",
                data : request,
                dataType : "xml"
            });

            if (!response) {
                return
            }

            jqXHR.done(function(data) {
                response(handleResponse(data))
            });
        };

        // TODO: Find a workaround for browsers that enforce a content-type with charset=UTF-8.
        function post(request, response) {
            if (!request) {
                return;
            }
            var query = $.param(request);
            var jqXHR = $.ajax(baseUrl, {
                type : "POST",
                data : query,
                contentType : "application/x-www-form-urlencoded",
                //contentType : "multipart/form-data;boundary="+query.slice(query.length-5),
                dataType : "xml"
            });

            if (!response) {
                return;
            }

            jqXHR.done(function(data) {
                response(handleResponse(data));
            });
        };

        /******************
         * Public Members *
         ******************/
        STB.status = function(success, timeout) {
            var request = {
                cmd : "status",
                timeout : timeout
            }
            get(request, success);
        };

        STB.standby = function(success, timeout) {
            var request = {
                cmd : "standby",
                timeout : timeout
            };
            //post(request, success);
            get(request, success);
        };

        STB.mainScreen = function(success, timeout) {
            var request = {
                cmd : "main_screen",
                timeout : timeout
            };
            //post(request, success);
            get(request, success);
        };

        STB.blackScreen = function(success, timeout) {
            var request = {
                cmd : "black_screen",
                timeout : timeout
            };
            //post(request, success);
            get(request, success);
        };

        return STB;
    }());
