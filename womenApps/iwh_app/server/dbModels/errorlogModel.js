var mongoose = require('mongoose');
module.exports = mongoose.Schema({
    message: String,    
    modulename: String,
    errorStack: String,
    Created_date : { type : Date, default: Date.now }
});