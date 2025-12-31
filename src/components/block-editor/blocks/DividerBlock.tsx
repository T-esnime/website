import { ContentBlock } from '../types';
import { cn } from '@/lib/utils';

interface DividerBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  onFocus: () => void;
}

export const DividerBlock = ({
  block,
  isSelected,
  onFocus,
}: DividerBlockProps) => {
  return (
    <div 
      className={cn(
        "py-4 cursor-pointer group",
        isSelected && "bg-secondary/30 rounded-lg"
      )}
      onClick={onFocus}
    >
      <hr className={cn(
        "border-t-2 border-border transition-colors",
        "group-hover:border-muted-foreground"
      )} />
    </div>
  );
};
