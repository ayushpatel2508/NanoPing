import {type  ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        ALTER TABLE incidents
        ADD COLUMN alert_sent BOOLEAN DEFAULT false;
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        ALTER TABLE incidents
        DROP COLUMN alert_sent;
    `);
}
