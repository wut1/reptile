var mongoose = require('mongoose');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
// var dotenv = require('dotenv');
// dotenv.config();
mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("数据库连接上了")
});
var Crawler = require("crawler");
var Article = require('./module/Article');
var User = require('./module/User');
var c = new Crawler({
    maxConnections: 10,
    //rateLimit: 100,
    // This will be called for each crawled page
    jQuery: {
        name: 'cheerio',
        options: {
            decodeEntities: false
        }
    },
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;
            $('.note-list').children('li').each(function(i) {
                var id = $(this).data('note-id');
                var articleUrl = $(this).find('.title').attr('href');
                var title = $(this).find('.title').text();
                var $avatar = $(this).find('.avatar');
                var userUrl = $avatar.attr('href');
                var timeText = $(this).find('.time').data('shared-at');
                var time = new Date(timeText);
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
                paArticle(articleUrl, userUrl, obj);

            })
        }
        done();
    }
});

// Queue just one URL, with default callback
function initPa() {
    var arr = [];
    for (var i = 1; i <= 10; i++) {
        arr.push('http://www.jianshu.com/c/e50258a6a44b?order_by=added_at&page=' + i)

    }
    c.queue(arr)
}

setInterval(function() {
    initPa();
}, 60 * 60 * 1000)

initPa();



function paArticle(url, userUrl, obj) {
    c.queue([{
        uri: 'http://www.jianshu.com' + url,
        // The global callback won't be called
        callback: function(error, res, done) {
            if (error) {
                console.log(error);
            } else {
                var $ = res.$;
                var content = $('.author').next();
                content.find('.image-caption').each(function(i) {
                    if ($(this).text() == '图片发自简书App') {
                        $(this).text('图片来自异次元');
                    }
                })
                content.find('img').each(function() {
                    var src = $(this).attr('src');
                    $(this).attr('src', 'http:' + src);
                })
                var contentHtml = content.html();
                var article = Object.assign({}, { content: contentHtml }, obj);
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
var i = 0;

function saveData(article, userObj) {
    var user = new User(userObj);
    User.findOne({ id: userObj.id }, (err, userModel) => {
        if (err) return;
        if (!userModel) {
            user.save(function(error, usm) {
                if (error) return;
                var articleObj = Object.assign({}, {
                    _creator: usm._id
                }, article)
                var article1 = new Article(articleObj);
                article1.save(function(error1) {
                    if (error1) { return };
                })
            })
        } else {
            var articleObj = Object.assign({}, {
                _creator: userModel._id
            }, article)
            var article1 = new Article(articleObj);
            article1.save(function(error) {
                if (error) { return };
            })
        }
    })
}