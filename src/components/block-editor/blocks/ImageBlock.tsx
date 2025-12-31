import { useState, useRef, ChangeEvent } from 'react';
import { ContentBlock, ImageMetadata, ImageSize, TextAlignment, BorderRadius } from '../types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Image as ImageIcon, 
  Upload, 
  Link, 
  Settings,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2
} from 'lucide-react';

interface ImageBlockProps {
  block: ContentBlock;
  isSelected: boolean;
  onUpdate: (content: string, metadata: ImageMetadata) => void;
  onDelete: () => void;
  onFocus: () => void;
}

export const ImageBlock = ({
  block,
  isSelected,
  onUpdate,
  onDelete,
  onFocus,
}: ImageBlockProps) => {
  const metadata = (block.metadata as ImageMetadata) || { src: '' };
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        onUpdate(block.content, { ...metadata, src });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlValue.trim()) {
      onUpdate(block.content, { ...metadata, src: urlValue.trim() });
      setShowUrlInput(false);
      setUrlValue('');
    }
  };

  const updateMetadata = (updates: Partial<ImageMetadata>) => {
    onUpdate(block.content, { ...metadata, ...updates });
  };

  const getSizeClass = () => {
    switch (metadata.size) {
      case 'small': return 'max-w-sm';
      case 'medium': return 'max-w-lg';
      case 'large': return 'max-w-2xl';
      case 'full': return 'max-w-full';
      default: return 'max-w-lg';
    }
  };

  const getAlignmentClass = () => {
    switch (metadata.alignment) {
      case 'center': return 'mx-auto';
      case 'right': return 'ml-auto';
      default: return '';
    }
  };

  const getBorderRadiusClass = () => {
    switch (metadata.borderRadius) {
      case 'small': return 'rounded-sm';
      case 'medium': return 'rounded-lg';
      case 'large': return 'rounded-2xl';
      case 'full': return 'rounded-full';
      default: return 'rounded-none';
    }
  };

  // No image uploaded yet
  if (!metadata.src) {
    return (
      <div 
        className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-secondary/20 hover:bg-secondary/40 transition-colors"
        onClick={onFocus}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        
        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        
        {showUrlInput ? (
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="Enter image URL..."
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit}>Add</Button>
            <Button variant="ghost" onClick={() => setShowUrlInput(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button variant="outline" onClick={() => setShowUrlInput(true)}>
              <Link className="w-4 h-4 mr-2" />
              Embed URL
            </Button>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-3">
          Drag & drop an image, or click to upload
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative group", getAlignmentClass())} onClick={onFocus}>
      {/* Image Settings Toolbar */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-lg">
          {/* Size */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Size
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-2">
              <div className="space-y-1">
                {(['small', 'medium', 'large', 'full'] as ImageSize[]).map((size) => (
                  <Button
                    key={size}
                    variant={metadata.size === size ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start capitalize"
                    onClick={() => updateMetadata({ size })}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Alignment */}
          <div className="flex gap-0.5">
            <Button
              variant={metadata.alignment === 'left' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => updateMetadata({ alignment: 'left' })}
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button
              variant={metadata.alignment === 'center' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => updateMetadata({ alignment: 'center' })}
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            <Button
              variant={metadata.alignment === 'right' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => updateMetadata({ alignment: 'right' })}
            >
              <AlignRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Border Radius */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Corners
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-2">
              <div className="space-y-1">
                {(['none', 'small', 'medium', 'large', 'full'] as BorderRadius[]).map((radius) => (
                  <Button
                    key={radius}
                    variant={metadata.borderRadius === radius ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start capitalize"
                    onClick={() => updateMetadata({ borderRadius: radius })}
                  >
                    {radius}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Alt Text</Label>
                  <Input
                    placeholder="Describe the image..."
                    value={metadata.alt || ''}
                    onChange={(e) => updateMetadata({ alt: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Caption</Label>
                  <Input
                    placeholder="Add a caption..."
                    value={metadata.caption || ''}
                    onChange={(e) => updateMetadata({ caption: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Image */}
      <div className={cn("relative", getSizeClass())}>
        <img
          src={metadata.src}
          alt={metadata.alt || 'Uploaded image'}
          className={cn(
            "w-full object-cover transition-all",
            getBorderRadiusClass(),
            isSelected && "ring-2 ring-primary ring-offset-2"
          )}
        />
        
        {/* Caption */}
        {metadata.caption && (
          <p className="text-sm text-muted-foreground text-center mt-2 italic">
            {metadata.caption}
          </p>
        )}
      </div>
    </div>
  );
};
