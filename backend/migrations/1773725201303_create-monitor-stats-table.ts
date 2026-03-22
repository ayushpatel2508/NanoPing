import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        CREATE TABLE monitor_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
            day DATE NOT NULL,
            uptime_percentage DECIMAL(5,2),
            avg_response_time INT,
            total_checks INT,
            UNIQUE(monitor_id, day)
        );
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`DROP TABLE monitor_stats;`);
}
