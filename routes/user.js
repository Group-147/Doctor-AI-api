const { Router } = require("express");
const { getAllUsers, signup, login } = require("../controllers/user");
const { validate, signupValidator, loginValidator } = require("../utils/validators.js");

const userRoute = Router();

userRoute.get("/", getAllUsers);
userRoute.post("/signup", validate(signupValidator), signup);
userRoute.post("/login", validate(loginValidator), login)

module.exports = userRoute;
