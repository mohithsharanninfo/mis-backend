const { sql, pool } = require('../db');
const { isValidPassword } = require('../helper');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();


const loginController = async (req, res) => {
    const { UserName, Password } = req.body;

    if (!UserName || !Password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {

        let request = pool.request();

        request.input('UserName', sql.VarChar, UserName);

        const result = await request.query('SELECT * FROM mis.Login WHERE UserName = @UserName');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'User Not Found' });
        }

        // Compare MD5 password
        if (!isValidPassword(Password, process.env.Password_Id || user.Password)) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        const token = jwt.sign({ userId: user?.LoginID }, process.env.JWT_SCRETE, { expiresIn: '30d' })

        res.cookie("token", token, {
            withCredentials: true,
            httpOnly: false,
        });

        const userInfo = {
            username: user.UserName,
        };

        return res.json({ success: true, user: userInfo, message: 'Logged In Successfully!',token:token });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const LoginID = req?.userId

        let request = pool.request();

        request.input('LoginID', sql.Int, LoginID);

        const result = await request.query('SELECT * FROM mis.Login WHERE LoginID = @LoginID');

        const userDetails = result?.recordset[0];

        if (!userDetails) {
            return res.status(404).json({ error: 'User not found', success: false });
        }
        res.status(200).json({ message: 'User details fetched successfully', success: true, data: userDetails })

    } catch (err) {
        throw new Error(err)
    }
}

module.exports = {
    loginController, getUserDetails
}