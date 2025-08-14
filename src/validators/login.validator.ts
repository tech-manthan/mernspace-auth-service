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

    password: {
      trim: true,
      notEmpty: {
        bail: true,
        errorMessage: "Password is required",
      },
      isLength: {
        options: {
          min: 8,
        },
        bail: true,
        errorMessage: "Password  atleast have 8 characters",
      },
      isStrongPassword: {
        options: {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        },
        bail: true,
        errorMessage:
          "Password must have one lowercase, one uppercase, one number, one symbol",
      },
    },
  },

  ["body"],
);
