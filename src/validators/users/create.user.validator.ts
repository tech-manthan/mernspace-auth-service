import { checkSchema } from "express-validator";
import { UserRole } from "../../types/user.types";

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
    firstName: {
      trim: true,
      notEmpty: {
        bail: true,
        errorMessage: "FirstName is required",
      },
      isLength: {
        options: {
          min: 3,
        },
        bail: true,
        errorMessage: "FirstName atleast have 2 characters",
      },
    },
    lastName: {
      trim: true,
      notEmpty: {
        bail: true,
        errorMessage: "LastName is required",
      },
      isLength: {
        options: {
          min: 2,
        },
        bail: true,
        errorMessage: "LastName atleast have 2 characters",
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
    role: {
      exists: {
        bail: true,
        errorMessage: "Role is required",
      },
      isIn: {
        options: [Object.values(UserRole)],
        errorMessage: `Role must be one of: ${Object.values(UserRole).join(", ")}`,
      },
    },
    tenantId: {
      custom: {
        options: (value, { req }) => {
          if (
            (req.body as Record<string, UserRole>).role === UserRole.MANAGER
          ) {
            if (value === undefined || value === null) {
              throw new Error("tenantId is required when role is MANAGER");
            }
            if (isNaN(Number(value))) {
              throw new Error("tenantId must be a number");
            }
          }
          return true;
        },
      },
      toInt: true,
    },
  },

  ["body"],
);
