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
        if (session) {
          req.session = session;
          next();
        } else {
          models.Sessions.create()
            .then((data) => {
              return models.Sessions.get({id: data.insertId});
            })
            .then((session) => {
              var hash = session.hash;
              res.cookie('shortlyid', hash);
              next();
            });
        }
      })
      .catch(() => {
        console.log(err);
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

//request has an session object, response has cookies object