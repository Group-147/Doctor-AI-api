const mongoose = require('mongoose');
const {randomUUID} = require('crypto');

const Schema = mongoose.Schema;

const chatSchema = new Schema({
    id: { type: String, default: randomUUID() },
    role: { type: String, required: true },
    content: { type: String, required: true }
})

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    chats: [chatSchema]
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);