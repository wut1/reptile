var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var articleSchema = new Schema({
    _id: { type: Number, unique: true },
    _creator: { type: String, ref: 'User' },
    title: String,
    time: Date,
    content: String,
    meta: {
        look: Number,
        favs: Number,
        comments: Number,
    }
});

var Article = mongoose.model('Article', articleSchema);
module.exports = Article;