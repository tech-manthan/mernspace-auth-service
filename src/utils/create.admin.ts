import { CreateAdminData, UserRole } from "../types/user.types";
import { validateAdminData } from "../validators/users/create.admin.validator";
import { AppDataSource } from "./data-source";
import { User } from "../entity/User";
import logger from "./logger";
import { PasswordService } from "../services/PasswordService";

export async function createAdmin(adminData: CreateAdminData) {
  const result = await validateAdminData(adminData);

  if (result.errors && result.errors.length !== 0) {
    logger.error(result.errors[0]?.msg);
    process.exit(1);
  }

  const { email, firstName, lastName, password } = adminData;

  try {
    const userRepository = AppDataSource.getRepository(User);

    const admin = await userRepository.findOne({
      where: {
        email: email,
        role: UserRole.ADMIN,
      },
    });

    if (admin) {
      logger.info("Admin Exist Already");
      return;
    }

    const hashedPassword = await PasswordService.Hash(password);

    const newAdmin = await userRepository.save({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    logger.info("Admin Created Successfully", {
      id: newAdmin.id,
    });
  } catch {
    logger.error("Failed to create admin in the database");
    process.exit(1);
  }
}
