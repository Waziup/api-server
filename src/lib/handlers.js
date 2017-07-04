function safeHandler(handler) {
    return function(req, res) {
        handler(req, res).catch(error => res.status(500).send(error.message));
    };
}

module.exports = safeHandler;