import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        CREATE TABLE incidents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
            started_at TIMESTAMP DEFAULT NOW(),
            resolved_at TIMESTAMP,
            is_resolved BOOLEAN DEFAULT false
        );
        CREATE INDEX idx_incidents_monitor ON incidents(monitor_id, started_at DESC);
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`DROP TABLE incidents;`);
}
