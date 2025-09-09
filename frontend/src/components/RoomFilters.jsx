import React, { useState, useEffect } from 'react';
import { Tag, X } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';

const RoomFilters = ({ selectedTags, onTagsChange }) => {
  const { tags } = useRoom();
  const [newTag, setNewTag] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !selectedTags.includes(newTag.trim().toLowerCase())) {
      onTagsChange([...selectedTags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  const displayTags = showAllTags ? tags : tags.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-chatrix-text text-sm font-medium">Filtered by:</span>
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="chatrix-tag bg-chatrix-text text-chatrix-darker-red flex items-center"
            >
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:bg-chatrix-darker-red hover:text-chatrix-text rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAllTags}
            className="text-chatrix-text text-sm underline hover:no-underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Available Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-chatrix-text font-medium">Filter by tags:</h4>
          {tags.length > 10 && (
            <button
              onClick={() => setShowAllTags(!showAllTags)}
              className="text-chatrix-text text-sm underline hover:no-underline"
            >
              {showAllTags ? 'Show less' : `Show all (${tags.length})`}
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`chatrix-tag transition-all duration-200 ${
                selectedTags.includes(tag)
                  ? 'bg-chatrix-text text-chatrix-darker-red'
                  : 'hover:bg-chatrix-light-red'
              }`}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Tag */}
      <form onSubmit={handleAddTag} className="flex gap-2">
        <input
          type="text"
          placeholder="Add custom tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          className="chatrix-input flex-1"
        />
        <button
          type="submit"
          className="chatrix-button"
          disabled={!newTag.trim()}
        >
          Add
        </button>
      </form>
    </div>
  );
};

export default RoomFilters;
