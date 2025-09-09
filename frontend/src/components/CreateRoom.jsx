import React, { useState } from 'react';
import { Tag, Lock, Users, ArrowLeft } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';

const CreateRoom = ({ onRoomCreated, onBack }) => {
  const { createRoom, joinRoom } = useRoom();
  const [formData, setFormData] = useState({
    name: '',
    tags: [],
    locked: false,
    password: ''
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Room name is required');
      }

      if (formData.locked && !formData.password.trim()) {
        throw new Error('Password is required for locked rooms');
      }

      if (formData.tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }

      // Create room on server
      const room = await createRoom({
        name: formData.name.trim(),
        tags: formData.tags,
        locked: formData.locked,
        password: formData.locked ? formData.password : undefined
      });

      // Join the created room to ensure server session and history
      const joinRes = await joinRoom(room.id, formData.locked ? formData.password : null);
      onRoomCreated(joinRes.room, joinRes.assignedName);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center text-gray-700 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rooms
        </button>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Room
        </h2>
        <p className="text-gray-700">
          Set up your own chat room and invite others to join
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Name */}
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Room Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter room name..."
            className="chatrix-input w-full"
            maxLength={50}
            required
          />
          <p className="text-gray-600 text-sm mt-1">
            {formData.name.length}/50 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-gray-900 font-medium mb-2">
            Tags (Optional)
          </label>
          
          {/* Selected Tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="chatrix-tag bg-chatrix-text text-chatrix-darker flex items-center"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-chatrix-darker hover:text-chatrix-text rounded-full p-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add Tag Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="chatrix-input flex-1"
              maxLength={20}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="chatrix-button"
              disabled={!newTag.trim() || formData.tags.length >= 10}
            >
              Add Tag
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {formData.tags.length}/10 tags • Helps others find your room
          </p>
        </div>

        {/* Lock Room */}
        <div>
          <label className="flex items-center space-x-3 text-gray-900">
            <input
              type="checkbox"
              name="locked"
              checked={formData.locked}
              onChange={handleInputChange}
              className="w-4 h-4 text-chatrix-darker bg-chatrix-darker border-chatrix-border rounded focus:ring-chatrix-text"
            />
            <div className="flex items-center text-gray-900">
              <Lock className="w-4 h-4 mr-2" />
              <span className="font-medium">Lock this room</span>
            </div>
          </label>
          <p className="text-gray-600 text-sm mt-1 ml-7">
            Require a password for others to join
          </p>
        </div>

        {/* Password Field */}
        {formData.locked && (
          <div>
            <label className="block text-gray-900 font-medium mb-2">
              Room Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter room password..."
              className="chatrix-input w-full"
              required={formData.locked}
            />
            <p className="text-gray-600 text-sm mt-1">
              Share this password with people you want to invite
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="chatrix-notification bg-blue-700 border-blue-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="chatrix-button-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="chatrix-button flex-1"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner mr-2"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Users className="w-4 h-4 mr-2" />
                Create Room
              </div>
            )}
          </button>
        </div>
      </form>

      {/* Preview */}
      {formData.name && (
        <div className="mt-8 p-4 bg-chatrix-darker border border-chatrix-border rounded-lg">
          <h3 className="text-chatrix-text font-medium mb-2">Room Preview</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-chatrix-text font-semibold">{formData.name}</span>
              <div className="flex items-center space-x-2">
                {formData.locked && <Lock className="w-4 h-4 text-chatrix-border" />}
                <Users className="w-4 h-4 text-chatrix-border" />
                <span className="text-chatrix-text text-sm">0</span>
              </div>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <span key={tag} className="chatrix-tag text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRoom;
