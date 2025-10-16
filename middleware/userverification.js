const jwt = require('jsonwebtoken')
require("dotenv").config();

const userVerification = async (req, res, next) => {
    try {
         const token = await req.cookies.token  // getting token based on cookie no need to pass it from header

        // const authHeader = await req.headers['authorization'] // getting token based on header need to pass it from header
        // if (!authHeader) {
        //     return res.status(404).json({ error: "Token not found ! Please login to continue" })
        // }
        // const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SCRETE, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'User details not found' })
            }
            req.userId = result?.userId;
            next();
        })
    } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = userVerification