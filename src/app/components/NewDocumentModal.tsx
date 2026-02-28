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
  onCreateBlank: (filePath: string) => void;
  onCancel: () => void;
}

const DEFAULT_CUSTOM_ICON = 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4';

export default function NewDocumentModal({
  show,
  currentDir,
  onSubmit,
  onCreateBlank,
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

  // Custom template state
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplDescription, setNewTplDescription] = useState('');
  const [newTplPromptPrefix, setNewTplPromptPrefix] = useState('');
  const [newTplSections, setNewTplSections] = useState('');
  const [availableMcps, setAvailableMcps] = useState<{ name: string; source?: string }[]>([]);
  const [selectedMcpRefs, setSelectedMcpRefs] = useState<string[]>([]);

  const fileNameRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const loadCustomTemplates = useCallback(async () => {
    if (!window.electronAPI?.templates) return;
    try {
      const list = await window.electronAPI.templates.listCustom();
      setCustomTemplates(list.map((t: any) => ({
        ...t,
        icon: t.icon || DEFAULT_CUSTOM_ICON,
        isCustom: true,
      })));
    } catch { setCustomTemplates([]); }
  }, []);

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
      setShowCreateForm(false);
      setNewTplName('');
      setNewTplDescription('');
      setNewTplPromptPrefix('');
      setNewTplSections('');
      setSelectedMcpRefs([]);
      loadCustomTemplates();
      // Load available MCPs for the create form
      if (window.electronAPI?.claude?.listMcps) {
        window.electronAPI.claude.listMcps()
          .then(setAvailableMcps)
          .catch(() => setAvailableMcps([]));
      }
    }
  }, [show, loadCustomTemplates]);

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

    // Inject MCP references from custom template
    if (selectedTemplate.mcpRefs && selectedTemplate.mcpRefs.length > 0) {
      const mcpLines = selectedTemplate.mcpRefs.map(ref => `@mcp:${ref}`).join('\n');
      fullPrompt += `\n\n${mcpLines}`;
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

  const handleCreateBlank = useCallback(() => {
    if (!fileName.trim()) return;
    const name = fileName.endsWith('.md') ? fileName : fileName + '.md';
    const filePath = `${currentDir}/${name}`;
    onCreateBlank(filePath);
  }, [fileName, currentDir, onCreateBlank]);

  const handleSaveCustomTemplate = useCallback(async () => {
    if (!newTplName.trim() || !window.electronAPI?.templates) return;
    const id = newTplName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const sections = newTplSections.trim()
      ? newTplSections.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const skeleton = sections.length > 0
      ? `# [Title]\n\n${sections.map(s => `## ${s}`).join('\n\n')}\n`
      : '';

    const result = await window.electronAPI.templates.saveCustom({
      id,
      name: newTplName.trim(),
      description: newTplDescription.trim() || `Custom ${newTplName.trim()} template`,
      promptPrefix: newTplPromptPrefix.trim() || `Write a ${newTplName.trim()} document.`,
      sections,
      skeleton,
      mcpRefs: selectedMcpRefs.length > 0 ? selectedMcpRefs : undefined,
    });

    if (result.success) {
      setShowCreateForm(false);
      setNewTplName('');
      setNewTplDescription('');
      setNewTplPromptPrefix('');
      setNewTplSections('');
      setSelectedMcpRefs([]);
      loadCustomTemplates();
    }
  }, [newTplName, newTplDescription, newTplPromptPrefix, newTplSections, selectedMcpRefs, loadCustomTemplates]);

  const handleDeleteCustomTemplate = useCallback(async (templateId: string) => {
    if (!window.electronAPI?.templates) return;
    await window.electronAPI.templates.deleteCustom(templateId);
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  if (!show) return null;

  const canSubmit = fileName.trim() && prompt.trim();
  const canCreateBlank = fileName.trim();

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
            if (showCreateForm) setShowCreateForm(false);
            else if (step === 2) handleBack();
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
          <div className="p-6" style={{ overflowY: 'auto', flex: 1 }}>
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

            {/* ── Custom Templates ── */}
            {customTemplates.length > 0 && (
              <>
                <div
                  className="text-xs font-medium uppercase tracking-wide mt-6 mb-3"
                  style={{ color: 'var(--color-ink-faded)', fontFamily: 'var(--font-sans)' }}
                >
                  Custom Templates
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                  }}
                >
                  {customTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="template-card"
                      style={{ position: 'relative' }}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomTemplate(t.id);
                        }}
                        className="btn-ghost"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          width: '22px',
                          height: '22px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                        title="Delete template"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-ink-faded)"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
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
                      {t.mcpRefs && t.mcpRefs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.mcpRefs.map((ref) => (
                            <span
                              key={ref}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                background: 'var(--color-accent-subtle)',
                                color: 'var(--color-accent)',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '10px',
                              }}
                            >
                              @{ref}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Create Template Button / Form ── */}
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-4 py-2.5 text-sm rounded-lg btn-ghost flex items-center justify-center gap-2"
                style={{
                  color: 'var(--color-ink-muted)',
                  fontFamily: 'var(--font-sans)',
                  border: '2px dashed var(--color-border)',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Template
              </button>
            ) : (
              <div
                className="mt-4 p-4 rounded-lg flex flex-col gap-3"
                style={{
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-paper)',
                }}
              >
                <div
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--color-ink-faded)', fontFamily: 'var(--font-sans)' }}
                >
                  New Custom Template
                </div>
                <input
                  type="text"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="Template name"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{
                    border: '2px solid var(--color-border)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  value={newTplDescription}
                  onChange={(e) => setNewTplDescription(e.target.value)}
                  placeholder="Short description"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{
                    border: '2px solid var(--color-border)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                />
                <input
                  type="text"
                  value={newTplPromptPrefix}
                  onChange={(e) => setNewTplPromptPrefix(e.target.value)}
                  placeholder="Prompt prefix (e.g. 'Write a technical spec.')"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{
                    border: '2px solid var(--color-border)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                />
                <input
                  type="text"
                  value={newTplSections}
                  onChange={(e) => setNewTplSections(e.target.value)}
                  placeholder="Sections (comma-separated, e.g. Overview, Requirements)"
                  className="w-full px-3 py-2 text-sm rounded-lg focus:outline-none"
                  style={{
                    border: '2px solid var(--color-border)',
                    fontFamily: 'var(--font-sans)',
                    color: 'var(--color-ink)',
                    background: 'var(--color-surface)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                />

                {/* MCP References */}
                {availableMcps.length > 0 && (
                  <div>
                    <label
                      className="text-xs font-medium uppercase tracking-wide mb-1.5 block"
                      style={{ color: 'var(--color-ink-faded)', fontFamily: 'var(--font-sans)' }}
                    >
                      MCP References
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableMcps.map((mcp) => {
                        const isSelected = selectedMcpRefs.includes(mcp.name);
                        return (
                          <button
                            key={mcp.name}
                            onClick={() =>
                              setSelectedMcpRefs((prev) =>
                                isSelected
                                  ? prev.filter((r) => r !== mcp.name)
                                  : [...prev, mcp.name]
                              )
                            }
                            className="text-xs px-2 py-1 rounded-md transition-all"
                            style={{
                              fontFamily: 'var(--font-sans)',
                              border: `1.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                              background: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                              color: isSelected ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                              cursor: 'pointer',
                            }}
                          >
                            @{mcp.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-1">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewTplName('');
                      setNewTplDescription('');
                      setNewTplPromptPrefix('');
                      setNewTplSections('');
                      setSelectedMcpRefs([]);
                    }}
                    className="px-3 py-1.5 text-sm rounded-md btn-ghost"
                    style={{ color: 'var(--color-ink-muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCustomTemplate}
                    disabled={!newTplName.trim()}
                    className="px-4 py-1.5 text-sm rounded-md font-medium transition-all disabled:opacity-40"
                    style={{
                      background: newTplName.trim() ? 'var(--color-accent)' : 'var(--color-border)',
                      color: newTplName.trim() ? 'var(--color-vim-insert-fg)' : 'var(--color-ink-faded)',
                    }}
                  >
                    Save Template
                  </button>
                </div>
              </div>
            )}
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

              {/* MCP refs indicator for custom templates */}
              {selectedTemplate.mcpRefs && selectedTemplate.mcpRefs.length > 0 && (
                <div>
                  <label
                    className="text-xs font-medium uppercase tracking-wide mb-2 block"
                    style={{ color: 'var(--color-ink-faded)' }}
                  >
                    Included MCP References
                  </label>
                  <div className="flex flex-wrap gap-1.5" style={{ fontFamily: 'var(--font-sans)' }}>
                    {selectedTemplate.mcpRefs.map((ref) => (
                      <span
                        key={ref}
                        className="text-xs px-2 py-1 rounded-md"
                        style={{
                          background: 'var(--color-accent-subtle)',
                          color: 'var(--color-accent)',
                          border: '1px solid var(--color-accent)',
                        }}
                      >
                        @mcp:{ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                  onClick={handleCreateBlank}
                  disabled={!canCreateBlank}
                  className="px-4 py-1.5 text-sm rounded-md font-medium transition-all disabled:opacity-40 btn-ghost"
                  style={{ color: canCreateBlank ? 'var(--color-ink-muted)' : 'var(--color-ink-faded)' }}
                >
                  Create Blank
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
