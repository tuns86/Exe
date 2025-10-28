const mongoose = require('mongoose');

module.exports = function(app) {
    const uris = require('../config/key.config').MongoLocal;
    
    mongoose.connect(uris, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 100, // thay cho poolSize
  })
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection error:', err));
};