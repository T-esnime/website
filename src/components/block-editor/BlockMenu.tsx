import { BlockType, BLOCK_TYPE_INFO } from './types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  Heading3,
  Image,
  Code,
  Quote,
  Minus,
  Video,
  HelpCircle,
  Table,
  Plus,
} from 'lucide-react';

interface BlockMenuProps {
  blockType: BlockType;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConvertTo: (type: BlockType) => void;
  onAddBlockAfter: (type: BlockType) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const ALL_BLOCK_TYPES: BlockType[] = [
  'text', 'heading1', 'heading2', 'heading3', 
  'image', 'code', 'quote', 'divider', 'video', 'quiz', 'table'
];

const CONVERTIBLE_TYPES: BlockType[] = ['text', 'heading1', 'heading2', 'heading3', 'quote'];

const getBlockIcon = (type: BlockType) => {
  switch (type) {
    case 'text': return <Type className="w-4 h-4 mr-2" />;
    case 'heading1': return <Heading1 className="w-4 h-4 mr-2" />;
    case 'heading2': return <Heading2 className="w-4 h-4 mr-2" />;
    case 'heading3': return <Heading3 className="w-4 h-4 mr-2" />;
    case 'image': return <Image className="w-4 h-4 mr-2" />;
    case 'code': return <Code className="w-4 h-4 mr-2" />;
    case 'quote': return <Quote className="w-4 h-4 mr-2" />;
    case 'divider': return <Minus className="w-4 h-4 mr-2" />;
    case 'video': return <Video className="w-4 h-4 mr-2" />;
    case 'quiz': return <HelpCircle className="w-4 h-4 mr-2" />;
    case 'table': return <Table className="w-4 h-4 mr-2" />;
    default: return <Type className="w-4 h-4 mr-2" />;
  }
};

export const BlockMenu = ({
  blockType,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onConvertTo,
  onAddBlockAfter,
  canMoveUp,
  canMoveDown,
}: BlockMenuProps) => {
  const canConvert = CONVERTIBLE_TYPES.includes(blockType);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-popover">
        {/* Add Block Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Plus className="w-4 h-4 mr-2" />
            Add block
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48 bg-popover">
            {ALL_BLOCK_TYPES.map((type) => (
              <DropdownMenuItem 
                key={type} 
                onClick={() => onAddBlockAfter(type)}
              >
                {getBlockIcon(type)}
                {BLOCK_TYPE_INFO[type].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Convert to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 bg-popover">
                {CONVERTIBLE_TYPES.filter(t => t !== blockType).map((type) => (
                  <DropdownMenuItem 
                    key={type} 
                    onClick={() => onConvertTo(type)}
                  >
                    {getBlockIcon(type)}
                    {BLOCK_TYPE_INFO[type].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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