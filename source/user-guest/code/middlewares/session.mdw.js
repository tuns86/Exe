const session = require("express-session");
const MongoStore = require("connect-mongo");
const { MongoLocal } = require("../config/key.config");

module.exports = function (app) {
    app.use(session({
        secret: "secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 24 hour
            httpOnly: true
        }
    }));
};
