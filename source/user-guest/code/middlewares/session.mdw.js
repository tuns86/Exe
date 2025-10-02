const session = require("express-session");

module.exports = function (app) {
    // Express session
    app.use(session({
        secret: "secret",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 },
    }));
};