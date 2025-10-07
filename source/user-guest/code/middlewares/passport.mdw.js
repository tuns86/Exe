// ./middlewares/passport.mdw.js
const passport = require('passport');

module.exports = function (app) {
  require('../config/passport.config')(passport);
  app.use(passport.initialize());
  app.use(passport.session());
};
