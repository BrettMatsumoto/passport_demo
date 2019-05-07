const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const cookieParser = require('cookie-parser');

const User = require('./database/models/User');

const guard = require('./middleware/guard');

// invoke express
const app = express();
const PORT = 3000;

// copied from docs
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new localStrategy(function(username, password, done) {
    return new User({ username: username })
      .fetch()
      .then((user) => {
        console.log(user);

        if (user === null) {
          return done(null, false, { message: 'bad username or password' });
        } else {
          user = user.toJSON();
          // happy route
          if (user.password === password) {
            return done(null, user);
            // error route. username exists, pw not matched
          } else {
            return done(null, false, { message: 'bad username or password' });
          }
        }
      })
      .catch((err) => {
        console.log('error:', err);
        return done(err);
      });
  }),
);

// different serial everytime
// s%3ArGT-6Dn7YV5qkkEInJkZ0U9npSTxKJm4.IEQC8O0QO23dBowWLOGYns7tD7zJ47oBvqxY3niI%2Bik
// s%3AK_LECkkxxX7qs6a7t7Nc3_zcNJ24C8Zi.r%2FPSLyo5PRSF2tR5qiF1AUGrh0s%2Bw7IDEp1ac97DJnI

// create session for user & send cookie
passport.serializeUser(function(user, done) {
  console.log('serializing');
  return done(null, { id: user.id, username: user.username });
});

// will fire if session id/user (in session storage) + cookie (user's) && outside of public route
passport.deserializeUser(function(user, done) {
  console.log('deserializing');
  console.log(user);

  return new User({ id: user.id }).fetch().then((user) => {
    user = user.toJSON();
    done(null, {
      id: user.id,
      username: user.username,
      email: user.email,
    });
  });
});

app.get('/smoke', (req, res) => {
  console.log('in smoke route');
  console.log(req.isAuthenticated());
  // object will always be .user (reqardless of what object gets passed thru)
  console.log(req.user);
  if (req.isAuthenticated()) {
    return res.send(`Hello ${req.user.username}`);
  } else {
    return res.send("I don't know who you are.");
  }
});

// function guard(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   } else {
//     return res.redirect('/login');
//   }
// }

app.get('/secret', guard, (req, res) => {
  return res.send('You found the secret');
});

app.use(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login.html',
    // failureFlash: true,
  }),
);

app.post('/register', (req, res) => {
  return new User({
    username: req.body.username,
    password: req.body.password,
  })
    .save()
    .then((user) => {
      console.log(user);
      return res.redirect('/login.html');
    })
    .catch((err) => {
      console.log('error:', err);
      return res.send('Error creating account');
    });
});

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
