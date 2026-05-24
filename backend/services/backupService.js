const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { exec } = require('child_process');

async function createBackup(oneDrivePath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(oneDrivePath)) {
        fs.mkdirSync(oneDrivePath, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `hk_backup_${timestamp}.zip`;
      const backupFilePath = path.join(oneDrivePath, backupFilename);

      const output = fs.createWriteStream(backupFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        resolve({ success: true, message: `Backup created at ${backupFilePath}`, size: archive.pointer() });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // 1. Add uploads folder
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'uploads');
      }

      // 2. Dump DB
      const dbDumpPath = path.join(__dirname, '..', 'temp_db_dump.sql');
      const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/hk_training_db';
      
      exec(`pg_dump "${connectionString}" > "${dbDumpPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.warn('pg_dump failed, skipping DB backup. Is pg_dump in your PATH? Error:', error.message);
        } else {
          archive.file(dbDumpPath, { name: 'database_dump.sql' });
        }
        
        // Finalize archive
        archive.finalize().then(() => {
          if (fs.existsSync(dbDumpPath)) {
             try { fs.unlinkSync(dbDumpPath); } catch(e){}
          }
        });
      });

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { createBackup };
