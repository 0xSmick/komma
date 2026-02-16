'use client';

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';

interface TocHeading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsTabProps {
  markdown: string;
  articleRef: RefObject<HTMLElement | null>;
  isEditMode: boolean;
  editorRef: RefObject<any>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].replace(/\*\*|__|\*|_|`|~~/g, '').trim(),
      id: slugify(match[2]),
    });
  }
  return headings;
}

export default function TableOfContentsTab({
  markdown,
  articleRef,
  isEditMode,
  editorRef,
}: TableOfContentsTabProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headings = extractHeadings(markdown);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const container = isEditMode
      ? document.querySelector('.ProseMirror')
      : articleRef.current;
    if (!container) return;

    const headingEls = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headingEls.length === 0) return;

    // Find the scroll parent
    const scrollParent = container.closest('main') || container.parentElement;
    if (!scrollParent) return;

    // Use scroll event for more reliable tracking
    const handleScroll = () => {
      const scrollTop = scrollParent.scrollTop;
      let current: string | null = null;

      headingEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Get offset relative to scroll parent
        const top = htmlEl.offsetTop - scrollParent.getBoundingClientRect().top - 100;
        if (scrollParent.scrollTop + 100 >= htmlEl.offsetTop - scrollParent.offsetTop) {
          current = slugify(htmlEl.textContent || '');
        }
      });

      setActiveId(current);
    };

    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      scrollParent.removeEventListener('scroll', handleScroll);
    };
  }, [markdown, isEditMode, articleRef]);

  const handleClick = useCallback(
    (heading: TocHeading) => {
      const container = isEditMode
        ? document.querySelector('.ProseMirror')
        : articleRef.current;
      if (!container) return;

      const headingEls = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const el of headingEls) {
        const text = (el.textContent || '').trim();
        if (slugify(text) === heading.id) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveId(heading.id);
          break;
        }
      }
    },
    [isEditMode, articleRef]
  );

  if (headings.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-12"
        style={{ color: 'var(--color-ink-faded)' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="15" y2="12" />
          <line x1="3" y1="18" x2="18" y2="18" />
        </svg>
        <span className="text-sm">No headings found</span>
        <span className="text-xs" style={{ color: 'var(--color-ink-faded)', opacity: 0.7 }}>
          Add # headings to your markdown
        </span>
      </div>
    );
  }

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <nav className="toc-nav">
      <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--color-ink-faded)', fontFamily: 'var(--font-sans)' }}>
        On this page
      </div>
      <ul className="space-y-0.5">
        {headings.map((heading, i) => {
          const depth = heading.level - minLevel;
          const isActive = activeId === heading.id;

          return (
            <li key={`${heading.id}-${i}`}>
              <button
                onClick={() => handleClick(heading)}
                className={`toc-item ${isActive ? 'toc-active' : ''} ${
                  heading.level === 1
                    ? 'toc-level-1'
                    : heading.level === 2
                    ? 'toc-level-2'
                    : 'toc-level-3'
                }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                title={heading.text}
              >
                <span className="toc-item-text">{heading.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
