// ==UserScript==
// @name       douban common interests
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description  enter something useful
// @match      http://www.douban.com/event/*
// @match      http://www.douban.com/group/*
// @match      http://www.douban.com/*contacts/*
// @match      http://www.douban.com/people/*/contacts
// @copyright  2012+, You
// @require    http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

$(document).ready(function() {
    function getCommonCount(data) {
        var dom = $(data);
        var common = $('#common', dom),
            sum = $('h2', common).html();
        if (common.length === 0) {
            return 0;
        }
        var num = sum.slice(sum.lastIndexOf('(')).trim();
        if (num === '' || num[0] !== '(') {
            return $('ul#win>li', dom).children().length;
        }
        
        return parseInt(num.match(/\((\d+)\)/)[1], 10);
    }
    
    var memberHref = 'http://www.douban.com/people/';
    var movieHref = 'http://movie.douban.com/people/';
    var memberLinkRegex = /http\:\/\/www\.douban\.com\/\w*\/*people\/(\w*)/;
    
    var button = $('<button style="font-size: 12px; padding: 5px">all</button>');
    var buttonSeeMovie = $('<button style="font-size: 12px; padding: 5px">no movie</button>');
    var control = $('#content>h1:first-child,#db-usr-profile');
    
    control.append(button);
    control.append(buttonSeeMovie);
    
    function createFillCommonCountFunc(baseUrls, algorithm) {
        return function fillCommonCount() {
            $.each($('#content .name a, #content h3 a, #content dd a'), function(i, a) {
                var link = $(a),
                    match = link.attr('href').match(memberLinkRegex);
                if (!match) {
                    return;
                }
                
                
                var counts = [];
                var completed = 0;
                $.each(baseUrls, function(i, baseUrl) {
                    var href = baseUrl + match[1]; 
                    
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: href,
                        headers: {
                            'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
                            'Accept': 'text/html',
                        },
                        onload: function(response) {
                            completed++;
                            counts[i] = getCommonCount(response.responseText);
                            if (completed === baseUrls.length) {
                                var count = algorithm(counts);
                                if (count === 0) {
                                    link.closest('li,dl').remove();
                                } else {
                                    link.attr('href', memberHref + match[1]);
                                    link.parent().append('<span style="color: red">(' + count + ')</span>');
                                }
                            }
                        }
                    }); 
                });
            });
        };
    }
    button.click(createFillCommonCountFunc([memberHref], function(counts) { return counts[0]; }));
    buttonSeeMovie.click(createFillCommonCountFunc([memberHref, movieHref], function(counts) { return counts[0] - counts[1]; }));
});
