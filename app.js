var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('mongdb连接上!')
});
var Crawler = require("crawler");
var Article = require('./module/Article');
var User = require('./module/User');
var c = new Crawler({
    maxConnections: 20,
    // This will be called for each crawled page
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;
            $('.note-list').children('li').each(function(i) {
                var id = +$(this).data('note-id');
                var articleUrl = $(this).find('.title').attr('href');
                var title = $(this).find('.title').text();
                var $avatar = $(this).find('.avatar');
                var userUrl = $avatar.attr('href');
                var time = Date($(this).find('.time').data());
                var $meta = $(this).find('.meta');
                var look = +$meta.children('a').eq(0).text();
                var comments = +$meta.children('a').eq(1).text();
                var favs = $meta.children('span').eq(0).text();
                var obj = {
                        id: id,
                        title: title,
                        time: time,
                        meta: {
                            look: look,
                            favs: favs,
                            comments: comments,
                        }
                    }
                    //if (i == 0) {
                paArticle(articleUrl, userUrl, obj);
                //}
            })

            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
        }
        done();
    }
});

// Queue just one URL, with default callback

for (var i = 1; i <= 10; i++) {
    c.queue({ uri: 'http://www.jianshu.com/c/e50258a6a44b?order_by=added_at&page=' + i });
}



function paArticle(url, userUrl, obj) {
    c.queue([{
        uri: 'http://www.jianshu.com' + url,
        // The global callback won't be called
        callback: function(error, res, done) {
            if (error) {
                console.log(error);
            } else {
                var $ = res.$;
                var content = $('.author').next().html();
                var article = Object.assign({}, { content: content }, obj);
                paUser(userUrl, article);
            }
            done();
        }
    }]);
}

function paUser(url, article) {
    c.queue([{
        uri: 'http://www.jianshu.com' + url,
        // The global callback won't be called
        callback: function(error, res, done) {
            if (error) {
                console.log(error);
            } else {
                var $ = res.$;
                var $user = $('.avatar');
                var id = url.split('/')[2];
                var avatar = $user.children('img').attr('src');
                var name = $('.name').eq(0).text();
                var user = {
                    id: id,
                    avatar: avatar,
                    name: name
                }

                saveData(article, user);
            }
            done();
        }
    }]);
}

function saveData(article, userObj) {
    var user = new User(userObj);
    var queryUser = User.where({ id: user.id });
    queryUser.findOne(function(err, User) {
        if (err) return;
        if (!User) {
            user.save(function(err) {
                if (err) return;
            })
        }
    })
    var articleObj = Object.assign({}, {
        _creator: user.id
    }, article)
    var article1 = new Article(articleObj);
    var query = Article.where({ id: articleObj.id });
    query.findOne(function(err, Article) {
        if (err) return;
        if (!Article) {
            article1.save(function(err) {
                if (err) return;
            })
        }
    });
}