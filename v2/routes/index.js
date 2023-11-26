const {Router} = require('express');
const userRoute = require('./user');
const chatRoute = require('./chat');

const router = Router();

router.use('/user', userRoute);
router.use('/chat', chatRoute);

module.exports = router;