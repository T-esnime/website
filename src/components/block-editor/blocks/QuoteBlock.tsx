import { useRef, useEffect, useState, KeyboardEvent } from 'react';
import { ContentBlock } from '../types';
import { cn } from '@/lib/utils';
import { Quote } from 'lucide-react';

interface QuoteBlockProps {
  block: ContentBlock;
  isFocused: boolean;
  onUpdate: (content: string) => void;
  onFocus: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export const QuoteBlock = ({
  block,
  isFocused,
  onUpdate,
  onFocus,
  onKeyDown,
}: QuoteBlockProps) => {
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

  return (
    <div 
      className="relative pl-4 border-l-4 border-primary/50 bg-primary/5 rounded-r-lg py-3 pr-4"
      onClick={onFocus}
    >
      <Quote className="absolute -left-3 -top-2 w-6 h-6 text-primary/40 bg-background rounded-full p-1" />
      
      <div className="relative">
        {isEmpty && (
          <div className="absolute top-0 left-0 italic text-lg text-muted-foreground pointer-events-none select-none">
            Enter a quote...
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="outline-none italic text-lg leading-relaxed min-h-[1.5em]"
          onInput={handleInput}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
};
