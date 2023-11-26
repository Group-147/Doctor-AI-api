const { Router } = require("express");
const { getAllUsers, signup, login, logout, verifyUser } = require("../controllers/user.js");
const { validate, signupValidator, loginValidator } = require("../../utils/validators.js");
const { verifyToken } = require("../../utils/tokens.js");

const userRoute = Router();

userRoute.get("/", getAllUsers);
userRoute.post("/signup", validate(signupValidator), signup);
userRoute.post("/login", validate(loginValidator), login);
userRoute.get("/auth-status", verifyToken, verifyUser);
userRoute.get("/logout", verifyToken, logout);

module.exports = userRoute;
