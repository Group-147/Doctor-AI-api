const jwt = require('jsonwebtoken');
const { COOKIE_NAME } = require('./constants');


exports.createToken = (id, email, expiresIn=null) => {
    const payload = { id, email };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${expiresIn ? expiresIn : '7d'}` });

    return token;
}

exports.verifyToken = async (req, res, next) => {
    const token = req.signedCookies[`${COOKIE_NAME}`];

    if (!token || token.trim == "") {
        return res.status(401).json({ success: false, message: 'Unauthorized!. Please sign up or log in.' });
    }

    return new Promise((resolve, reject) => {
        return jwt.verify(token, process.env.JWT_SECRET, (err, success) => {
            if (err) {
                reject(err.message);
                return res.status(401).json({ success: false, message: 'Token expired!. Please sign up or log in.' });
            } else {
                resolve();
                res.locals.jwtData = success;
                return next();
            }
        })
    })
}