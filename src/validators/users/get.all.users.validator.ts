import { checkSchema } from "express-validator";
import { UserRole } from "../../types/user.types";

export default checkSchema(
  {
    q: {
      trim: true,
      customSanitizer: {
        options: (value: unknown) => {
          return value || "";
        },
      },
    },
    role: {
      customSanitizer: {
        options: (value: unknown) => value || "",
      },
      optional: true,
      isIn: {
        bail: true,
        options: [Object.values(UserRole)],
        errorMessage: `Role must be one of: ${Object.values(UserRole).join(", ")}`,
      },
    },
    isBanned: {
      optional: true,
      customSanitizer: {
        options: (value: unknown) => {
          if (value === undefined || value === null || value === "") {
            return undefined;
          }
          return value === "true" || value === true; // string/boolean दोनों handle
        },
      },
      isBoolean: {
        errorMessage: "isBanned must be true or false",
      },
    },
    currentPage: {
      customSanitizer: {
        options: (value: unknown) => {
          const parsedValue = Number(value);
          return Number.isNaN(parsedValue) ? 1 : parsedValue;
        },
      },
    },
    perPage: {
      customSanitizer: {
        options: (value: unknown) => {
          const parsedValue = Number(value);
          return Number.isNaN(parsedValue) ? 6 : parsedValue;
        },
      },
    },
  },
  ["query"],
);
