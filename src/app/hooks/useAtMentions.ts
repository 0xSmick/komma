'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface MentionItem {
  type: 'doc' | 'mcp' | 'special';
  name: string;
  display: string;
  description?: string;
}

export interface ParsedRefs {
  docs: string[];
  mcps: string[];
  vault: boolean;
  architecture: boolean;
}

interface UseAtMentionsOptions {
  currentDir?: string;
  vaultRoot?: string | null;
}

export function useAtMentions({ currentDir, vaultRoot }: UseAtMentionsOptions) {
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionItems, setMentionItems] = useState<MentionItem[]>([]);
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const [allItems, setAllItems] = useState<MentionItem[]>([]);

  // Fetch available items
  const fetchItems = useCallback(async () => {
    const items: MentionItem[] = [];

    // Special references
    items.push({ type: 'special', name: 'vault', display: '@vault', description: 'Vault-wide file index' });
    items.push({ type: 'special', name: 'architecture', display: '@architecture', description: 'Architecture docs (ARCHITECTURE.md, README.md, etc.)' });

    // Vault files (if vault root exists)
    if (vaultRoot) {
      try {
        const vaultFiles = await window.electronAPI?.vault.listFiles(vaultRoot);
        if (vaultFiles) {
          for (const f of vaultFiles) {
            items.push({ type: 'doc', name: f, display: f });
          }
        }
      } catch { /* ignore */ }
    } else if (currentDir) {
      // Fallback: fetch sibling .md files
      try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(currentDir)}`);
        const data = await res.json();
        if (data.files) {
          for (const f of data.files) {
            if (!f.isDirectory && f.name.endsWith('.md')) {
              items.push({ type: 'doc', name: f.name, display: f.name });
            }
          }
        }
      } catch { /* ignore */ }
    }

    // MCP tools
    try {
      const mcps = await window.electronAPI?.claude.listMcps();
      if (mcps) {
        for (const m of mcps) {
          items.push({ type: 'mcp', name: m.name, display: m.name });
        }
      }
    } catch { /* ignore */ }

    setAllItems(items);
  }, [currentDir, vaultRoot]);

  // Filter items when mention filter changes
  useEffect(() => {
    if (!showMentions) return;
    const lower = mentionFilter.toLowerCase();
    const filtered = allItems.filter(item => {
      const searchText = item.name.toLowerCase();
      return searchText.includes(lower) || (item.description?.toLowerCase().includes(lower) ?? false);
    });
    setMentionItems(filtered);
    setMentionIndex(0);
  }, [mentionFilter, showMentions, allItems]);

  const reset = useCallback(() => {
    setShowMentions(false);
    setMentionFilter('');
    setMentionIndex(0);
    setMentionStartPos(-1);
  }, []);

  // Handle text change to detect @ triggers
  const handleTextChange = useCallback((value: string, cursorPos: number) => {
    if (showMentions && mentionStartPos >= 0) {
      const textSinceMention = value.slice(mentionStartPos + 1, cursorPos);
      if (textSinceMention.includes(' ') || textSinceMention.includes('\n')) {
        setShowMentions(false);
        setMentionStartPos(-1);
      } else {
        setMentionFilter(textSinceMention);
      }
    } else {
      const charBefore = cursorPos > 0 ? value[cursorPos - 1] : '';
      const charBeforeThat = cursorPos > 1 ? value[cursorPos - 2] : ' ';
      if (charBefore === '@' && (charBeforeThat === ' ' || charBeforeThat === '\n' || cursorPos === 1)) {
        setShowMentions(true);
        setMentionStartPos(cursorPos - 1);
        setMentionFilter('');
      }
    }
  }, [showMentions, mentionStartPos]);

  // Build insert text for a selected mention
  const getMentionInsertText = useCallback((item: MentionItem): string => {
    if (item.type === 'special') return `@${item.name}`;
    if (item.type === 'mcp') return `@mcp:${item.name}`;
    return `@${item.name}`;
  }, []);

  // Insert a mention into text
  const insertMention = useCallback((
    text: string,
    item: MentionItem,
  ): { newText: string; cursorPos: number } => {
    if (mentionStartPos < 0) return { newText: text, cursorPos: text.length };

    // We need the cursor position to know where to cut
    // Since we don't have direct cursor access here, we cut from mentionStartPos to the end of the filter
    const before = text.slice(0, mentionStartPos);
    const afterFilterEnd = mentionStartPos + 1 + mentionFilter.length;
    const after = text.slice(afterFilterEnd);
    const insert = getMentionInsertText(item);
    const newText = before + insert + ' ' + after;
    const cursorPos = before.length + insert.length + 1;

    reset();
    return { newText, cursorPos };
  }, [mentionStartPos, mentionFilter, getMentionInsertText, reset]);

  // Parse references from text
  const parseRefs = useCallback((text: string): ParsedRefs => {
    const docs: string[] = [];
    const mcps: string[] = [];
    let vault = false;
    let architecture = false;

    // Check for @vault (standalone, not followed by /)
    if (/@vault(?:\s|$)/g.test(text)) vault = true;
    // Check for @architecture
    if (/@architecture(?:\s|$)/g.test(text)) architecture = true;
    // Match @mcp:name
    const mcpRegex = /@mcp:([\w-]+)/g;
    let m;
    while ((m = mcpRegex.exec(text)) !== null) {
      if (!mcps.includes(m[1])) mcps.push(m[1]);
    }
    // Match @path/to/file.md or @file.md (but not @vault or @architecture or @mcp:)
    const docRegex = /@((?:[\w.-]+\/)*[\w.-]+\.md)/g;
    while ((m = docRegex.exec(text)) !== null) {
      if (!docs.includes(m[1])) docs.push(m[1]);
    }

    return { docs, mcps, vault, architecture };
  }, []);

  // Handle keyboard events in the dropdown
  const handleMentionKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
    if (!showMentions || mentionItems.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => Math.min(prev + 1, mentionItems.length - 1));
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => Math.max(prev - 1, 0));
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      // Caller should call insertMention with the selected item
      return true; // signal that a selection was made
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      reset();
      return true;
    }
    return false;
  }, [showMentions, mentionItems, reset]);

  return {
    showMentions,
    mentionItems,
    mentionIndex,
    mentionStartPos,
    setMentionIndex,
    fetchItems,
    handleTextChange,
    handleMentionKeyDown,
    insertMention,
    parseRefs,
    reset,
    selectedItem: mentionItems[mentionIndex] || null,
  };
}
