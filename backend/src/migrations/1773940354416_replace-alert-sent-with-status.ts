import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        ALTER TABLE incidents
        DROP COLUMN IF EXISTS alert_sent,
        ADD COLUMN alert_status VARCHAR(20) DEFAULT 'PENDING';
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        ALTER TABLE incidents
        DROP COLUMN IF EXISTS alert_status,
        ADD COLUMN alert_sent BOOLEAN DEFAULT false;
    `);
}
