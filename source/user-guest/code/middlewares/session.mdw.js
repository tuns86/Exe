const session = require("express-session");
const MongoStore = require("connect-mongo");
const { MongoLocal } = require("../config/key.config");

module.exports = function (app) {
    app.use(session({
        secret: "secret",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: MongoLocal,
            collectionName: "sessions"
        }),
        cookie: {
            maxAge: 1000 * 60 * 60, // 1 hour
            httpOnly: true
        }
    }));
};
