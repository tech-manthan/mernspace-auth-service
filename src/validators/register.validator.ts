import { checkSchema } from "express-validator";

export default checkSchema(
  {
    email: {
      trim: true,
      notEmpty: {
        bail: true,
        errorMessage: "Email is required",
      },

      isEmail: {
        bail: true,
        errorMessage: "Email is invalid",
      },
    },
  },
  ["body"],
);
