const jwt = require("jsonwebtoken");
const getuser = require("../db/User/getUserDb");
const StatusCode = require("http-status-codes");
const { StatusCodes } = StatusCode;

const authenticationDetails = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: Invalid or missing token", unauthorized: true });
    }

    const token = authHeader.split(" ")[1];
    req.userToken = token; // jwt token

    try {
        const userId = jwt.verify(token, process.env.JWT_SECRET);
        if (!userId || !userId.user) {
            return res.status(401).json({ message: "Unauthorized: Invalid token", unauthorized: true });
        }
        if (getuser.getUser(userId.user) === StatusCodes.NOT_FOUND) {
            return res.status(401).json({ message: "Unauthorized: User not found", unauthorized: true });
        }
        req.userId = userId.user;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Unauthorized: Token has expired", unauthorized: true });
        }
        return res.status(401).json({ message: "Unauthorized: Invalid token", unauthorized: true });
    }
    
    next();
};

module.exports = authenticationDetails;