import { BlockType, BLOCK_TYPE_INFO } from './types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown,
  Type,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';

interface BlockMenuProps {
  blockType: BlockType;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConvertTo: (type: BlockType) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const CONVERTIBLE_TYPES: BlockType[] = ['text', 'heading1', 'heading2', 'heading3', 'quote'];

export const BlockMenu = ({
  blockType,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onConvertTo,
  canMoveUp,
  canMoveDown,
}: BlockMenuProps) => {
  const canConvert = CONVERTIBLE_TYPES.includes(blockType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onMoveUp} disabled={!canMoveUp}>
          <ArrowUp className="w-4 h-4 mr-2" />
          Move Up
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onMoveDown} disabled={!canMoveDown}>
          <ArrowDown className="w-4 h-4 mr-2" />
          Move Down
        </DropdownMenuItem>

        {canConvert && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Convert to
            </div>
            {CONVERTIBLE_TYPES.filter(t => t !== blockType).map((type) => (
              <DropdownMenuItem 
                key={type} 
                onClick={() => onConvertTo(type)}
                className="pl-4"
              >
                {type === 'text' && <Type className="w-4 h-4 mr-2" />}
                {type === 'heading1' && <Heading1 className="w-4 h-4 mr-2" />}
                {type === 'heading2' && <Heading2 className="w-4 h-4 mr-2" />}
                {type === 'heading3' && <Heading3 className="w-4 h-4 mr-2" />}
                {type === 'quote' && <span className="w-4 h-4 mr-2 text-center">"</span>}
                {BLOCK_TYPE_INFO[type].label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
