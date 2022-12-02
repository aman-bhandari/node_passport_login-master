const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email,
      }).then((user) => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        if (user.isLocked) {
          return user.incrementLoginAttempts(function (err) {
            if (err) {
              return done(err);
            }
            let timestamp = Number(user.lockUntil);
            console.log(timestamp);
            let dateFormat = new Date(timestamp);
            let time =
              '' +
              dateFormat.getDate() +
              '/' +
              (dateFormat.getMonth() + 1) +
              '/' +
              dateFormat.getFullYear() +
              ' ' +
              dateFormat.getHours() +
              ':' +
              dateFormat.getMinutes() +
              ':' +
              dateFormat.getSeconds();
            return done(null, false, {
              message: `You have exceeded the maximum number of login attempts.Your account is locked until ${time}`,
            });
          });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (isMatch) {
            // here need to reset login attempts
            user.resetAttempts(function (err) {
              if (err) return done(err);
              return done(null, user);
            });
          } else {
            user.incrementLoginAttempts(function (err) {
              if (err) {
                return done(err);
              }

              return done(null, false, {
                message: `Invalid Password`,
              });
            });
          }
        });
      });
    })
  );

  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
