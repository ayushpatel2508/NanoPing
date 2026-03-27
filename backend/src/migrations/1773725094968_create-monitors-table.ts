import { type ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`
        CREATE TABLE monitors (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            check_interval INT DEFAULT 5,
            alert_threshold INT DEFAULT 3,
            is_active BOOLEAN DEFAULT true,
            last_status TEXT,
            last_checked TIMESTAMP,
            consecutive_failures INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.sql(`DROP TABLE monitors;`);
}
