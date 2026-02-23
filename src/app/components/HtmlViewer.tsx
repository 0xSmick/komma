'use client';

import React, { useEffect } from 'react';

interface HtmlViewerProps {
  htmlContent: string;
  filePath: string;
  onSelectionChange: (sel: { text: string; position: { x: number; y: number } } | null) => void;
  comments: Array<{ selectedText: string; comment: string }>;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

const BRIDGE_SCRIPT = `
<script>
document.addEventListener('mouseup', () => {
  const sel = window.getSelection();
  const text = sel?.toString().trim();
  if (text) {
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    window.parent.postMessage({
      type: 'helm-selection',
      text,
      position: { x: rect.left + rect.width / 2, y: rect.top }
    }, '*');
  } else {
    window.parent.postMessage({ type: 'helm-selection', text: '', position: null }, '*');
  }
});

window.addEventListener('message', (e) => {
  if (e.data?.type === 'helm-highlight') {
    document.querySelectorAll('mark.helm-comment-highlight').forEach(m => {
      const parent = m.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(m.textContent || ''), m);
        parent.normalize();
      }
    });
    for (const text of e.data.texts) {
      highlightText(text);
    }
  }
  if (e.data?.type === 'helm-navigate') {
    const mark = document.querySelector('mark.helm-comment-highlight[data-text="' + CSS.escape(e.data.text) + '"]');
    mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

function highlightText(text) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const idx = node.textContent.indexOf(text);
    if (idx >= 0) {
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + text.length);
      const mark = document.createElement('mark');
      mark.className = 'helm-comment-highlight';
      mark.dataset.text = text;
      mark.style.background = 'rgba(255, 200, 0, 0.3)';
      mark.style.borderBottom = '2px solid rgba(255, 200, 0, 0.6)';
      range.surroundContents(mark);
      break;
    }
  }
}
</script>`;

function buildSrcdoc(htmlContent: string, filePath: string): string {
  if (!htmlContent) return '';

  const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
  const baseTag = `<base href="file://${dirPath}/">`;

  let html = htmlContent;

  // Insert base tag after <head>
  const headMatch = html.match(/<head[^>]*>/i);
  if (headMatch) {
    const insertPos = headMatch.index! + headMatch[0].length;
    html = html.slice(0, insertPos) + baseTag + html.slice(insertPos);
  } else {
    html = baseTag + html;
  }

  // Insert bridge script before </body>
  const bodyCloseIdx = html.lastIndexOf('</body>');
  if (bodyCloseIdx >= 0) {
    html = html.slice(0, bodyCloseIdx) + BRIDGE_SCRIPT + html.slice(bodyCloseIdx);
  } else {
    html = html + BRIDGE_SCRIPT;
  }

  return html;
}

export default function HtmlViewer({
  htmlContent,
  filePath,
  onSelectionChange,
  comments,
  iframeRef,
}: HtmlViewerProps) {
  // Listen for selection messages from iframe
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type !== 'helm-selection') return;

      if (!e.data.text) {
        onSelectionChange(null);
        return;
      }

      const iframe = iframeRef.current;
      if (!iframe) return;
      const iframeRect = iframe.getBoundingClientRect();

      onSelectionChange({
        text: e.data.text,
        position: {
          x: iframeRect.left + e.data.position.x,
          y: iframeRect.top + e.data.position.y,
        },
      });
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSelectionChange, iframeRef]);

  // Send highlight data to iframe when comments change
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const texts = comments
      .map((c) => c.selectedText)
      .filter(Boolean);

    iframe.contentWindow.postMessage({ type: 'helm-highlight', texts }, '*');
  }, [comments, iframeRef]);

  const srcdoc = React.useMemo(
    () => buildSrcdoc(htmlContent, filePath),
    [htmlContent, filePath]
  );

  // Focus iframe on load and click so arrow keys work for presentation navigation
  const focusIframe = React.useCallback(() => {
    iframeRef.current?.focus();
  }, [iframeRef]);

  if (!htmlContent) {
    return null;
  }

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      srcDoc={srcdoc}
      style={{ width: '100%', height: '100%', border: 'none' }}
      onLoad={focusIframe}
      onClick={focusIframe}
      tabIndex={0}
    />
  );
}
