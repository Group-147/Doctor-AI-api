const OpenAI = require('openai');
const User = require("../models/user");

exports.generateChatCompletion = async (req, res, next) => {
  const { message } = req.body;

  try {
    const user = await User.findById(res.locals.jwtData.id);

    if (!user)
      return res.status(401).json({
        success: false,
        message: "User not registered or token malfunctioned!",
      });

    // grap chats of the user
    let chats = [];
    if (user.chats && Array.isArray(user.chats) && user.chats.length >= 1) {
     chats = user.chats.filter(chat => chat !== null).map(({ role, content }) => ({ role, content }));
    }
    
    chats.push({ content: message, role: "user" });

    user.chats.push({ content: message, role: "user" });

    // send all chats with new one to openAI API
    const openai = new OpenAI({apiKey: process.env.AI_KEY});

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: chats,
    });

    // console.log(chatResponse);

    // get latest response
    user.chats.push(chatResponse.choices[0].message);

    // save user
    await user.save();

    return res.status(200).json({ success: true, chats: user.chats });
  } catch (error) {
    console.log(`error from generateChatCompletion: ${error}`);
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong!. Please try again later, and if it persists, endeavor to reach out to the developers :)",
    });
  }
};

exports.sendChatsToUser = async (req, res) => {
  try {
    // user token check
    const user = await User.findById(res.locals.jwtData.id);

    if (!user) {
      return res
        .status(401)
        .send("User not registered or token malfunctioned!");
    }

    if (user.id != res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match!");
    }

    return res.status(200).json({ success: true, chats: user.chats });
  } catch (error) {}
};

exports.deleteChats = async (req, res) => {
  try {
    // user login
    const user = await User.findById(res.locals.jwtData.id);

    if (!user) {
      return res
        .status(401)
        .send("User not registered or token malfunctioned!");
    }

    if (user.id != res.locals.jwtData.id) {
      return res.status(401).send("Permissions didn't match!");
    }

    user.chats = [];
    await user.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.log(`error from deleteChats: ${error}`);
    return res
      .status(500)
      .json({
        success: false,
        message:
          "Operation not successful!. Please try again later, and if it persists, endeavor to reach out to the developers :)",
      });
  }
};

