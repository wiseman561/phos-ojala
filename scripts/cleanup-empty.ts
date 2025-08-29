#!/usr/bin/env node

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CleanupStats {
  emptyFiles: string[];
  emptyDirs: string[];
}

async function findEmptyFilesAndDirs(dir: string, stats: CleanupStats): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // Process files first
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isFile()) {
      const fileStats = await fs.stat(fullPath);
      if (fileStats.size === 0) {
        stats.emptyFiles.push(fullPath);
      }
    }
  }

  // Then process directories recursively
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await findEmptyFilesAndDirs(fullPath, stats);
      
      // Check if directory is empty after processing its contents
      const dirContents = await fs.readdir(fullPath);
      if (dirContents.length === 0) {
        stats.emptyDirs.push(fullPath);
      }
    }
  }
}

async function cleanup(): Promise<void> {
  const projectRoot = path.resolve(__dirname, '..');
  const stats: CleanupStats = {
    emptyFiles: [],
    emptyDirs: []
  };

  try {
    await findEmptyFilesAndDirs(projectRoot, stats);

    // Log findings
    if (stats.emptyFiles.length > 0) {
      console.log('\nEmpty files found:');
      stats.emptyFiles.forEach(file => console.log(`- ${file}`));
    }

    if (stats.emptyDirs.length > 0) {
      console.log('\nEmpty directories found:');
      stats.emptyDirs.forEach(dir => console.log(`- ${dir}`));
    }

    // Delete empty files
    for (const file of stats.emptyFiles) {
      await fs.unlink(file);
      console.log(`Deleted empty file: ${file}`);
    }

    // Delete empty directories (in reverse order to handle nested empty dirs)
    for (const dir of stats.emptyDirs.reverse()) {
      await fs.rmdir(dir);
      console.log(`Deleted empty directory: ${dir}`);
    }

    const totalDeletions = stats.emptyFiles.length + stats.emptyDirs.length;
    console.log(`\nTotal items cleaned up: ${totalDeletions}`);

    // Exit with code 1 if anything was deleted
    process.exit(totalDeletions > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup(); 