'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import rehypeRaw from 'rehype-raw';
import dynamic from 'next/dynamic';

import { useDocument } from './hooks/useDocument';
import { useComments } from './hooks/useComments';
import { useChangelog } from './hooks/useChangelog';
import { useClaude } from './hooks/useClaude';
import { useChat } from './hooks/useChat';

import Header from './components/Header';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import CommentsTab from './components/tabs/CommentsTab';
import OutputTab from './components/tabs/OutputTab';
import ChatTab from './components/tabs/ChatTab';
import CommentTooltip from './components/CommentTooltip';
import CommentDrawer from './components/CommentDrawer';
import FileBrowser from './components/FileBrowser';
import NewDocumentModal from './components/NewDocumentModal';
import DocumentInfo from './components/DocumentInfo';
import SearchBar from './components/SearchBar';
import DiffView from './components/DiffView';
import FileExplorer from './components/FileExplorer';

const RichEditor = dynamic(() => import('./components/RichEditor'), { ssr: false });

export default function Home() {
  const doc = useDocument();
  const { comments, setComments, addComment, removeComment, patchComments, markApplied } = useComments(doc.filePath);
  const changelog = useChangelog();

  const [activeTab, setActiveTab] = useState<'comments' | 'output' | 'chat'>('comments');
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(false);
  const [showAgentTab, setShowAgentTab] = useState(true);

  // Theme state (persisted to localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const hour = new Date().getHours();
    return (hour >= 19 || hour < 7) ? 'dark' : 'light';
  });
  useEffect(() => {
    const saved = localStorage.getItem('helm-theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : '');
    } else {
      document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
    }
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('helm-theme', next);
      document.documentElement.setAttribute('data-theme', next === 'dark' ? 'dark' : '');
      return next;
    });
  }, []);

  // Document tab state
  const [tabs, setTabs] = useState<{ path: string; title: string }[]>([
    { path: doc.filePath, title: doc.filePath.split('/').pop() || 'Untitled' }
  ]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Comment UI state
  const [showMiniTooltip, setShowMiniTooltip] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [newComment, setNewComment] = useState('');

  const mainRef = useRef<HTMLElement>(null);
  const savedSelectionRef = useRef<{ text: string; range: Range | null }>({ text: '', range: null });

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(0);
  const [currentSearchMatch, setCurrentSearchMatch] = useState(0);
  const searchMarksRef = useRef<HTMLElement[]>([]);

  // Vim cursor state — tracks which block element is "focused" in normal mode
  const [vimCursorIndex, setVimCursorIndex] = useState(0);
  const vimCursorIndexRef = useRef(0);
  vimCursorIndexRef.current = vimCursorIndex;
  const [vimSelectionAnchor, setVimSelectionAnchor] = useState<number | null>(null);
  const vimSelectionAnchorRef = useRef<number | null>(null);
  vimSelectionAnchorRef.current = vimSelectionAnchor;
  const lastGRef = useRef(0); // for gg detection

  // Get navigable block elements from the article
  const getBlocks = useCallback((): HTMLElement[] => {
    const article = mainRef.current?.querySelector('article');
    if (!article) return [];
    return Array.from(article.querySelectorAll(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, ' +
      ':scope > p, :scope > ul > li, :scope > ol > li, :scope > blockquote, :scope > pre, ' +
      ':scope > table, :scope > hr, :scope > div'
    )) as HTMLElement[];
  }, []);

  // Move vim cursor and scroll into view
  const moveVimCursor = useCallback((delta: number) => {
    setVimCursorIndex(prev => {
      const blocks = getBlocks();
      if (blocks.length === 0) return 0;
      const next = Math.max(0, Math.min(blocks.length - 1, prev + delta));
      blocks[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return next;
    });
  }, [getBlocks]);

  const moveVimCursorTo = useCallback((pos: 'start' | 'end') => {
    const blocks = getBlocks();
    if (blocks.length === 0) return;
    const idx = pos === 'start' ? 0 : blocks.length - 1;
    setVimCursorIndex(idx);
    blocks[idx]?.scrollIntoView({ behavior: 'smooth', block: pos === 'start' ? 'start' : 'end' });
  }, [getBlocks]);

  // Reset cursor when document changes
  useEffect(() => { setVimCursorIndex(0); }, [doc.filePath]);

  // Apply/remove cursor highlight class on active block(s)
  useEffect(() => {
    if (doc.isEditMode) return;
    const blocks = getBlocks();
    // Clean up all
    blocks.forEach(b => { b.classList.remove('vim-block-cursor'); b.classList.remove('vim-block-selected'); });
    if (vimSelectionAnchor !== null) {
      // Range selection: highlight from anchor to cursor
      const lo = Math.min(vimSelectionAnchor, vimCursorIndex);
      const hi = Math.max(vimSelectionAnchor, vimCursorIndex);
      for (let i = lo; i <= hi; i++) {
        if (blocks[i]) {
          blocks[i].classList.add(i === vimCursorIndex ? 'vim-block-cursor' : 'vim-block-selected');
        }
      }
    } else if (blocks[vimCursorIndex]) {
      blocks[vimCursorIndex].classList.add('vim-block-cursor');
    }
    return () => { blocks.forEach(b => { b.classList.remove('vim-block-cursor'); b.classList.remove('vim-block-selected'); }); };
  }, [vimCursorIndex, vimSelectionAnchor, doc.isEditMode, doc.markdown, getBlocks]);

  // Search: highlight matches in the article DOM
  useEffect(() => {
    // Clean up previous search marks
    searchMarksRef.current.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    searchMarksRef.current = [];

    if (!showSearch || !searchText || doc.isEditMode) {
      setSearchMatchCount(0);
      return;
    }

    const article = articleRef.current;
    if (!article) { setSearchMatchCount(0); return; }

    const lower = searchText.toLowerCase();
    const marks: HTMLElement[] = [];

    // Walk text nodes and find matches
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      const textLower = text.toLowerCase();
      let startIdx = 0;
      const positions: number[] = [];

      while (true) {
        const idx = textLower.indexOf(lower, startIdx);
        if (idx < 0) break;
        positions.push(idx);
        startIdx = idx + lower.length;
      }

      if (positions.length === 0) continue;

      // Split this text node and wrap matches
      let currentNode = textNode;
      let offset = 0;

      for (const pos of positions) {
        if (pos > offset) {
          // Text before match
          currentNode = currentNode.splitText(pos - offset);
          offset = pos;
        }
        // Split at end of match
        const afterMatch = currentNode.splitText(searchText.length);
        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = currentNode.textContent;
        currentNode.parentNode!.replaceChild(mark, currentNode);
        marks.push(mark);
        currentNode = afterMatch;
        offset = pos + searchText.length;
      }
    }

    searchMarksRef.current = marks;
    setSearchMatchCount(marks.length);
    if (marks.length > 0) {
      setCurrentSearchMatch(prev => Math.min(prev, marks.length - 1));
    }
  }, [showSearch, searchText, doc.markdown, doc.isEditMode]);

  // Search: highlight the current active match
  useEffect(() => {
    searchMarksRef.current.forEach((mark, i) => {
      if (i === currentSearchMatch) {
        mark.classList.add('search-highlight-active');
        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        mark.classList.remove('search-highlight-active');
      }
    });
  }, [currentSearchMatch, searchMatchCount]);

  const searchNext = useCallback(() => {
    if (searchMatchCount === 0) return;
    setCurrentSearchMatch(prev => (prev + 1) % searchMatchCount);
  }, [searchMatchCount]);

  const searchPrev = useCallback(() => {
    if (searchMatchCount === 0) return;
    setCurrentSearchMatch(prev => (prev - 1 + searchMatchCount) % searchMatchCount);
  }, [searchMatchCount]);

  const searchReplace = useCallback(async () => {
    if (searchMatchCount === 0 || !searchText) return;
    // Replace the Nth occurrence in the raw markdown
    let count = 0;
    const idx = doc.markdown.toLowerCase().indexOf(searchText.toLowerCase());
    let searchIdx = 0;
    let targetIdx = -1;
    const lower = doc.markdown.toLowerCase();
    const searchLower = searchText.toLowerCase();

    while (searchIdx < doc.markdown.length) {
      const found = lower.indexOf(searchLower, searchIdx);
      if (found < 0) break;
      if (count === currentSearchMatch) {
        targetIdx = found;
        break;
      }
      count++;
      searchIdx = found + searchLower.length;
    }

    if (targetIdx >= 0) {
      const newMarkdown = doc.markdown.slice(0, targetIdx) + replaceText + doc.markdown.slice(targetIdx + searchText.length);
      try {
        await fetch('/api/file', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: doc.filePath, content: newMarkdown }),
        });
        doc.setMarkdown(newMarkdown);
      } catch (error) {
        console.error('Replace failed:', error);
      }
    }
  }, [searchMatchCount, searchText, replaceText, currentSearchMatch, doc.markdown, doc.filePath, doc.setMarkdown]);

  const searchReplaceAll = useCallback(async () => {
    if (searchMatchCount === 0 || !searchText) return;
    // Case-insensitive replace all
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newMarkdown = doc.markdown.replace(regex, replaceText);
    try {
      await fetch('/api/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: doc.filePath, content: newMarkdown }),
      });
      doc.setMarkdown(newMarkdown);
      setSearchMatchCount(0);
      setCurrentSearchMatch(0);
    } catch (error) {
      console.error('Replace all failed:', error);
    }
  }, [searchMatchCount, searchText, replaceText, doc.markdown, doc.filePath, doc.setMarkdown]);

  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchText('');
    setReplaceText('');
    setSearchMatchCount(0);
    setCurrentSearchMatch(0);
    // Clean up marks
    searchMarksRef.current.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    searchMarksRef.current = [];
  }, []);

  // Wrap loadDocument to also update comments, changelogs, and recent files
  const loadDocument = useCallback(async () => {
    const result = await doc.loadDocument();
    setComments(result.comments);
    changelog.setChangelogs(result.changelogs);
    // Add to recent files
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f !== doc.filePath);
      return [doc.filePath, ...filtered].slice(0, 5);
    });
  }, [doc.loadDocument, doc.filePath, setComments, changelog.setChangelogs]);

  const claude = useClaude({
    filePath: doc.filePath,
    markdown: doc.markdown,
    comments,
    setComments,
    patchComments,
    markApplied,
    createChangelog: changelog.createChangelog,
    updateChangelog: changelog.updateChangelog,
    loadDocument,
    setActiveTab,
  });

  const chat = useChat(doc.filePath, claude.model);

  // Initial load
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Load chat sessions when document changes
  useEffect(() => {
    chat.loadSessions(doc.filePath);
  }, [doc.filePath, chat.loadSessions]);

  // Sync active tab → document file path
  useEffect(() => {
    const activeTab = tabs[activeTabIndex];
    if (activeTab && activeTab.path !== doc.filePath) {
      doc.setFilePath(activeTab.path);
    }
  }, [activeTabIndex, tabs, doc.filePath, doc.setFilePath]);

  // Tab handlers
  const handleSelectTab = useCallback((index: number) => {
    setActiveTabIndex(index);
  }, []);

  const handleCloseTab = useCallback((index: number) => {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    if (index === activeTabIndex) {
      setActiveTabIndex(Math.min(index, newTabs.length - 1));
    } else if (index < activeTabIndex) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  }, [tabs, activeTabIndex]);

  const cancelComment = useCallback(() => {
    setShowCommentInput(false);
    setShowMiniTooltip(false);
    setNewComment('');
    setSelectedText('');
    savedSelectionRef.current = { text: '', range: null };
    window.getSelection()?.removeAllRanges();
  }, []);

  // Keyboard shortcuts: Cmd+K for comment, Cmd+P for file browser, tab shortcuts, etc.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        const selection = window.getSelection();
        const text = selection?.toString().trim();
        if (text && text.length >= 1) {
          const range = selection?.getRangeAt(0);
          if (range) {
            savedSelectionRef.current = { text, range: range.cloneRange() };
            setSelectedText(text);
            setShowCommentInput(true);
            setShowMiniTooltip(false);
          }
        } else {
          // No mouse selection — use vim cursor block(s)
          const blocks = getBlocks();
          const anchor = vimSelectionAnchorRef.current;
          const cursor = vimCursorIndexRef.current;
          const lo = anchor !== null ? Math.min(anchor, cursor) : cursor;
          const hi = anchor !== null ? Math.max(anchor, cursor) : cursor;
          const selectedBlocks = blocks.slice(lo, hi + 1);
          if (selectedBlocks.length > 0) {
            const blockText = selectedBlocks.map(b => b.textContent?.trim()).filter(Boolean).join('\n\n');
            if (blockText) {
              const range = document.createRange();
              range.setStartBefore(selectedBlocks[0]);
              range.setEndAfter(selectedBlocks[selectedBlocks.length - 1]);
              savedSelectionRef.current = { text: blockText, range: range.cloneRange() };
              setSelectedText(blockText);
              setShowCommentInput(true);
              setShowMiniTooltip(false);
            }
          }
        }
      }

      if (e.metaKey && e.key === 'p') {
        e.preventDefault();
        setShowFileBrowser(true);
      }

      if (e.metaKey && e.key === 'n') {
        e.preventDefault();
        setShowNewDocModal(true);
      }

      // Cmd+F: search / find and replace
      if (e.metaKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }

      // Cmd+B: toggle file explorer (left panel)
      if (e.metaKey && !e.altKey && e.key === 'b') {
        e.preventDefault();
        setShowFileExplorer(prev => !prev);
      }

      // Cmd+Option+B: toggle agent tab (right panel)
      if (e.metaKey && e.altKey && (e.key === 'b' || e.key === '∫' || e.code === 'KeyB')) {
        e.preventDefault();
        setShowAgentTab(prev => !prev);
      }

      // Cmd+E: toggle edit mode
      if (e.metaKey && e.key === 'e') {
        e.preventDefault();
        doc.toggleEditMode();
      }

      // Cmd+Enter: send comments to Claude (when on comments tab with pending comments, not in comment drawer)
      if (e.metaKey && e.key === 'Enter' && !showCommentInput) {
        e.preventDefault();
        if (activeTab === 'comments' && comments.filter(c => c.status === 'pending').length > 0 && !claude.isSending) {
          claude.sendToClaude();
        }
      }

      // Cmd+1-9: jump to document tab by number
      if (e.metaKey && !e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < tabs.length) {
          handleSelectTab(tabIndex);
        }
      }

      // Cmd+W: close current tab
      if (e.metaKey && e.key === 'w') {
        e.preventDefault();
        handleCloseTab(activeTabIndex);
      }

      // Cmd+Shift+[ / Cmd+Shift+]: cycle tabs
      if (e.metaKey && e.shiftKey && e.key === '[') {
        e.preventDefault();
        const prevIndex = activeTabIndex > 0 ? activeTabIndex - 1 : tabs.length - 1;
        handleSelectTab(prevIndex);
      }
      if (e.metaKey && e.shiftKey && e.key === ']') {
        e.preventDefault();
        const nextIndex = activeTabIndex < tabs.length - 1 ? activeTabIndex + 1 : 0;
        handleSelectTab(nextIndex);
      }

      // Enter: enter edit mode at current vim cursor position
      if (e.key === 'Enter' && !doc.isEditMode && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          doc.toggleEditMode();
        }
      }

      // Vim navigation in normal mode — cursor-based movement
      if (!doc.isEditMode) {
        const tag = (e.target as HTMLElement).tagName;
        const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
        if (!isInput) {
          // j/k — move cursor one block; Shift+j/k extends selection
          if ((e.key === 'j' || e.key === 'J') && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              if (vimSelectionAnchorRef.current === null) {
                setVimSelectionAnchor(vimCursorIndexRef.current);
              }
            } else {
              setVimSelectionAnchor(null);
            }
            moveVimCursor(1);
          }
          if ((e.key === 'k' || e.key === 'K') && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            if (e.shiftKey) {
              if (vimSelectionAnchorRef.current === null) {
                setVimSelectionAnchor(vimCursorIndexRef.current);
              }
            } else {
              setVimSelectionAnchor(null);
            }
            moveVimCursor(-1);
          }
          // Ctrl+D / Ctrl+U — half-page jump (~10 blocks)
          if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            moveVimCursor(10);
          }
          if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            moveVimCursor(-10);
          }
          // Ctrl+F / Ctrl+B — full page jump (~20 blocks)
          if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            moveVimCursor(20);
          }
          if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            moveVimCursor(-20);
          }
          // G — go to end
          if (e.key === 'G' && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            moveVimCursorTo('end');
          }
          // gg — go to start (double-g within 300ms)
          if (e.key === 'g' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            const now = Date.now();
            if (now - lastGRef.current < 300) {
              e.preventDefault();
              moveVimCursorTo('start');
              lastGRef.current = 0;
            } else {
              lastGRef.current = now;
            }
          }
        }
      }

      // / — vim-style search (normal mode only)
      if (e.key === '/' && !doc.isEditMode && !e.metaKey && !e.ctrlKey) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !(e.target as HTMLElement).isContentEditable) {
          e.preventDefault();
          setShowSearch(true);
        }
      }

      // Escape: close overlays, or exit edit mode (vim normal mode)
      if (e.key === 'Escape') {
        if (showSearch) {
          closeSearch();
        } else if (showNewDocModal) {
          setShowNewDocModal(false);
        } else if (showFileBrowser) {
          setShowFileBrowser(false);
        } else if (showCommentInput) {
          cancelComment();
        } else if (doc.isEditMode) {
          doc.saveDocument(); // vim-style: Escape saves and exits insert mode
        } else {
          setVimSelectionAnchor(null); // clear multi-block selection
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [doc.isEditMode, doc.toggleEditMode, doc.saveDocument, activeTabIndex, tabs.length, handleCloseTab, handleSelectTab, activeTab, comments, claude.isSending, claude.sendToClaude, showFileBrowser, showNewDocModal, showCommentInput, showSearch, cancelComment, closeSearch, moveVimCursor, moveVimCursorTo]);

  // Document-level selection handler
  useEffect(() => {
    const handleSelection = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length >= 1) {
          try {
            const range = selection?.getRangeAt(0);
            if (!range) return;

            const rect = range.getBoundingClientRect();

            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            const isInMain = mainRef.current?.contains(startContainer) ||
                            mainRef.current?.contains(endContainer);

            if (rect && rect.width > 0 && rect.height > 0 && isInMain) {
              savedSelectionRef.current = { text, range: range.cloneRange() };
              setSelectedText(text);

              if (text.length >= 3) {
                setTooltipPosition({
                  x: Math.max(80, Math.min(rect.left + rect.width / 2, window.innerWidth - 80)),
                  y: rect.bottom + 10
                });
                setShowMiniTooltip(true);
                setShowCommentInput(false);
              }
            }
          } catch (e) {
            // Selection might be invalid, ignore
          }
        } else {
          setShowMiniTooltip(false);
        }
      }, 10);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-comment-ui]') && !mainRef.current?.contains(target)) {
        setShowMiniTooltip(false);
        setSelectedText('');
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [doc.isEditMode]);

  const openCommentInput = () => {
    setShowMiniTooltip(false);
    setShowCommentInput(true);
  };

  const handleAddComment = async (commentText: string, refs?: { docs: string[]; mcps: string[] }) => {
    if (commentText.trim() && selectedText) {
      await addComment(selectedText, commentText);
      setNewComment('');
      setShowCommentInput(false);
      setShowMiniTooltip(false);
      setSelectedText('');
      savedSelectionRef.current = { text: '', range: null };
      window.getSelection()?.removeAllRanges();
    }
  };

  const openFileBrowser = useCallback(() => {
    setShowFileBrowser(true);
  }, []);


  const handleSelectFile = useCallback((path: string) => {
    setShowFileBrowser(false);
    const existingIdx = tabs.findIndex(t => t.path === path);
    if (existingIdx >= 0) {
      setActiveTabIndex(existingIdx);
    } else {
      const newTab = { path, title: path.split('/').pop() || 'Untitled' };
      setTabs(prev => {
        const updated = [...prev, newTab];
        setActiveTabIndex(updated.length - 1);
        return updated;
      });
    }
  }, [tabs]);

  const handleNewDocument = useCallback(async (filePath: string, prompt: string) => {
    setShowNewDocModal(false);
    // Open the file in a new tab first (it'll be empty initially)
    handleSelectFile(filePath);
    // Send to Claude to write the content
    const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
    if (isElectron) {
      const api = window.electronAPI!;
      const cleanupStream = api.claude.onStream(() => {
        // Could show progress but for now just wait
      });
      const cleanupComplete = api.claude.onComplete(async (data) => {
        cleanupStream();
        cleanupComplete();
        if (data.success) {
          await loadDocument();
        }
      });
      await api.claude.sendEdit(
        `Create the file ${filePath} with the following content based on this description: ${prompt}\n\nWrite comprehensive, well-structured markdown content. Include appropriate headers, sections, and formatting.`,
        filePath,
        claude.model
      );
    }
  }, [handleSelectFile, loadDocument, claude.model]);

  // Navigate to a related document by name (resolves to sibling .md file)
  const navigateToDocument = useCallback((docName: string) => {
    const dir = doc.filePath.substring(0, doc.filePath.lastIndexOf('/'));
    handleSelectFile(`${dir}/${docName}.md`);
  }, [doc.filePath, handleSelectFile]);

  // Pre-process markdown to convert [[wiki-links]] to clickable spans
  const processWikiLinks = useCallback((md: string): string => {
    return md.replace(/\[\[([^\]]+)\]\]/g, '<a class="wiki-link" data-wiki="$1" href="#">$1</a>');
  }, []);

  const articleRef = useRef<HTMLElement>(null);

  // Highlight text in the rendered DOM for:
  // 1. Saved comments (while they exist)
  // 2. Active selection (while comment drawer is open)
  useEffect(() => {
    const article = articleRef.current;
    if (!article || doc.isEditMode) return;

    // Remove old highlights
    article.querySelectorAll('mark.comment-highlight').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });

    // Build list of texts to highlight
    const textsToHighlight: { text: string; tooltip: string; cssClass: string }[] = [];

    // Active selection while drawer is open
    if (showCommentInput && selectedText && selectedText.length >= 3) {
      textsToHighlight.push({ text: selectedText, tooltip: 'Adding comment...', cssClass: 'comment-highlight-active' });
    }

    // Saved comments
    for (const comment of comments) {
      if (comment.selectedText && comment.selectedText.length >= 3) {
        // Don't double-highlight if it's the same as active selection
        if (showCommentInput && comment.selectedText === selectedText) continue;
        const cls = comment.status === 'applied' ? 'comment-highlight-applied' : '';
        textsToHighlight.push({ text: comment.selectedText, tooltip: comment.comment, cssClass: cls });
      }
    }

    if (textsToHighlight.length === 0) return;

    // Build a flat map of text nodes with character offsets for cross-node matching
    const textNodes: { node: Text; start: number; end: number }[] = [];
    let offset = 0;
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    let tNode: Text | null;
    while ((tNode = walker.nextNode() as Text | null)) {
      const len = tNode.textContent?.length || 0;
      textNodes.push({ node: tNode, start: offset, end: offset + len });
      offset += len;
    }

    const fullText = textNodes.map(tn => tn.node.textContent).join('');
    const matched = new Set<string>();

    for (const { text, tooltip, cssClass } of textsToHighlight) {
      if (matched.has(text)) continue;
      const idx = fullText.indexOf(text);
      if (idx < 0) continue;
      matched.add(text);

      const endIdx = idx + text.length;

      // Find all text nodes that overlap with this range
      for (const tn of textNodes) {
        if (tn.end <= idx || tn.start >= endIdx) continue;

        const markStart = Math.max(0, idx - tn.start);
        const markEnd = Math.min(tn.node.textContent!.length, endIdx - tn.start);

        if (markStart >= markEnd) continue;

        const mark = document.createElement('mark');
        mark.className = 'comment-highlight' + (cssClass ? ' ' + cssClass : '');
        mark.title = tooltip;

        const range = document.createRange();
        range.setStart(tn.node, markStart);
        range.setEnd(tn.node, markEnd);

        try {
          range.surroundContents(mark);
          // surroundContents splits the text node, so update our map
          // Re-walking would be expensive; for now just continue
        } catch {
          // If surroundContents fails (rare), skip this segment
        }
      }
    }
  }, [comments, doc.markdown, doc.isEditMode, showCommentInput, selectedText]);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden paper-texture"
      style={{ background: 'var(--color-paper)' }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        // Use Electron's webUtils.getPathForFile (works with sandbox)
        const api = (window as any).electronAPI;
        const filePath = api?.getPathForFile?.(file) || (file as any).path;
        if (filePath) {
          handleSelectFile(filePath);
        } else if (file.name) {
          // Browser fallback: construct from current directory
          const currentDir = doc.filePath.substring(0, doc.filePath.lastIndexOf('/'));
          handleSelectFile(`${currentDir}/${file.name}`);
        }
      }}
    >
      <Header
        filePath={doc.filePath}
        setFilePath={doc.setFilePath}
        isEditMode={doc.isEditMode}
        isSaving={doc.isSaving}
        loadDocument={loadDocument}
        saveDocument={doc.saveDocument}
        toggleEditMode={doc.toggleEditMode}
        setIsEditMode={doc.setIsEditMode}
        openFileBrowser={openFileBrowser}
        onNewDocument={() => setShowNewDocModal(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <TabBar
        tabs={tabs}
        activeIndex={activeTabIndex}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* File explorer (left panel) */}
        {showFileExplorer && (
          <div
            style={{
              width: '240px',
              flexShrink: 0,
              borderRight: '1px solid var(--color-border)',
              background: 'var(--color-paper-dark)',
              overflowY: 'auto',
            }}
          >
            <FileExplorer
              show={showFileExplorer}
              currentDir={doc.filePath.substring(0, doc.filePath.lastIndexOf('/'))}
              currentFile={doc.filePath}
              onSelectFile={handleSelectFile}
            />
          </div>
        )}

        {/* Main document area */}
        <main
          ref={mainRef}
          className="flex-1 py-10 px-16 relative overflow-y-auto"
          style={{
            background: 'var(--color-surface)',
            paddingBottom: '48px',
          }}
        >
          {showSearch && (
            <SearchBar
              onClose={closeSearch}
              searchText={searchText}
              onSearchChange={(text) => { setSearchText(text); setCurrentSearchMatch(0); }}
              replaceText={replaceText}
              onReplaceChange={setReplaceText}
              currentMatch={currentSearchMatch}
              matchCount={searchMatchCount}
              onNext={searchNext}
              onPrev={searchPrev}
              onReplace={searchReplace}
              onReplaceAll={searchReplaceAll}
            />
          )}
          {doc.isLoading ? (
            <div
              className="flex items-center gap-3 animate-pulse-subtle"
              style={{ color: 'var(--color-ink-faded)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              Loading document...
            </div>
          ) : (
            <>
              <div style={{ display: doc.isEditMode ? 'block' : 'none' }}>
                <RichEditor
                  content={doc.editedHtml}
                  onChange={(html) => doc.setEditedHtml(html)}
                  initialBlockIndex={vimCursorIndex}
                  isVisible={doc.isEditMode}
                />
              </div>
              <div style={{ display: doc.isEditMode ? 'none' : 'block' }}>
                <DocumentInfo
                  frontmatter={doc.frontmatter}
                  onNavigate={navigateToDocument}
                />
                {claude.beforeMarkdown && claude.afterMarkdown ? (
                  <DiffView
                    before={claude.beforeMarkdown}
                    after={claude.afterMarkdown}
                    onApprove={() => {
                      claude.approveChanges();
                      comments.filter(c => c.status === 'applied').forEach(c => removeComment(c.id));
                    }}
                    onReject={claude.rejectChanges}
                  />
                ) : (
                  <article
                    ref={articleRef}
                    className="prose prose-editorial max-w-none"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.classList.contains('wiki-link')) {
                        e.preventDefault();
                        const docName = target.getAttribute('data-wiki');
                        if (docName) navigateToDocument(docName);
                        return;
                      }
                      // Click to move vim cursor to the clicked block
                      const blocks = getBlocks();
                      const blockMap = new Map<HTMLElement, number>();
                      for (let i = 0; i < blocks.length; i++) blockMap.set(blocks[i], i);
                      let el: HTMLElement | null = target;
                      while (el && el !== e.currentTarget) {
                        const idx = blockMap.get(el);
                        if (idx !== undefined) {
                          setVimCursorIndex(idx);
                          setVimSelectionAnchor(null);
                          break;
                        }
                        el = el.parentElement;
                      }
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkFrontmatter]} rehypePlugins={[rehypeRaw]}>
                      {processWikiLinks(doc.markdown)}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            </>
          )}
        </main>

        {showAgentTab && <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          commentsCount={comments.length}
          isSending={claude.isSending}
          isChatStreaming={chat.isStreaming}
        >
          {activeTab === 'comments' ? (
            <CommentsTab
              comments={comments}
              isSending={claude.isSending}
              selectedText={selectedText}
              savedSelectionRef={savedSelectionRef}
              setSelectedText={setSelectedText}
              setShowCommentInput={setShowCommentInput}
              setShowMiniTooltip={setShowMiniTooltip}
              setTooltipPosition={setTooltipPosition}
              sendToClaude={claude.sendToClaude}
              removeComment={removeComment}
              approveComment={(id) => {
                removeComment(id);
              }}
              onReviseComment={(comment) => {
                setSelectedText(comment.selectedText);
                setShowCommentInput(true);
                removeComment(comment.id);
              }}
              model={claude.model}
              setModel={claude.setModel}
              hasChanges={!!(claude.beforeMarkdown && claude.afterMarkdown)}
            />
          ) : activeTab === 'output' ? (
            <OutputTab
              claudeOutput={claude.claudeOutput}
              streamOutput={claude.streamOutput}
              setStreamOutput={claude.setStreamOutput}
              isStreaming={claude.isStreaming}
              isSending={claude.isSending}
              showLastOutput={claude.showLastOutput}
              setShowLastOutput={claude.setShowLastOutput}
              streamRef={claude.streamRef}
              loadLastOutput={claude.loadLastOutput}
              changelogs={changelog.changelogs}
              expandedEntryId={changelog.expandedEntryId}
              setExpandedEntryId={changelog.setExpandedEntryId}
              onClearChangelogs={() => changelog.clearChangelogs(doc.filePath)}
            />
          ) : (
            <ChatTab
              sessions={chat.sessions}
              activeSessionId={chat.activeSessionId}
              messages={chat.messages}
              streamOutput={chat.streamOutput}
              isStreaming={chat.isStreaming}
              streamRef={chat.streamRef}
              selectedText={selectedText}
              onNewSession={chat.newSession}
              onSelectSession={chat.selectSession}
              onSendMessage={chat.sendMessage}
              onDeleteSession={chat.deleteSession}
            />
          )}
        </Sidebar>}
      </div>

      <CommentTooltip
        show={showMiniTooltip && !showCommentInput && selectedText.length >= 3}
        position={tooltipPosition}
        onAddComment={openCommentInput}
      />

      <CommentDrawer
        show={showCommentInput}
        selectedText={selectedText}
        newComment={newComment}
        setNewComment={setNewComment}
        onSubmit={handleAddComment}
        onCancel={cancelComment}
        currentDir={doc.filePath.substring(0, doc.filePath.lastIndexOf('/'))}
      />

      <NewDocumentModal
        show={showNewDocModal}
        currentDir={doc.filePath.substring(0, doc.filePath.lastIndexOf('/'))}
        onSubmit={handleNewDocument}
        onCancel={() => setShowNewDocModal(false)}
      />

      <FileBrowser
        show={showFileBrowser}
        filePath={doc.filePath}
        recentFiles={recentFiles}
        onSelectFile={handleSelectFile}
        onClose={() => setShowFileBrowser(false)}
      />

      {/* Vim-style mode indicator */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          paddingRight: '12px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          letterSpacing: '0.05em',
          background: doc.isEditMode ? 'var(--color-vim-insert-bg)' : 'var(--color-vim-normal-bg)',
          color: doc.isEditMode ? 'var(--color-vim-insert-fg)' : 'var(--color-vim-normal-fg)',
          zIndex: 50,
          transition: 'background 0.2s, color 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 600 }}>
            {doc.isEditMode ? '-- INSERT --' : 'NORMAL'}
          </span>
          <span style={{ opacity: 0.5 }}>
            {doc.isEditMode
              ? 'ESC to save+exit'
              : '⏎ edit  j/k move  ^d/^u page  gg/G jump  / search  ⌘B files'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.5 }}>
          {!doc.isEditMode && (
            <span>Ln {vimCursorIndex + 1}</span>
          )}
          <span>{doc.filePath.split('/').pop()}</span>
        </div>
      </div>

      {isDragOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-accent-subtle)',
            border: '3px dashed var(--color-accent)',
            borderRadius: '8px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '16px 32px',
              background: 'var(--color-surface)',
              borderRadius: '8px',
              color: 'var(--color-accent)',
              fontSize: '18px',
              fontWeight: 600,
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}
          >
            Drop .md file to open
          </div>
        </div>
      )}
    </div>
  );
}
