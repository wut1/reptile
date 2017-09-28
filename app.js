var mongoose = require('mongoose');
var cheerio = require('cheerio');
var iconv = require('iconv-lite');
var escaper = require("true-html-escape");
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
    maxConnections: 50,
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
function initPa() {
    //var arr=[];
    for (var i = 1; i <= 10; i++) {
        // arr.push('http://www.jianshu.com/c/e50258a6a44b?order_by=added_at&page=' + i)
        setTimeout(function() {
            c.queue('http://www.jianshu.com/c/e50258a6a44b?order_by=added_at&page=' + i)
        })

    }

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
                contentHtml = escaper.unescape(content.html());
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
    user.save(function(err) {
        var articleObj = Object.assign({}, {
            _creator: user._id
        }, article)
        var article1 = new Article(articleObj);
        article1.save(function(err) {
            if (err) { return };
        })
    })

}