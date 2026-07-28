function requireAdmin(req, res, next) {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({
            error: "You must be logged in as an administrator."
        });
    }

    next();
}

module.exports = requireAdmin;