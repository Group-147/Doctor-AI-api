const { body, validationResult } = require("express-validator");

const validate = (validations) => {
  return async (req, res, next) => {
    try {
      // Ensure that validations is an array
      if (!Array.isArray(validations)) {
        throw new Error("Validations must be an array.");
      }

      // Execute each validation and collect the results
      const validationResults = await Promise.all(validations.map((validation) => validation.run(req)));

      // Check if any validation failed
      const errors = validationResults.reduce((acc, result) => {
        if (!result.isEmpty()) {
          return acc.concat(result.array());
        }
        return acc;
      }, []);

      // If there are errors, respond with a 422 status and error details
      if (errors.length > 0) {
        return res.status(422).json({ success: false, errors });
      }

      // If validations pass, proceed to the next middleware
      return next();
    } catch (error) {
      // Handle unexpected errors
      console.error("Validation error:", error.message);
      return res.status(500).json({ success: false, error: "Please make sure you are sending the expected request body. Try again later! :)" });
    }
  };
};

const loginValidator = [
  body("email").trim().isEmail().withMessage("Email is required"),
  body("password").trim().isLength({ min: 6 }).withMessage("Password should contain at least 6 characters!"),
];

const signupValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  ...loginValidator,
];

const chatCompletionValidator = [
  body("message").notEmpty().withMessage("Message is required!"),
];

module.exports = {
  loginValidator,
  signupValidator,
  validate,
  chatCompletionValidator,
};
