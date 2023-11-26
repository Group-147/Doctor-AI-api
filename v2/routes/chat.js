const {Router} = require('express');
const {verifyToken} = require('../../utils/tokens');
const { validate, chatCompletionValidator } = require("../../utils/validators");
const { generateChatCompletion, sendChatsToUser, deleteChats } = require('../controllers/chats');

const chatRoute = Router();

// Protected API
chatRoute.post("/new", validate(chatCompletionValidator), verifyToken, generateChatCompletion);
chatRoute.get("/all-chats", verifyToken, sendChatsToUser);
chatRoute.delete("/delete", verifyToken, deleteChats);

module.exports = chatRoute;