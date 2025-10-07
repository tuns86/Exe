// ./middlewares/route.mdw.js
module.exports = function (app) {
    app.use('/', require('../routers/index.route'));
    app.use('/users', require('../routers/users.route'));
    app.use('/course', require('../routers/course.route'));
    app.use('/courses', require('../routers/courses.route'));
    app.use('/payment', require('../routers/payment.route'));
  
    // ✅ Mount admin KHÔNG gắn ensureAdmin
    const adminRouter = require('../routers/admin.route');
    app.use('/admin', adminRouter);
  };
  