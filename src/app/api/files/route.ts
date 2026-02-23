import { NextRequest } from 'next/server';
import { readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  modified?: string;
}

function walkDir(dir: string, root: string, query: string, results: FileEntry[], limit: number): void {
  if (results.length >= limit) return;
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return; }
  for (const entry of entries) {
    if (results.length >= limit) return;
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    try {
      const fullPath = join(dir, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        walkDir(fullPath, root, query, results, limit);
      } else if (entry.toLowerCase().includes(query)) {
        const relPath = relative(root, fullPath);
        results.push({
          name: relPath,
          path: fullPath,
          isDirectory: false,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        });
      }
    } catch { /* skip inaccessible */ }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dirPath = searchParams.get('path') || process.env.HOME || '/';
  const search = searchParams.get('search');

  // Recursive search mode
  if (search) {
    const files: FileEntry[] = [];
    walkDir(dirPath, dirPath, search.toLowerCase(), files, 50);
    files.sort((a, b) => a.name.localeCompare(b.name));
    return new Response(
      JSON.stringify({ path: dirPath, parent: dirname(dirPath), files }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const entries = readdirSync(dirPath);
    const files: FileEntry[] = [];

    for (const entry of entries) {
      // Skip hidden files
      if (entry.startsWith('.')) continue;

      try {
        const fullPath = join(dirPath, entry);
        const stats = statSync(fullPath);

        files.push({
          name: entry,
          path: fullPath,
          isDirectory: stats.isDirectory(),
          size: stats.isDirectory() ? undefined : stats.size,
          modified: stats.mtime.toISOString(),
        });
      } catch {
        // Skip files we can't access
      }
    }

    // Sort: directories first, then by name
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return new Response(
      JSON.stringify({
        path: dirPath,
        parent: dirname(dirPath),
        files,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to list directory:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to read directory' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
