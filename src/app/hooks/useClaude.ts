'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Comment } from '../types';

interface UseClaudeOptions {
  filePath: string;
  markdown: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  patchComments: (requestId: string) => Promise<void>;
  markApplied: () => void;
  createChangelog: (documentPath: string, requestId: string, commentsSnapshot: string) => Promise<number | null>;
  updateChangelog: (changelogId: number, status: string, streamLog?: string, summary?: string) => Promise<void>;
  loadDocument: () => Promise<unknown>;
  setActiveTab: (tab: 'comments' | 'output' | 'chat') => void;
}

export function useClaude({
  filePath,
  markdown,
  comments,
  setComments,
  patchComments,
  markApplied,
  createChangelog,
  updateChangelog,
  loadDocument,
  setActiveTab,
}: UseClaudeOptions) {
  const [claudeOutput, setClaudeOutput] = useState<string>('');
  const [streamOutput, setStreamOutput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showLastOutput, setShowLastOutput] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const [beforeMarkdown, setBeforeMarkdown] = useState<string | null>(null);
  const [afterMarkdown, setAfterMarkdown] = useState<string | null>(null);

  const loadLastOutput = useCallback(async () => {
    try {
      const res = await fetch('/api/claude/stream');
      const data = await res.json();
      if (data.content) {
        setStreamOutput(data.content);
        setShowLastOutput(true);
      } else {
        setStreamOutput('No previous output found.');
        setShowLastOutput(true);
      }
    } catch (e) {
      console.error('Failed to load last output:', e);
      setStreamOutput('Failed to load output.');
      setShowLastOutput(true);
    }
  }, []);

  const approveChanges = useCallback(() => {
    setBeforeMarkdown(null);
    setAfterMarkdown(null);
  }, []);

  const rejectChanges = useCallback(async () => {
    if (!beforeMarkdown) return;
    try {
      await fetch('/api/file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: beforeMarkdown })
      });
      // Revert applied comments back to pending
      const reverted = comments.map(c =>
        c.status === 'applied' ? { ...c, status: 'pending' as const } : c
      );
      setComments(reverted);
      await loadDocument();
      setBeforeMarkdown(null);
      setAfterMarkdown(null);
    } catch (error) {
      console.error('Failed to revert changes:', error);
    }
  }, [beforeMarkdown, filePath, comments, setComments, loadDocument]);

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  const [model, setModel] = useState<string>('sonnet');

  const sendToClaude = async () => {
    const pendingComments = comments.filter(c => c.status === 'pending');
    if (pendingComments.length === 0) return;

    setBeforeMarkdown(markdown);

    setIsSending(true);
    setClaudeOutput('');
    setStreamOutput('');
    setIsStreaming(true);
    setActiveTab('output');

    // Clear the stream file (only needed for file-based flow)
    if (!isElectron) {
      try {
        await fetch('/api/claude/stream', { method: 'DELETE' });
      } catch (e) {
        // Ignore
      }
    }

    const requestId = Date.now().toString();
    const changelogId = await createChangelog(filePath, requestId, JSON.stringify(pendingComments));

    // Collect @ references from all pending comments
    const docRefs = new Set<string>();
    const mcpRefs = new Set<string>();
    for (const c of pendingComments) {
      const mcpMatches = c.comment.matchAll(/@mcp:([\w-]+)/g);
      for (const m of mcpMatches) mcpRefs.add(m[1]);
      const docMatches = c.comment.matchAll(/@([\w.-]+\.md)/g);
      for (const m of docMatches) docRefs.add(m[1]);
    }

    // Fetch content of referenced docs
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    let refContext = '';
    for (const docName of docRefs) {
      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(dir + '/' + docName)}`);
        const data = await res.json();
        if (data.content) {
          refContext += `\n\nReference document (${docName}):\n\`\`\`\n${data.content}\n\`\`\``;
        }
      } catch {
        // skip unreachable docs
      }
    }

    const prompt = `Update the file ${filePath} with these changes:\n\n${pendingComments.map((c, i) =>
      `${i + 1}. Selected text:\n"""\n${c.selectedText}\n"""\nInstruction: ${c.comment}`
    ).join('\n\n')}\n\nMake the changes directly to the file. Be precise and only change what's requested.${refContext}`;

    await patchComments(requestId);

    const patchChangelog = async (status: string, streamLog?: string, summary?: string) => {
      if (!changelogId) return;
      await updateChangelog(changelogId, status, streamLog, summary);
    };

    if (isElectron) {
      // Electron IPC flow - spawn Claude CLI directly via main process
      const api = window.electronAPI!;
      try {
        setClaudeOutput('Waiting for Claude Code to process changes...');

        const cleanupStream = api.claude.onStream((data) => {
          if (data.type === 'edit') {
            setStreamOutput(data.content);
            if (streamRef.current) {
              streamRef.current.scrollTop = streamRef.current.scrollHeight;
            }
          }
        });

        const cleanupComplete = api.claude.onComplete(async (data) => {
          if (data.type === 'edit') {
            cleanupStream();
            cleanupComplete();
            if (data.success) {
              const successMessage = 'Changes applied — review changes below';
              setClaudeOutput(successMessage);
              markApplied();
              await patchChangelog('completed', data.content, successMessage);
              try {
                const newFileRes = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
                const newFileData = await newFileRes.json();
                if (newFileData.content) {
                  setAfterMarkdown(newFileData.content);
                }
              } catch (e) {
                // Ignore — diff just won't show
              }
              await loadDocument();
              setActiveTab('comments');
            } else {
              const errorMessage = data.error || 'Failed to apply changes';
              setClaudeOutput(`Error: ${errorMessage}`);
              await patchChangelog('error', data.content, errorMessage);
            }
            setIsSending(false);
            setIsStreaming(false);
          }
        });

        await api.claude.sendEdit(prompt, filePath, model);
      } catch (error) {
        console.error('Failed to send to Claude via IPC:', error);
        setClaudeOutput('Error: Failed to communicate with Claude Code');
        setIsSending(false);
        setIsStreaming(false);
        await patchChangelog('error', undefined, 'Failed to communicate with Claude Code');
      }
    } else {
      // Fetch-based flow (Next.js API routes + file watcher)
      try {
        const res = await fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, filePath })
        });

        const data = await res.json();

        if (data.success) {
          setClaudeOutput('Waiting for Claude Code to process changes...');

          // Poll for stream output
          const pollStream = async () => {
            try {
              const streamRes = await fetch('/api/claude/stream');
              const streamData = await streamRes.json();
              if (streamData.content) {
                setStreamOutput(streamData.content);
                if (streamRef.current) {
                  streamRef.current.scrollTop = streamRef.current.scrollHeight;
                }
              }
            } catch (e) {
              // Ignore stream errors
            }
          };

          // Poll for status
          const pollStatus = async () => {
            try {
              await pollStream();

              const statusRes = await fetch('/api/claude');
              const status = await statusRes.json();

              if (status.status === 'complete') {
                const successMessage = status.message || 'Changes applied — review changes below';
                setClaudeOutput(successMessage);
                setIsSending(false);
                setIsStreaming(false);
                markApplied();

                await patchChangelog('completed', streamOutput, successMessage);
                try {
                  const newFileRes = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
                  const newFileData = await newFileRes.json();
                  if (newFileData.content) {
                    setAfterMarkdown(newFileData.content);
                  }
                } catch (e) {
                  // Ignore — diff just won't show
                }
                await loadDocument();
                setActiveTab('comments');
                return;
              } else if (status.status === 'error') {
                const errorMessage = status.message || 'Failed to apply changes';
                setClaudeOutput(`Error: ${errorMessage}`);
                setIsSending(false);
                setIsStreaming(false);

                await patchChangelog('error', streamOutput, errorMessage);
                return;
              }

              setTimeout(pollStatus, 500);
            } catch (err) {
              setTimeout(pollStatus, 500);
            }
          };

          pollStatus();
        } else {
          const errorMessage = data.message || 'Failed to send comments';
          setClaudeOutput('Error: ' + errorMessage);
          setIsSending(false);
          setIsStreaming(false);

          await patchChangelog('error', undefined, errorMessage);
        }
      } catch (error) {
        console.error('Failed to send to Claude:', error);
        setClaudeOutput('Error: Failed to communicate with Claude Code');
        setIsSending(false);
        setIsStreaming(false);

        await patchChangelog('error', undefined, 'Failed to communicate with Claude Code');
      }
    }
  };

  return {
    claudeOutput,
    streamOutput,
    setStreamOutput,
    isStreaming,
    isSending,
    showLastOutput,
    setShowLastOutput,
    streamRef,
    loadLastOutput,
    model,
    setModel,
    sendToClaude,
    beforeMarkdown,
    afterMarkdown,
    approveChanges,
    rejectChanges,
  };
}
