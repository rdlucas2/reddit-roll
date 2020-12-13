function decodeHtml(html) {
    var txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
}

var ajax = (function() {
    return {
        GET: function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = function() {
                if (xhr.status === 200) {
                    callback(xhr);
                } else {
                    alert('Error calling: ' + url + ' - Status: ' + xhr.status);
                    console.log(xhr);
                }
            }
            xhr.send();
        }
    }
})();

var redditapi = (function() {
    var subreddit_list_url = 'https://www.reddit.com/reddits.json';

    return {
        generateSubredditUrl: function(subreddit) {
            return 'https://www.reddit.com/r/' + subreddit;
        },

        generateSubredditJsonUrl: function(subreddit) {
            return 'https://www.reddit.com/r/' + subreddit + '/top/.json?limit=100';
        },

        getSubreddits: function(callback) {
            ajax.GET(subreddit_list_url, function(xhr) {
                callback(JSON.parse(xhr.responseText));
            });
        },

        getSubredditJson: function(subreddit, callback) {
            var self = this;
            ajax.GET(self.generateSubredditJsonUrl(subreddit), function(xhr) {
                callback(JSON.parse(xhr.responseText));
            });
        }
    }
})();

var app = (function() {
    var subredditul = function() {
        return document.getElementById('list_subreddit');
    }

    var contentdiv = function() {
        return document.getElementById('content');
    }

    var addHR = function(elem) {
        elem.appendChild(document.createElement('hr'));
    }

    var textbox = function() {
        return document.getElementById('subreddit');
    }

    var render = function(response) {
        if (response.kind === 'Listing') {
            for (var i = 0; i < response.data.children.length; i++) {
                var item = response.data.children[i];
                var url = item.data.url;
                var parentElemToAppend = null;
                if (url && (url.includes('.jpg' || url.includes('.gif' || url.includes('.png'))))) {
                    if (url.includes('.gifv')) {
                        var vid = document.createElement('iframe');
                        vid.setAttribute('src', url);
                        parentElemToAppend = vid;
                    } else {
                        var img = document.createElement('img');
                        img.setAttribute('src', url);
                        img.setAttribute('class', 'content-item');
                        parentElemToAppend = img;
                    }
                } else if (item.data.secure_media_embed.content) {
                    var img = document.createElement('img');
                    img.setAttribute('src', item.data.secure_media.oembed.thumbnail_url);
                    img.setAttribute('class', 'content-item');
                    parentElemToAppend = img;
                    // var div = document.createElement('div')
                    // div.setAttribute('class', 'content-item')
                    // div.innerHTML = decodeHtml(item.data.secure_media_embed.content)
                    // parentElemToAppend = div
                }
                if (parentElemToAppend) {
                    var authorUrl = 'https://reddit.com/user/' + item.data.author;
                    var permalink = 'https://reddit.com' + item.data.permalink;
                    parentElemToAppend.setAttribute('data-author', authorUrl);
                    parentElemToAppend.setAttribute('data-link', permalink);
                    contentdiv().appendChild(parentElemToAppend);
                }
            }

            var classname = document.getElementsByClassName('content-item');

            var destroy = (event) => {
                var viewAuth = false;
                var viewReddit = false; //
                viewAuth = confirm('View Author?');
                if (viewAuth) {
                    window.open(event.target.dataset.author, '_blank');
                    document.getElementById('blowup').remove();
                    return;
                } else {
                    viewReddit = confirm('View On Reddit?');
                    if (viewReddit) {
                        window.open(event.target.dataset.link, '_blank');
                        document.getElementById('blowup').remove();
                        return;
                    } else {
                        document.getElementById('blowup').remove();
                        return;
                    }
                }
            }

            var enlarge = (event) => {
                var div = document.createElement('div');
                var clone = event.target.cloneNode(true);
                div.appendChild(clone);
                div.setAttribute('id', 'blowup');
                div.setAttribute('data-author', event.target.dataset.author);
                div.setAttribute('data-link', event.target.dataset.link);
                document.getElementsByTagName('body')[0].appendChild(div);
                div.addEventListener('click', destroy, false);
            }

            for (var i = 0; i < classname.length; i++) {
                classname[i].addEventListener('click', enlarge, false);
            }
        }
    }

    return {
        init: function() {

            textbox().addEventListener('keyup', (event) => {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    redditapi.getSubredditJson(textbox().value, function(response) {
                        console.log(response);
                        contentdiv().innerHTML = '';
                        render(response);
                    });
                }
            })



            // redditapi.getSubreddits(function(response) {
            //     for (var i = 0; i < response.data.children.length; i++) {
            //         var display_name = response.data.children[i].data.display_name
            //         var subreddit_relative_url = response.data.children[i].data.url
            //         var link = redditapi.generateSubredditUrl(display_name)

            //         //TODO: how to get ALL subreddits?
            //         //TODO: instead of generate a list of links, make them clickable buttons that fill out the input
            //         //TODO: check nsfw filter and adjust results accordingly

            //         var anchor = document.createElement('a')
            //         var li = document.createElement('li')
            //         anchor.appendChild(document.createTextNode(subreddit_relative_url))
            //         anchor.setAttribute('href', link)
            //         anchor.setAttribute('target', '_blank')
            //         li.setAttribute('class', 'menu-item')
            //         li.appendChild(anchor)
            //         subredditul().appendChild(li)
            //     }
            // })

            redditapi.getSubredditJson('all', function(response) {
                console.log(response);
                render(response);
            })
        }
    }
})();

app.init();