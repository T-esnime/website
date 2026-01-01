import { useRef, useEffect, useState, KeyboardEvent } from 'react';
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
  const [isEmpty, setIsEmpty] = useState(!block.content);

  // Sync content on mount
  useEffect(() => {
    if (editorRef.current && block.content) {
      editorRef.current.textContent = block.content;
      setIsEmpty(false);
    }
  }, [block.id]);

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
      const content = editorRef.current.textContent || '';
      setIsEmpty(!content.trim());
      onUpdate(content);
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
    <div className="relative">
      {isEmpty && (
        <div className={cn(
          "absolute top-1 left-1 text-muted-foreground pointer-events-none select-none",
          getHeadingStyles()
        )}>
          {getPlaceholder()}
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "outline-none py-1 px-1 rounded transition-colors",
          "focus:bg-secondary/30",
          getHeadingStyles()
        )}
        onInput={handleInput}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};
