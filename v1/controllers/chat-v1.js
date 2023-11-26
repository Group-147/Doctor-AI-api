const run = require('../../utils/chatCompletion2');

exports.startNewChat = async (req, res, next) => {
  try {
    const message = await run(req.body.message);

    res.status(200).json({
      status: true,
      message,
    });
  } catch {}
};
