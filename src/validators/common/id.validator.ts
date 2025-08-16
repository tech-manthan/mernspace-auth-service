import { checkSchema, Schema } from "express-validator";

export default function idValidator(
  entityName: string,
  location: ("query" | "body" | "params")[] = ["params"],
) {
  const schema: Schema = {
    id: {
      notEmpty: {
        bail: true,
        errorMessage: `${entityName} id is required`,
      },
      isNumeric: {
        bail: true,
        errorMessage: `${entityName} id must be an integer`,
      },
      toInt: {},
    },
  };

  return checkSchema(schema, location);
}
