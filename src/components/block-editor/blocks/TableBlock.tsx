import { useState, useRef } from 'react';
import { ContentBlock, TableMetadata, TableCell, TextAlignment } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  Table as TableIcon,
  RowsIcon,
  Columns,
  GripVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  readOnly?: boolean;
  onUpdate: (content: string, metadata: TableMetadata) => void;
  onDelete: () => void;
  onFocus: () => void;
}

const DEFAULT_TABLE: TableMetadata = {
  rows: [
    [{ content: 'Header 1' }, { content: 'Header 2' }, { content: 'Header 3' }],
    [{ content: '' }, { content: '' }, { content: '' }],
    [{ content: '' }, { content: '' }, { content: '' }],
  ],
  hasHeader: true,
  alternatingColors: true,
  borderStyle: 'solid',
};

export const TableBlock = ({
  block,
  isSelected,
  readOnly = false,
  onUpdate,
  onDelete,
  onFocus,
}: TableBlockProps) => {
  const metadata = (block.metadata as TableMetadata) || DEFAULT_TABLE;
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateCell = (rowIndex: number, colIndex: number, updates: Partial<TableCell>) => {
    const newRows = metadata.rows.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) =>
            cIdx === colIndex ? { ...cell, ...updates } : cell
          )
        : row
    );
    onUpdate(block.content, { ...metadata, rows: newRows });
  };

  const addRow = (afterIndex?: number) => {
    const colCount = metadata.rows[0]?.length || 3;
    const newRow: TableCell[] = Array(colCount).fill(null).map(() => ({ content: '' }));
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : metadata.rows.length;
    const newRows = [
      ...metadata.rows.slice(0, insertAt),
      newRow,
      ...metadata.rows.slice(insertAt),
    ];
    onUpdate(block.content, { ...metadata, rows: newRows });
  };

  const addColumn = (afterIndex?: number) => {
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : (metadata.rows[0]?.length || 0);
    const newRows = metadata.rows.map((row, rIdx) => {
      const newCell: TableCell = { 
        content: metadata.hasHeader && rIdx === 0 ? 'Header' : '' 
      };
      return [
        ...row.slice(0, insertAt),
        newCell,
        ...row.slice(insertAt),
      ];
    });
    onUpdate(block.content, { ...metadata, rows: newRows });
  };

  const deleteRow = (rowIndex: number) => {
    if (metadata.rows.length <= 1) return;
    const newRows = metadata.rows.filter((_, idx) => idx !== rowIndex);
    onUpdate(block.content, { ...metadata, rows: newRows });
  };

  const deleteColumn = (colIndex: number) => {
    if ((metadata.rows[0]?.length || 0) <= 1) return;
    const newRows = metadata.rows.map(row => row.filter((_, idx) => idx !== colIndex));
    onUpdate(block.content, { ...metadata, rows: newRows });
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (readOnly) return;
    setSelectedCell({ row: rowIndex, col: colIndex });
    setEditingCell({ row: rowIndex, col: colIndex });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const maxRow = metadata.rows.length - 1;
    const maxCol = (metadata.rows[0]?.length || 1) - 1;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (colIndex > 0) {
            handleCellClick(rowIndex, colIndex - 1);
          } else if (rowIndex > 0) {
            handleCellClick(rowIndex - 1, maxCol);
          }
        } else {
          if (colIndex < maxCol) {
            handleCellClick(rowIndex, colIndex + 1);
          } else if (rowIndex < maxRow) {
            handleCellClick(rowIndex + 1, 0);
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (rowIndex < maxRow) {
          handleCellClick(rowIndex + 1, colIndex);
        }
        break;
      case 'ArrowUp':
        if (rowIndex > 0) {
          e.preventDefault();
          handleCellClick(rowIndex - 1, colIndex);
        }
        break;
      case 'ArrowDown':
        if (rowIndex < maxRow) {
          e.preventDefault();
          handleCellClick(rowIndex + 1, colIndex);
        }
        break;
      case 'Escape':
        setEditingCell(null);
        setSelectedCell(null);
        break;
    }
  };

  // Read-only view
  if (readOnly) {
    return (
      <div className="overflow-x-auto my-4" onClick={onFocus}>
        <table className={cn(
          "w-full border-collapse",
          metadata.borderStyle === 'solid' && "border border-border",
          metadata.borderStyle === 'dashed' && "border border-dashed border-border"
        )}>
          <tbody>
            {metadata.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  metadata.alternatingColors && rowIndex > 0 && rowIndex % 2 === 0 && "bg-muted/30"
                )}
              >
                {row.map((cell, colIndex) => {
                  const CellTag = metadata.hasHeader && rowIndex === 0 ? 'th' : 'td';
                  return (
                    <CellTag
                      key={colIndex}
                      className={cn(
                        "px-4 py-2",
                        metadata.borderStyle === 'solid' && "border border-border",
                        metadata.borderStyle === 'dashed' && "border border-dashed border-border",
                        metadata.hasHeader && rowIndex === 0 && "bg-muted font-semibold",
                        cell.alignment === 'center' && "text-center",
                        cell.alignment === 'right' && "text-right"
                      )}
                      style={{ backgroundColor: cell.backgroundColor }}
                      rowSpan={cell.rowSpan}
                      colSpan={cell.colSpan}
                    >
                      {cell.content}
                    </CellTag>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Edit mode
  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden",
        isSelected ? "border-primary" : "border-border"
      )}
      onClick={onFocus}
    >
      {/* Header */}
      <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Table</span>
          <span className="text-xs text-muted-foreground">
            {metadata.rows.length} rows × {metadata.rows[0]?.length || 0} cols
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addRow()}>
                <RowsIcon className="w-4 h-4 mr-2" />
                Add Row
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addColumn()}>
                <Columns className="w-4 h-4 mr-2" />
                Add Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {metadata.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Row handle */}
                <td className="w-8 bg-muted/50 border-r border-border">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full h-full p-1 flex items-center justify-center hover:bg-muted">
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => addRow(rowIndex)}>
                        Insert row below
                      </DropdownMenuItem>
                      {rowIndex > 0 && (
                        <DropdownMenuItem onClick={() => addRow(rowIndex - 1)}>
                          Insert row above
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteRow(rowIndex)}
                        className="text-destructive"
                        disabled={metadata.rows.length <= 1}
                      >
                        Delete row
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                
                {row.map((cell, colIndex) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  const isHeader = metadata.hasHeader && rowIndex === 0;
                  
                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        "border border-border relative min-w-[100px]",
                        isHeader && "bg-muted font-semibold",
                        metadata.alternatingColors && !isHeader && rowIndex % 2 === 0 && "bg-muted/30",
                        isSelected && "ring-2 ring-primary ring-inset"
                      )}
                      style={{ backgroundColor: cell.backgroundColor }}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <Input
                          ref={inputRef}
                          value={cell.content}
                          onChange={(e) => updateCell(rowIndex, colIndex, { content: e.target.value })}
                          onBlur={handleCellBlur}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          className="border-0 rounded-none focus-visible:ring-0 h-auto py-2"
                        />
                      ) : (
                        <div className="px-3 py-2 min-h-[40px] cursor-text">
                          {cell.content || <span className="text-muted-foreground">Empty</span>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Column headers for delete */}
        <div className="flex border-t border-border">
          <div className="w-8 bg-muted/50" />
          {metadata.rows[0]?.map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 min-w-[100px] border-r border-border last:border-r-0"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full p-1 text-xs text-muted-foreground hover:bg-muted flex items-center justify-center">
                    Col {colIndex + 1}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => addColumn(colIndex)}>
                    Insert column right
                  </DropdownMenuItem>
                  {colIndex > 0 && (
                    <DropdownMenuItem onClick={() => addColumn(colIndex - 1)}>
                      Insert column left
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteColumn(colIndex)}
                    className="text-destructive"
                    disabled={(metadata.rows[0]?.length || 0) <= 1}
                  >
                    Delete column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </div>
      
      {/* Options */}
      <div className="p-3 bg-muted/30 border-t border-border flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={metadata.hasHeader}
            onChange={(e) => onUpdate(block.content, { ...metadata, hasHeader: e.target.checked })}
            className="rounded"
          />
          Header row
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={metadata.alternatingColors}
            onChange={(e) => onUpdate(block.content, { ...metadata, alternatingColors: e.target.checked })}
            className="rounded"
          />
          Alternating colors
        </label>
      </div>
    </div>
  );
};
