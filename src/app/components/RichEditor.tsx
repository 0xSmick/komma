'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useEffect, useRef, useCallback } from 'react';

interface RichEditorProps {
  content: string; // HTML content
  onChange?: (html: string) => void;
  initialBlockIndex?: number; // vim cursor position to focus on mount
  isVisible?: boolean; // whether the editor is currently shown
}

const MenuBar = ({ editor }: { editor: ReturnType<typeof useEditor> | null }) => {
  if (!editor) return null;

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px',
    borderRadius: '4px',
    transition: 'background 0.15s, color 0.15s',
    background: isActive ? 'var(--color-accent-light)' : 'transparent',
    color: isActive ? 'var(--color-accent)' : 'var(--color-ink-muted)',
  });

  const buttonClass = (_isActive: boolean) => 'p-2 rounded transition-colors';

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b rounded-t-lg" style={{ borderColor: 'var(--color-border)', background: 'var(--color-paper)' }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        style={buttonStyle(editor.isActive('bold'))}
        title="Bold (Cmd+B)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        style={buttonStyle(editor.isActive('italic'))}
        title="Italic (Cmd+I)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="4" x2="10" y2="4"/>
          <line x1="14" y1="20" x2="5" y2="20"/>
          <line x1="15" y1="4" x2="9" y2="20"/>
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        style={buttonStyle(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.1 2.5 3.3 3.1"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <path d="M17.3 13.1c.9.4 1.7 1.1 1.7 2.3 0 2.9-2.7 3.6-5.3 3.6-2.3 0-4.7-.5-6.7-1.5"/>
        </svg>
      </button>

      <div className="w-px h-6 mx-1 self-center" style={{ background: 'var(--color-border)' }} />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        style={buttonStyle(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <span className="font-bold text-sm">H1</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        style={buttonStyle(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <span className="font-bold text-sm">H2</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        style={buttonStyle(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <span className="font-bold text-sm">H3</span>
      </button>

      <div className="w-px h-6 mx-1 self-center" style={{ background: 'var(--color-border)' }} />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        style={buttonStyle(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="9" y1="6" x2="20" y2="6"/>
          <line x1="9" y1="12" x2="20" y2="12"/>
          <line x1="9" y1="18" x2="20" y2="18"/>
          <circle cx="4" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="4" cy="18" r="1.5" fill="currentColor"/>
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        style={buttonStyle(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="10" y1="6" x2="21" y2="6"/>
          <line x1="10" y1="12" x2="21" y2="12"/>
          <line x1="10" y1="18" x2="21" y2="18"/>
          <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
          <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
          <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
        </svg>
      </button>

      <div className="w-px h-6 mx-1 self-center" style={{ background: 'var(--color-border)' }} />

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive('blockquote'))}
        style={buttonStyle(editor.isActive('blockquote'))}
        title="Quote"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"/>
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={buttonClass(editor.isActive('codeBlock'))}
        style={buttonStyle(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      </button>

      <div className="w-px h-6 mx-1 self-center" style={{ background: 'var(--color-border)' }} />

      <button
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-2 rounded transition-colors"
        style={{ color: 'var(--color-ink-muted)' }}
        title="Horizontal Rule"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
        </svg>
      </button>

      <div className="w-px h-6 mx-1 self-center" style={{ background: 'var(--color-border)' }} />

      {/* Table controls */}
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="p-2 rounded transition-colors"
        style={{ color: 'var(--color-ink-muted)' }}
        title="Insert Table"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="3" x2="9" y2="21"/>
          <line x1="15" y1="3" x2="15" y2="21"/>
        </svg>
      </button>

      {editor.can().addColumnAfter() && (
        <>
          <button
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--color-ink-muted)' }}
            title="Add Column"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="10" height="18" rx="1"/>
              <line x1="17" y1="12" x2="21" y2="12"/>
              <line x1="19" y1="10" x2="19" y2="14"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--color-ink-muted)' }}
            title="Delete Column"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="10" height="18" rx="1"/>
              <line x1="17" y1="12" x2="21" y2="12"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--color-ink-muted)' }}
            title="Add Row"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="10" rx="1"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
              <line x1="10" y1="19" x2="14" y2="19"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--color-ink-muted)' }}
            title="Delete Row"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="10" rx="1"/>
              <line x1="10" y1="19" x2="14" y2="19"/>
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--color-danger)' }}
            title="Delete Table"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
          </button>
        </>
      )}

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-2 rounded transition-colors disabled:opacity-30 ml-auto"
        style={{ color: 'var(--color-ink-muted)' }}
        title="Undo (Cmd+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-2 rounded transition-colors disabled:opacity-30"
        style={{ color: 'var(--color-ink-muted)' }}
        title="Redo (Cmd+Shift+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 7v6h-6"/>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
        </svg>
      </button>
    </div>
  );
};

export default function RichEditor({ content, onChange, initialBlockIndex, isVisible }: RichEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debouncedOnChange = useCallback((html: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChangeRef.current?.(html);
    }, 300);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      debouncedOnChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-editorial max-w-none p-6 min-h-[calc(100vh-14rem)] focus:outline-none',
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Position cursor at the initial block every time editor becomes visible
  const wasVisible = useRef(false);
  useEffect(() => {
    if (!isVisible) {
      wasVisible.current = false;
      return;
    }
    if (wasVisible.current) return;
    wasVisible.current = true;

    if (!editor || initialBlockIndex == null || initialBlockIndex < 0) return;

    // Wait for DOM to settle after display change
    requestAnimationFrame(() => {
      const proseMirror = editorContainerRef.current?.querySelector('.ProseMirror');
      if (!proseMirror) {
        editor.commands.focus('start');
        return;
      }

      const blocks = Array.from(proseMirror.querySelectorAll(
        ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, ' +
        ':scope > p, :scope > ul > li, :scope > ol > li, :scope > blockquote, :scope > pre, ' +
        ':scope > table, :scope > hr, :scope > div:not(.ProseMirror-gapcursor)'
      ));

      const targetBlock = blocks[initialBlockIndex] as HTMLElement | undefined;
      if (targetBlock) {
        try {
          const pos = editor.view.posAtDOM(targetBlock, 0);
          editor.chain().focus().setTextSelection(pos).run();
          targetBlock.scrollIntoView({ block: 'center' });
        } catch {
          editor.commands.focus('start');
        }
      } else {
        editor.commands.focus('start');
      }
    });
  }, [editor, initialBlockIndex, isVisible]);

  return (
    <div ref={editorContainerRef}>
      <div
        className="rounded-xl"
        style={{ border: '1px solid var(--color-border)' }}
      >
        {/* Sticky toolbar */}
        <div className="sticky top-0 z-10 rounded-t-xl" style={{ background: 'var(--color-surface)' }}>
          <MenuBar editor={editor} />
        </div>

        {/* Editor content */}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
