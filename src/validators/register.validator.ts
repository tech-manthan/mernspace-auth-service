import { checkSchema } from "express-validator";

export default checkSchema(
  {
    email: {
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
