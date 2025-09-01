import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsBannedInUsersTable1756720311166
  implements MigrationInterface
{
  name = "AddIsBannedInUsersTable1756720311166";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "isBanned" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isBanned"`);
  }
}
