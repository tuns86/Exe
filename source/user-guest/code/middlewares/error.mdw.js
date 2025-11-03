// error.mdw.js

module.exports = function (app) {
    // 404 Error
    app.use((req, res) => {
        res.status(404).render('./error/404', {
            layout: false
        });
    });

    // 500 Error
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).render('./error/500', {
            layout: false
        });
    });
};
