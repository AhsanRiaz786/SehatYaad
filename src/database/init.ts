import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'sehatyaad.db';

export async function initDatabase() {
  try {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Create migrations table if not exists
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL,
        applied_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Get current version
    const result = await db.getFirstAsync<{ version: number }>('SELECT version FROM migrations ORDER BY version DESC LIMIT 1');
    const currentVersion = result ? result.version : 0;

    const migrations = [
      {
        version: 1,
        up: `
          CREATE TABLE IF NOT EXISTS medications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dosage TEXT NOT NULL,
            frequency TEXT NOT NULL,
            times TEXT NOT NULL,
            notes TEXT,
            color TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
          );

          CREATE TABLE IF NOT EXISTS doses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medication_id INTEGER NOT NULL,
            scheduled_time INTEGER NOT NULL,
            actual_time INTEGER,
            status TEXT NOT NULL,
            FOREIGN KEY (medication_id) REFERENCES medications (id)
          );

          CREATE TABLE IF NOT EXISTS adherence_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medication_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            taken INTEGER DEFAULT 0,
            missed INTEGER DEFAULT 0,
            timestamp INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (medication_id) REFERENCES medications (id)
          );

          CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS prescription_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            processed_date INTEGER DEFAULT (strftime('%s', 'now')),
            medications_json TEXT
          );
        `
      },
      {
        version: 2,
        up: `
          ALTER TABLE medications ADD COLUMN notification_ids TEXT;
        `
      }
    ];

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        await db.execAsync(migration.up);
        await db.runAsync('INSERT INTO migrations (version) VALUES (?)', migration.version);
        console.log(`Applied migration version ${migration.version}`);
      }
    }

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
