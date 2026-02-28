'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { templates } from '../templates';

interface QuickCaptureModalProps {
  show: boolean;
  vaultRoot: string | null;
  onSubmit: (filePath: string, prompt: string) => void;
  onCancel: () => void;
}

export default function QuickCaptureModal({
  show,
  vaultRoot,
  onSubmit,
  onCancel,
}: QuickCaptureModalProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (show) {
      setDescription('');
      setIsSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [show]);

  const handleSubmit = useCallback(async () => {
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const api = window.electronAPI;
    let templateId = 'blank';
    let folder = '';

    if (api?.quickCapture) {
      const result = await api.quickCapture.inferTemplate(description);
      templateId = result.templateId;
      folder = result.folder;
    }

    const template = templates.find(t => t.id === templateId) || templates.find(t => t.id === 'blank')!;

    // Generate filename from description
    const words = description.trim().split(/\s+/).slice(0, 5);
    const slug = words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const fileName = `${template.id === 'blank' ? '' : template.id + '-'}${slug}.md`;

    // Determine directory
    const baseDir = vaultRoot || '';
    const dir = folder && baseDir ? `${baseDir}/${folder}` : baseDir;
    const filePath = dir ? `${dir}/${fileName}` : fileName;

    // Build prompt
    let fullPrompt = '';
    if (template.id === 'blank') {
      fullPrompt = `${template.promptPrefix}\n\nDescription: ${description}`;
    } else {
      fullPrompt = `${template.promptPrefix}\n\nStructure the document with these sections:\n${template.skeleton}\nDescription: ${description}`;
    }

    onSubmit(filePath, fullPrompt);
    setIsSubmitting(false);
  }, [description, isSubmitting, vaultRoot, onSubmit]);

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-backdrop"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="fixed z-50 animate-fade-in"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(520px, 90vw)',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
              <polyline points="13 2 13 9 20 9" />
            </svg>
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
            >
              Quick Capture
            </span>
          </div>
          <button
            onClick={onCancel}
            className="w-7 h-7 rounded-md flex items-center justify-center btn-ghost"
          >
            <svg
              width="16"
              height="16"
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

        {/* Body */}
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you want to create... (e.g. PRD for user authentication, meeting notes from product sync)"
            className="w-full p-3 text-sm rounded-lg transition-all resize-none focus:outline-none"
            style={{
              border: '2px solid var(--color-border)',
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-ink)',
              lineHeight: 1.6,
              minHeight: '100px',
              background: 'var(--color-surface)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-light)';
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
                onCancel();
              }
            }}
          />
          <p
            className="text-xs mt-2"
            style={{ color: 'var(--color-ink-faded)', fontFamily: 'var(--font-sans)' }}
          >
            Template and location are auto-detected from your description.
          </p>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-paper)',
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
              onClick={onCancel}
              className="px-3 py-1.5 text-sm rounded-md btn-ghost"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
              className="px-4 py-1.5 text-sm rounded-md font-medium transition-all disabled:opacity-40"
              style={{
                background: description.trim()
                  ? 'var(--color-accent)'
                  : 'var(--color-border)',
                color: description.trim()
                  ? 'var(--color-vim-insert-fg)'
                  : 'var(--color-ink-faded)',
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
