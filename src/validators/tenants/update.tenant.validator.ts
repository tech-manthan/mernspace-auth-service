import { checkSchema } from "express-validator";

export default checkSchema(
  {
    name: {
      optional: {
        options: {
          values: "falsy",
        },
      },
      trim: true,
      isLength: {
        bail: true,
        options: {
          min: 3,
          max: 100,
        },
        errorMessage: "Tenant name atleast 3 & atmost 100 characters",
      },
    },
    address: {
      optional: {
        options: {
          values: "falsy",
        },
      },
      trim: true,
      isLength: {
        bail: true,
        options: {
          min: 10,
          max: 255,
        },
        errorMessage: "Tenant address atleast 10  & atmost 255 characters",
      },
    },
  },
  ["body"],
);
