var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var articleSchema = new Schema({
    id: String,
    title: String,
    abstract: String,
    look: Number,
    comments: Number,
    link: Number,
    content: String
});

var Article = mongoose.model('Article', articleSchema);

module.exports = Article;