// //var config = require('config');
// var connection = require('../connection.js');
// var mongoose = require('mongoose');
// var ErrorLogs = require('./../dbmodels/errorlogmodel.js');
//
// var ErrorLogsInfo = mongoose.model('errorlogs', ErrorLogs, 'errorlogs');
//
// function ErrorLogInterface() {
//     if (!(this instanceof ErrorLogInterface))
//         return new ErrorLogInterface();
// }
//
// ErrorLogInterface.prototype.logError = function(errorLogModel) {
//
//     var logger = ErrorLogsInfo(errorLogModel);
//
//     // save the user
//     logger.save(function(err) {
//         if (err) throw console.log(err);
//     });
//
// };
//
// module.exports = ErrorLogInterface;