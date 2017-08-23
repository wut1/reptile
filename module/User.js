var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({
    id: { type: String, unique: true },
    email: { type: String },
    password: String,
    passwordRestToken: String,
    passwordRestExpires: Date,
    github: String,
    tokens: Array,
    name: String,
    avatar: String,
    notes: [{
        type: Number,
        ref: 'Article'
    }]
})

var User = mongoose.model('User', userSchema);

module.exports = User;