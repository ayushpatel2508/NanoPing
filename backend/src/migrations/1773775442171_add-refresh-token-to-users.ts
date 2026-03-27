import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        ALTER TABLE users ADD COLUMN refresh_token TEXT;
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        ALTER TABLE users DROP COLUMN refresh_token;
    `);
}
