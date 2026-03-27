import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        CREATE TABLE checks (
            id BIGSERIAL PRIMARY KEY,
            monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            status_code INT,
            response_time INT,
            message TEXT,
            checked_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX idx_checks_monitor_time ON checks(monitor_id, checked_at DESC);
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`DROP TABLE checks;`);
}
