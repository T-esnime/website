import { useRef, useEffect, KeyboardEvent } from 'react';
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

  return (
    <div 
      className="relative pl-4 border-l-4 border-primary/50 bg-primary/5 rounded-r-lg py-3 pr-4"
      onClick={onFocus}
    >
      <Quote className="absolute -left-3 -top-2 w-6 h-6 text-primary/40 bg-background rounded-full p-1" />
      
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "outline-none italic text-lg leading-relaxed",
          !block.content && "text-muted-foreground"
        )}
        onInput={handleInput}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      >
        {block.content || 'Enter a quote...'}
      </div>
    </div>
  );
};
