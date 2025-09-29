const bcrypt = require('bcryptjs');

const LocalStrategy = require('passport-local').Strategy;

const LocalUser = require('../models/LocalUser.model');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({
            usernameField: 'email'
        }, (email, password, done) => {
            // Match user
            LocalUser.findOne({
                email: email
            }).then(async (user) => {
                if (!user) {
                    return done(null, false, {
                        message: 'That email is not registered'
                    });
                }
                bcrypt.compare(password, user.password).then((isMatch) => {
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, {
                            message: 'Password incorrect'
                        });
                    }
                })
            })
        })
    );


    //Call when auth complete to save user data to session
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    //Call by passport.session to get user data from session
    passport.deserializeUser(function (id, done) {
        LocalUser.findById(id).then(user=>{
            if(user) {
                done(null, user);
            }
        });
    });
};