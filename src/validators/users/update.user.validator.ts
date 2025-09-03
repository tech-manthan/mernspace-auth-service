import { checkSchema } from "express-validator";
import { UserRole } from "../../types/user.types";

export default checkSchema(
  {
    email: {
      trim: true,
      optional: {
        options: {
          values: "falsy",
        },
      },

      isEmail: {
        bail: true,
        errorMessage: "Email is invalid",
      },
    },
    firstName: {
      trim: true,
      optional: {
        options: {
          values: "falsy",
        },
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
      optional: {
        options: {
          values: "falsy",
        },
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
      optional: {
        options: {
          values: "falsy",
        },
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
      optional: {
        options: {
          values: "falsy",
        },
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

    isBanned: {
      optional: true,
      isBoolean: {
        bail: true,
        errorMessage: "isBanned should be a boolean",
      },
      toBoolean: true,
    },
  },

  ["body"],
);
