const express = require('express');
const app = express();

// Static files
app.use('/public', express.static('public'));
app.use(express.static('public'));

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middlewares
require('./middlewares/dbLocal.mdw')(app);
require('./middlewares/session.mdw')(app);
require('./middlewares/passport.mdw')(app);
require('./middlewares/local.mdw')(app);
require('./middlewares/view.mdw')(app);
require('./middlewares/route.mdw')(app);
require('./middlewares/error.mdw')(app);
require('./middlewares/vietqr.mdw')(app);
require('./middlewares/cloudinary.mdw')(app);

// Default route to check server
app.get('/', (req, res) => {
    res.send("Server is running successfully on Render!");
});

// PORT for Render
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
