import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { getDatabaseClient } from './client';
import path from 'path';

// Use __dirname for CommonJS compatibility
const migrationsPath = path.join(__dirname, '../../../seed/migrations');

export interface Migration {
  filename: string;
  timestamp: string;
  description: string;
  sql: string;
}

export async function loadMigrations(): Promise<Migration[]> {
  const files = readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql') && !file.endsWith('_down.sql'))
    .sort();

  return files.map(filename => {
    const filepath = join(migrationsPath, filename);
    const sql = readFileSync(filepath, 'utf-8');
    
    // Parse filename: YYYYMMDD-HHMM_description.sql
    const match = filename.match(/^(\d{8}-\d{4})_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename format: ${filename}`);
    }

    return {
      filename,
      timestamp: match[1],
      description: match[2].replace(/_/g, ' '),
      sql,
    };
  });
}

export async function runMigrations(): Promise<void> {
  const db = getDatabaseClient();
  const migrations = await loadMigrations();

  console.log(`Found ${migrations.length} migrations`);

  for (const migration of migrations) {
    console.log(`Running migration: ${migration.filename}`);
    
    try {
      // Execute migration in a transaction
      const { error } = await db.rpc('exec_sql', { sql: migration.sql });
      
      if (error) {
        throw new Error(`Migration failed: ${error.message}`);
      }
      
      console.log(`✅ Migration completed: ${migration.description}`);
    } catch (error) {
      console.error(`❌ Migration failed: ${migration.filename}`);
      throw error;
    }
  }

  console.log('🎉 All migrations completed successfully');
}

export async function createMigration(description: string): Promise<string> {
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '-')
    .substring(0, 13);
  
  const filename = `${timestamp}_${description.replace(/\s+/g, '_').toLowerCase()}.sql`;
  
  const template = `-- Migration: ${description}
-- File: ${filename}
-- Description: ${description}

-- Add your migration SQL here

`;

  const downTemplate = `-- Rollback script for ${description}
-- File: ${filename.replace('.sql', '_down.sql')}

-- Add your rollback SQL here

`;

  console.log(`Create migration files:
  - seed/migrations/${filename}
  - seed/migrations/${filename.replace('.sql', '_down.sql')}`);
  
  console.log('Up migration template:');
  console.log(template);
  
  console.log('Down migration template:');
  console.log(downTemplate);

  return filename;
}
