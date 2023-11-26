const {Router} = require('express');

const { startNewChat } = require('../controllers/chat-v1');
const { validate, chatCompletionValidator } = require("../../utils/validators");

const chatRoute = Router();

chatRoute.post('/', validate(chatCompletionValidator), startNewChat);

module.exports = chatRoute;