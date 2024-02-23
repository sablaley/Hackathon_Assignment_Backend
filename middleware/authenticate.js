const jwt = require("jsonwebtoken")
const Admin = require('../database/adminSchema')
const keysecret = "yogitasabale"

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization
        // console.log("token", token);
        const verifyToken = jwt.verify(token, keysecret)
        // console.log("verifyToken===========>", verifyToken);
        const rootUser = await Admin.findOne({ _id: verifyToken._id })
        // // console.log("rootUser", rootUser);
        if (!rootUser) {
            { throw new Error("User Not Found") }
        }
        req.token = token
        req.rootUser = rootUser
        req.userId = rootUser._id

        next()
    }
    catch (error) {
        res.status(401).json({ status: 401, msg: "Unauthorized no token provided" })
    }
}

module.exports = authenticate