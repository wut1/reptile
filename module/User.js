var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({
    id: String,
    name: String,
    avatar: String,
    notes: [{
        type: Schema.Types.ObjectId,
        ref: 'Article'
    }]
})

var User = mongoose.model('User', userSchema);

module.exports = User;