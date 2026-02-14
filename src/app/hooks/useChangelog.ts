'use client';

import { useState } from 'react';
import { ChangelogEntry } from '../types';

export function useChangelog() {
  const [changelogs, setChangelogs] = useState<ChangelogEntry[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);

  const createChangelog = async (
    documentPath: string,
    requestId: string,
    commentsSnapshot: string
  ): Promise<number | null> => {
    try {
      const res = await fetch('/api/changelogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_path: documentPath,
          request_id: requestId,
          comments_snapshot: commentsSnapshot
        })
      });
      const data = await res.json();
      if (data.changelog) {
        setChangelogs(prev => [data.changelog, ...prev]);
        return data.changelog.id;
      }
    } catch (error) {
      console.error('Failed to create changelog entry:', error);
    }
    return null;
  };

  const updateChangelog = async (
    changelogId: number,
    status: string,
    streamLog?: string,
    summary?: string
  ) => {
    try {
      const res = await fetch('/api/changelogs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: changelogId,
          status,
          stream_log: streamLog,
          summary
        })
      });
      const data = await res.json();
      if (data.changelog) {
        setChangelogs(prev => prev.map(c => c.id === changelogId ? data.changelog : c));
      }
    } catch (error) {
      console.error('Failed to patch changelog:', error);
    }
  };

  const clearChangelogs = async (documentPath: string) => {
    try {
      await fetch(`/api/changelogs?document_path=${encodeURIComponent(documentPath)}`, {
        method: 'DELETE',
      });
      setChangelogs([]);
    } catch (error) {
      console.error('Failed to clear changelogs:', error);
    }
  };

  return {
    changelogs,
    setChangelogs,
    expandedEntryId,
    setExpandedEntryId,
    createChangelog,
    updateChangelog,
    clearChangelogs,
  };
}
