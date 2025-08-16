import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDeleteAtFromUserTenantTablesMigration1755334286874
  implements MigrationInterface
{
  name = "RemoveDeleteAtFromUserTenantTablesMigration1755334286874";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tenants" ADD "deletedAt" TIMESTAMP`);
  }
}
