'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { templates, Template } from '../templates';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface NewDocumentModalProps {
  show: boolean;
  currentDir: string;
  onSubmit: (filePath: string, prompt: string) => void;
  onCancel: () => void;
}

export default function NewDocumentModal({
  show,
  currentDir,
  onSubmit,
  onCancel,
}: NewDocumentModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileNameManuallyEdited, setFileNameManuallyEdited] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [contextFiles, setContextFiles] = useState<FileEntry[]>([]);
  const [selectedContextPaths, setSelectedContextPaths] = useState<string[]>([]);
  const [contextOpen, setContextOpen] = useState(false);

  const fileNameRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setStep(1);
      setSelectedTemplate(null);
      setFileName('');
      setFileNameManuallyEdited(false);
      setPrompt('');
      setSelectedContextPaths([]);
      setContextOpen(false);
    }
  }, [show]);

  // Fetch sibling .md files for context picker when entering step 2
  useEffect(() => {
    if (step === 2 && currentDir) {
      fetch(`/api/files?path=${encodeURIComponent(currentDir)}`)
        .then((res) => res.json())
        .then((data) => {
          const mdFiles = (data.files || []).filter(
            (f: FileEntry) => !f.isDirectory && f.name.endsWith('.md')
          );
          setContextFiles(mdFiles);
        })
        .catch(() => setContextFiles([]));
    }
  }, [step, currentDir]);

  // Focus filename input on step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => fileNameRef.current?.focus(), 50);
    }
  }, [step]);

  // Auto-suggest filename from template + prompt
  useEffect(() => {
    if (step === 2 && !fileNameManuallyEdited && selectedTemplate) {
      if (prompt.trim()) {
        const words = prompt.trim().split(/\s+/).slice(0, 3);
        const slug = words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
        setFileName(`${selectedTemplate.id}-${slug}.md`);
      } else {
        setFileName(`${selectedTemplate.id}-untitled.md`);
      }
    }
  }, [prompt, step, selectedTemplate, fileNameManuallyEdited]);

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
    setFileName('');
    setFileNameManuallyEdited(false);
    setPrompt('');
    setSelectedContextPaths([]);
    setContextOpen(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!fileName.trim() || !prompt.trim() || !selectedTemplate) return;

    const name = fileName.endsWith('.md') ? fileName : fileName + '.md';
    const filePath = `${currentDir}/${name}`;

    // Build the full prompt
    let fullPrompt = '';

    if (selectedTemplate.id === 'blank') {
      fullPrompt = `${selectedTemplate.promptPrefix}\n\nDescription: ${prompt}`;
    } else {
      fullPrompt = `${selectedTemplate.promptPrefix}\n\nStructure the document with these sections:\n${selectedTemplate.skeleton}\nDescription: ${prompt}`;
    }

    // Fetch and append context docs
    if (selectedContextPaths.length > 0) {
      const contextParts: string[] = [];
      for (const ctxPath of selectedContextPaths) {
        try {
          const res = await fetch(`/api/file?path=${encodeURIComponent(ctxPath)}`);
          const data = await res.json();
          if (data.content) {
            const ctxName = ctxPath.split('/').pop() || ctxPath;
            contextParts.push(`### ${ctxName}\n${data.content}`);
          }
        } catch {
          // Skip files that fail to load
        }
      }
      if (contextParts.length > 0) {
        fullPrompt += `\n\nReference documents:\n${contextParts.join('\n\n')}`;
      }
    }

    onSubmit(filePath, fullPrompt);
  }, [fileName, prompt, selectedTemplate, selectedContextPaths, currentDir, onSubmit]);

  const toggleContextFile = (path: string) => {
    setSelectedContextPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const removeContextFile = (path: string) => {
    setSelectedContextPaths((prev) => prev.filter((p) => p !== path));
  };

  if (!show) return null;

  const canSubmit = fileName.trim() && prompt.trim();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-backdrop"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={step === 1 ? onCancel : undefined}
      />

      {/* Modal */}
      <div
        className="fixed z-50 animate-fade-in"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 90vw)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            if (step === 2) handleBack();
            else onCancel();
          }
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)', flexShrink: 0 }}
        >
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="w-7 h-7 rounded-md flex items-center justify-center btn-ghost mr-1"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-ink-muted)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <h2
              className="font-semibold"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
            >
              {step === 1 ? 'New Document' : `New ${selectedTemplate?.name || 'Document'}`}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-md flex items-center justify-center btn-ghost"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-ink-muted)"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ──── Step 1: Template Selection ──── */}
        {step === 1 && (
          <div className="p-6">
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--color-ink-muted)', fontFamily: 'var(--font-sans)' }}
            >
              Choose a document type to get started
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="template-card"
                  style={
                    t.id === 'blank' ? { gridColumn: '1 / -1' } : undefined
                  }
                  onClick={() => handleSelectTemplate(t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectTemplate(t);
                    }
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={t.icon} />
                  </svg>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
                  >
                    {t.name}
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: 'var(--color-ink-muted)',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.4,
                    }}
                  >
                    {t.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──── Step 2: Configuration ──── */}
        {step === 2 && selectedTemplate && (
          <>
            <div
              className="p-6 flex flex-col gap-4"
              style={{ overflowY: 'auto', flex: 1 }}
            >
              {/* File name */}
              <div>
                <label
                  className="text-xs font-medium uppercase tracking-wide mb-2 block"
                  style={{ color: 'var(--color-ink-faded)' }}
                >
                  File name
                </label>
                <input
                  ref={fileNameRef}
                  type="text"
                  value={fileName}
                  onChange={(e) => {
                    setFileName(e.target.value);
                    setFileNameManuallyEdited(true);
                  }}
                  placeholder="my-document.md"
                  className="w-full px-3 py-2 text-sm rounded-lg transition-all focus:outline-none"
                  style={{
                    border: '2px solid var(--color-border)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 3px var(--color-accent-light)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      promptRef.current?.focus();
                    }
                    if (e.key === 'Escape') {
                      handleBack();
                    }
                  }}
                />
                <span
                  className="text-xs mt-1 block"
                  style={{ color: 'var(--color-ink-faded)' }}
                >
                  {currentDir}/
                </span>
              </div>

              {/* Prompt / Description */}
              <div className="flex flex-col">
                <label
                  className="text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: 'var(--color-ink-faded)' }}
                >
                  Describe what you want to write
                </label>
                <textarea
                  ref={promptRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    selectedTemplate.id === 'blank'
                      ? 'A blog post about productivity tips for remote workers...'
                      : `Describe the ${selectedTemplate.name.toLowerCase()} you want to create...`
                  }
                  className="w-full p-3 text-sm rounded-lg transition-all resize-none focus:outline-none"
                  style={{
                    border: '2px solid var(--color-border)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    lineHeight: 1.6,
                    minHeight: '120px',
                    background: 'var(--color-surface)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 3px var(--color-accent-light)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                    if (e.key === 'Escape') {
                      handleBack();
                    }
                  }}
                />
              </div>

              {/* Suggested sections (read-only reference) */}
              {selectedTemplate.sections.length > 0 && (
                <div>
                  <label
                    className="text-xs font-medium uppercase tracking-wide mb-2 block"
                    style={{ color: 'var(--color-ink-faded)' }}
                  >
                    Suggested sections
                  </label>
                  <div
                    className="flex flex-wrap gap-1.5"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {selectedTemplate.sections.map((section) => (
                      <span
                        key={section}
                        className="seed-chip"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Documents */}
              <div>
                <button
                  className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide w-full"
                  style={{
                    color: 'var(--color-ink-faded)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'var(--font-sans)',
                  }}
                  onClick={() => setContextOpen(!contextOpen)}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: contextOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Context Documents
                  {selectedContextPaths.length > 0 && (
                    <span
                      className="text-xs"
                      style={{
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                      }}
                    >
                      ({selectedContextPaths.length})
                    </span>
                  )}
                </button>

                {/* Selected context chips */}
                {selectedContextPaths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedContextPaths.map((ctxPath) => {
                      const name = ctxPath.split('/').pop() || ctxPath;
                      return (
                        <span key={ctxPath} className="seed-chip">
                          {name}
                          <button onClick={() => removeContextFile(ctxPath)}>
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* File list */}
                {contextOpen && (
                  <div
                    className="mt-2 rounded-lg overflow-hidden"
                    style={{
                      border: '1px solid var(--color-border)',
                      maxHeight: '150px',
                      overflowY: 'auto',
                    }}
                  >
                    {contextFiles.length === 0 ? (
                      <div
                        className="p-3 text-xs text-center"
                        style={{ color: 'var(--color-ink-faded)' }}
                      >
                        No .md files found in this directory
                      </div>
                    ) : (
                      contextFiles.map((file) => {
                        const isSelected = selectedContextPaths.includes(file.path);
                        return (
                          <label
                            key={file.path}
                            className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer"
                            style={{
                              color: 'var(--color-ink)',
                              fontFamily: 'var(--font-sans)',
                              borderBottom: '1px solid var(--color-border)',
                              background: isSelected
                                ? 'var(--color-accent-subtle)'
                                : 'transparent',
                              transition: 'background 0.1s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background =
                                  'var(--color-paper-dark)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isSelected
                                ? 'var(--color-accent-subtle)'
                                : 'transparent';
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleContextFile(file.path)}
                              style={{ accentColor: 'var(--color-accent)' }}
                            />
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--color-ink-faded)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            {file.name}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t flex items-center justify-between"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-paper)',
                borderRadius: '0 0 12px 12px',
                flexShrink: 0,
              }}
            >
              <span
                className="text-xs"
                style={{ color: 'var(--color-ink-faded)' }}
              >
                <kbd
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{
                    background: 'var(--color-paper-dark)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  &#8984;&#8629;
                </kbd>{' '}
                to create
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 text-sm rounded-md btn-ghost"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-4 py-1.5 text-sm rounded-md font-medium transition-all disabled:opacity-40"
                  style={{
                    background: canSubmit
                      ? 'var(--color-accent)'
                      : 'var(--color-border)',
                    color: canSubmit
                      ? 'var(--color-vim-insert-fg)'
                      : 'var(--color-ink-faded)',
                  }}
                >
                  Create with Claude
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
