'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { Comment, ChangelogEntry } from '../types';
import type { ParsedFrontmatter } from '@/lib/documents';

export function useDocument() {
  const [filePath, setFilePath] = useState('/Users/sheldon/Developer/torque/planning/PRODUCT_FEATURES.md');
  const [markdown, setMarkdown] = useState<string>('');
  const [editedMarkdown, setEditedMarkdown] = useState<string>('');
  const [editedHtml, setEditedHtml] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [frontmatter, setFrontmatter] = useState<ParsedFrontmatter | null>(null);
  const rawFrontmatterRef = useRef<string | null>(null);

  // Turndown service for HTML to Markdown
  const turndownService = useRef(() => {
    const service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    // Add table support
    service.addRule('table', {
      filter: 'table',
      replacement: function(content, node) {
        const table = node as HTMLTableElement;
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length === 0) return content;

        const result: string[] = [];
        rows.forEach((row, i) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const cellTexts = cells.map(cell => cell.textContent?.trim() || '');
          result.push('| ' + cellTexts.join(' | ') + ' |');
          if (i === 0) {
            result.push('|' + cells.map(() => '------').join('|') + '|');
          }
        });
        return '\n' + result.join('\n') + '\n';
      }
    });
    return service;
  });

  // Load the markdown file (returns loaded comments and changelogs for sibling hooks)
  const loadDocument = useCallback(async (): Promise<{
    comments: Comment[];
    changelogs: ChangelogEntry[];
  }> => {
    setIsLoading(true);
    setMarkdown('');
    let loadedComments: Comment[] = [];
    let loadedChangelogs: ChangelogEntry[] = [];
    try {
      const [fileRes, commentsRes, changelogsRes, frontmatterRes] = await Promise.all([
        fetch(`/api/file?path=${encodeURIComponent(filePath)}`),
        fetch(`/api/comments?document_path=${encodeURIComponent(filePath)}`),
        fetch(`/api/changelogs?document_path=${encodeURIComponent(filePath)}`),
        fetch(`/api/frontmatter?path=${encodeURIComponent(filePath)}`)
      ]);
      const data = await fileRes.json();
      setMarkdown(data.content || '');
      const fmData = await frontmatterRes.json();
      setFrontmatter(fmData.frontmatter || null);
      rawFrontmatterRef.current = fmData.rawFrontmatter || null;
      const commentsData = await commentsRes.json();
      if (commentsData.comments) {
        loadedComments = commentsData.comments.map((c: { id: number; selected_text: string; instruction: string; line_hint: string | null; created_at: string; status: string }) => ({
          id: c.id,
          selectedText: c.selected_text,
          comment: c.instruction,
          lineHint: c.line_hint || c.selected_text.substring(0, 50) + (c.selected_text.length > 50 ? '...' : ''),
          timestamp: new Date(c.created_at),
          status: (c.status === 'applied' ? 'applied' : 'pending') as 'pending' | 'applied',
        }));
      }
      const changelogsData = await changelogsRes.json();
      if (changelogsData.changelogs) {
        loadedChangelogs = changelogsData.changelogs;
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    }
    setIsLoading(false);
    return { comments: loadedComments, changelogs: loadedChangelogs };
  }, [filePath]);

  // Initialize edit mode with current markdown (strip frontmatter)
  useEffect(() => {
    if (isEditMode && editedMarkdown === '') {
      let bodyMd = markdown;
      if (rawFrontmatterRef.current && bodyMd.startsWith(rawFrontmatterRef.current)) {
        bodyMd = bodyMd.slice(rawFrontmatterRef.current.length);
      }
      setEditedMarkdown(bodyMd);
    }
  }, [isEditMode, markdown, editedMarkdown]);

  // Save edited markdown, preserving frontmatter
  const saveDocument = async () => {
    setIsSaving(true);
    try {
      let contentToSave = turndownService.current().turndown(editedHtml);

      // Re-prepend original frontmatter if it existed
      if (rawFrontmatterRef.current) {
        contentToSave = rawFrontmatterRef.current + contentToSave;
      }

      const res = await fetch('/api/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: contentToSave })
      });
      if (res.ok) {
        setMarkdown(contentToSave);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
    setIsSaving(false);
  };

  const toggleEditMode = () => {
    if (!isEditMode) {
      // Strip frontmatter — it's preserved in rawFrontmatterRef for re-prepending on save
      let bodyMd = markdown;
      if (rawFrontmatterRef.current && bodyMd.startsWith(rawFrontmatterRef.current)) {
        bodyMd = bodyMd.slice(rawFrontmatterRef.current.length);
      }
      setEditedMarkdown(bodyMd);
      setEditedHtml(marked(bodyMd) as string);
    }
    setIsEditMode(!isEditMode);
  };

  return {
    filePath,
    setFilePath,
    markdown,
    setMarkdown,
    editedMarkdown,
    setEditedMarkdown,
    editedHtml,
    setEditedHtml,
    isEditMode,
    setIsEditMode,
    isLoading,
    isSaving,
    frontmatter,
    loadDocument,
    saveDocument,
    toggleEditMode,
  };
}
