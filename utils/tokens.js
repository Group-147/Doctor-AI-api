const jwt = require('jsonwebtoken');

exports.createToken = (id, email, expiresIn=null) => {
    const payload = { id, email };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: `${expiresIn ? expiresIn : '7d'}` });

    return token;
}