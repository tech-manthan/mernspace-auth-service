import { checkSchema } from "express-validator";

export default checkSchema(
  {
    name: {
      trim: true,
      notEmpty: {
        bail: true,
        errorMessage: "Tenant name is required",
      },
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
      trim: true,
      notEmpty: {
        bail: true,
        errorMessage: "Tenant address is required",
      },
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
