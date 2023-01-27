const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) {
    models.Sessions.create()
      .then((data) => {
        models.Sessions.get({id: data.insertId})
          .then((session) => {
            req.session = {};
            req.session.hash = session.hash;
            return session.hash;
          })
          .then((hash) => {
            res.cookie('shortlyid', hash);
            next();
          });
      });
  } else {
    var hash = req.cookies['shortlyid'];
    models.Sessions.get({hash: hash})
      .then((session) => {
        console.log('session', session);
        req.session = {};
        req.session.hash = session.hash;
        req.session.id = session.userId;
        req.session.username = session.user.username;
        next();
      });

  }
};

// req: {
//   session: {
//     hash: hduishdiuhs782738273;
//     username:
//     userID:
//   }
// }

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

//request has an session object, response has cookies object