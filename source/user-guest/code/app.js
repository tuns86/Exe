const express = require('express');

const app = express();

//Static
app.use('/public', express.static('public'));
 app.use( express.static('public'));

//Default body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
require('./middlewares/dbLocal.mdw')(app);
require('./middlewares/session.mdw')(app);
require('./middlewares/passport.mdw')(app);
require('./middlewares/local.mdw')(app);
require('./middlewares/view.mdw')(app);require('./middlewares/route.mdw')(app);
require('./middlewares/error.mdw')(app);
require('./middlewares/vietqr.mdw')(app);
require('./middlewares/cloudinary.mdw')(app);

app.listen(8000);


