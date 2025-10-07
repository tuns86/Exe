// ./config/passport.config.js (bản không Facebook)
const bcrypt = require('bcryptjs');
const LocalStrategy = require('passport-local').Strategy;

const Admin = require('../models/Admin.model');
const Lecturer = require('../models/Lecturer.model');
const LocalUser = require('../models/LocalUser.model');

module.exports = function (passport) {
  // Admin
  passport.use('admin', new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await Admin.findOne({ email });
        if (!user) return done(null, false, { message: 'Admin not found' });
        const ok = await bcrypt.compare(password, user.password);
        return ok ? done(null, user) : done(null, false, { message: 'Password incorrect' });
      } catch (err) { return done(err); }
    }
  ));

  passport.use('lecturer', new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await Lecturer.findOne({ email });
        if (!user) return done(null, false, { message: 'Lecturer not found' });
        const ok = await bcrypt.compare(password, user.password);
        return ok ? done(null, user) : done(null, false, { message: 'Password incorrect' });
      } catch (err) { return done(err); }
    }
  ));

  // User thường (LocalUser)
  passport.use('customer', new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await LocalUser.findOne({ email });
        if (!user) return done(null, false, { message: 'User not found' });
        const ok = await bcrypt.compare(password, user.password);
        return ok ? done(null, user) : done(null, false, { message: 'Password incorrect' });
      } catch (err) { return done(err); }
    }
  ));

  // Serialize / Deserialize
  passport.serializeUser((user, done) => done(null, user._id));

  passport.deserializeUser(async (id, done) => {
    try {
      let u = await Admin.findById(id); if (u) return done(null, u);
      u = await Lecturer.findById(id);  if (u) return done(null, u);
      u = await LocalUser.findById(id); if (u) return done(null, u);
      return done(null, false);
    } catch (err) { return done(err); }
  });
};
