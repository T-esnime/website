import { useRef, useEffect, KeyboardEvent } from 'react';
import { ContentBlock } from '../types';
import { cn } from '@/lib/utils';

interface HeadingBlockProps {
  block: ContentBlock;
  isFocused: boolean;
  onUpdate: (content: string) => void;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export const HeadingBlock = ({
  block,
  isFocused,
  onUpdate,
  onFocus,
  onKeyDown,
}: HeadingBlockProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && editorRef.current) {
      editorRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      if (editorRef.current.childNodes.length > 0) {
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
      }
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isFocused]);

  const handleInput = () => {
    if (editorRef.current) {
      onUpdate(editorRef.current.textContent || '');
    }
  };

  const getHeadingStyles = () => {
    switch (block.type) {
      case 'heading1':
        return 'text-3xl font-bold tracking-tight';
      case 'heading2':
        return 'text-2xl font-semibold tracking-tight';
      case 'heading3':
        return 'text-xl font-semibold';
      default:
        return 'text-lg font-medium';
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1';
      case 'heading2':
        return 'Heading 2';
      case 'heading3':
        return 'Heading 3';
      default:
        return 'Heading';
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        "outline-none py-1 px-1 rounded transition-colors",
        "focus:bg-secondary/30",
        getHeadingStyles(),
        !block.content && "text-muted-foreground"
      )}
      onInput={handleInput}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      data-placeholder={getPlaceholder()}
    >
      {block.content || getPlaceholder()}
    </div>
  );
};
