// ./middlewares/role.mdw.js
function getModelName(user) {
    return user?.constructor?.modelName || '';
  }
  
  module.exports.ensureAdmin = function (req, res, next) {
    if (req.isAuthenticated() && getModelName(req.user) === 'Admin') {
      return next();
    }
    req.flash?.('error_msg', 'You must be admin');
    return res.redirect('/users/login');
  };
  