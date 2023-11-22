const User = require("../models/user");
const { hash, compare } = require("bcryptjs");
const { createToken } = require("../utils/tokens");
const { COOKIE_NAME } = require("../utils/constants");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.log(`error from get all users: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};





exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(401).send('User already registered!');
    }

    const hashedPassword = await hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });

    await user.save();

    // create token and store cookie
    res.clearCookie(COOKIE_NAME, { domain: "localhost", httpOnly: true, signed: true, path: "/"  });

    const token = createToken(user.id, user.email);

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, { path: "/", domain: "localhost", expires, httpOnly: true, signed: true });

    return res.status(201).json({ success: true, id: user._id.toString() });
  } catch (error) {
    console.log(`error from signup user: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
};





exports.login = async (req, res, next) => {
  try{
    const { email, password } = req.body;

    const user = await User.findOne({ email });
  
    if (!user) {
      return res.status(401).send('User not registered!');
    }
  
    const isPasswordCorrect = await compare(password, user.password);
  
    if (!isPasswordCorrect) { return res.status(403).send("Incorrect credentials!"); };

    // create token and store cookie
    res.clearCookie(COOKIE_NAME, { domain: "localhost", httpOnly: true, signed: true, path: "/"  });

    const token = createToken(user.id, user.email);

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    res.cookie(COOKIE_NAME, token, { path: "/", domain: "localhost", expires, httpOnly: true, signed: true });

    return res.status(200).json({ success: true, id: user._id.toString() });
  }catch(error){
    console.log(`error from login user: ${error}`);
    return res.status(500).json({ success: false, error: error.message });
  }
}