const AppError = require("../utils/AppError");

const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    next();
  } catch (error) {
    const message = error.errors.join(", ");
    next(new AppError(message, 400));
  }
};

module.exports = validate;
