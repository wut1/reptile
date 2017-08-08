var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('mongdb连接上!')
});
var Crawler = require("crawler");
var Article = require('./module/Article');
var c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function(error, res, done) {
        if (error) {
            console.log(error);
        } else {
            var $ = res.$;
            $('.note-list').children('li').each(function(i) {
                    var id = $(this).data('note-id');
                    var articleUrl = $(this).find('.title').attr('href');
                    var title = $(this).find('.title').text();
                    var abstract = $(this).find('.abstract').text();
                    var $meta = $(this).find('.meta');
                    var look = $meta.children('a').eq(0).text();
                    var comments = $meta.children('a').eq(1).text();
                    var link = $meta.children('span').eq(0).text();
                    var content = paArticle(articleUrl);
                    var Article = new Article({
                        id: id,
                        title: title,
                        abstract: abstract,
                        look: look,
                        comments: comments,
                        link: link,
                        content: content
                    });
                    Article.save(function(err, fluffy) {
                        if (err) return console.error(err);
                        console.log('保存成功')
                    });
                })
                // $ is Cheerio by default
                //a lean implementation of core jQuery designed specifically for the server
        }
        done();
    }
});

// Queue just one URL, with default callback
c.queue('http://www.jianshu.com/c/e50258a6a44b');

function paArticle(url) {
    c.queue([{
        uri: 'http://www.jianshu.com' + url,
        // The global callback won't be called
        callback: function(error, res, done) {
            if (error) {
                console.log(error);
            } else {
                var $ = res.$;
                return $('.show-content').html();
            }
            done();
        }
    }]);
}