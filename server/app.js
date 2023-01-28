const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const parseCookies = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(parseCookies);
app.use(Auth.createSession);


app.get('/',
  (req, res) => {
    // console.log('reqreqreq', req);
    if (Auth.verifySession(req.session)) {
      // res.redirect('/');
      res.render('index');
    } else {
      res.redirect('/login');
    }
    // res.render('index');
  });

app.get('/create',
  (req, res) => {
    res.render('index');
  });

app.get('/links',
  (req, res, next) => {
    if ( Auth.verifySession(req.session)) {
      models.Links.getAll()
        .then(links => {
          res.status(200).send(links);
        })
        .error(error => {
          res.status(500).send(error);
        });
    } else {
      res.redirect('/login');
    }
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  models.Users.get({username: username})
    .then((user) => {
      if (user) {
        res.redirect('/signup');
      } else {
        models.Users.create( {username, password} )
          .then((result) => {
            models.Sessions.update({hash: req.session.hash}, {userId: result.insertId})
              .then(() => {
                res.redirect('/');
              });
          });
      }
    })
    .catch(() => {
      console.log(err);
    });
});

app.post('/login', (req, res) => {
  var attemptedUsername = req.body.username;
  var attemptedPassword = req.body.password;

  models.Users.get({username: attemptedUsername})
    .then((data) => {
      var success = models.Users.compare(attemptedPassword, data.password, data.salt);
      if (success) {
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    })
    .catch(() => {
      res.redirect('/login');
    });
});

app.get('/logout', (req, res) => {
  // console.log('req', req);
  var hash = req.session.hash;
  models.Sessions.delete({hash: hash}).then(() => {
    res.clearCookie('shortlyid');
    res.redirect('/login');
  })
    .catch(() => {
      console.log(err);
    });
});
/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
