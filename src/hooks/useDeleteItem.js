import { useState, useCallback } from 'react';
import { handleDeleteItem, handleBulkDelete, removeItemsFromArray } from '@/utils/deleteUtils';

/**
 * React hook for handling delete operations with loading states
 * @param {string} type - The type of item ('product', 'question', 'user')
 * @param {Function} setItems - Function to update the items array in state
 * @param {Function} setSelectedIds - Function to update selected IDs (optional)
 * @returns {Object} - Delete handlers and loading state
 */
export function useDeleteItem(type, setItems, setSelectedIds) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = useCallback(async (id, options = {}) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const success = await handleDeleteItem(type, id, {
        ...options,
        onSuccess: (deletedId) => {
          // Update UI state
          setItems(prev => removeItemsFromArray(prev, deletedId));
          
          // Clear selection if needed
          if (setSelectedIds) {
            setSelectedIds(prev => {
              const next = new Set(prev);
              next.delete(deletedId);
              return next;
            });
          }
          
          // Call custom success callback
          if (options.onSuccess) {
            options.onSuccess(deletedId);
          }
        },
        onError: (err) => {
          setError(err.message);
          if (options.onError) {
            options.onError(err);
          }
        }
      });
      
      return success;
    } finally {
      setIsDeleting(false);
    }
  }, [type, setItems, setSelectedIds]);

  const handleBulkDelete = useCallback(async (ids, options = {}) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      const result = await handleBulkDelete(type, ids, {
        ...options,
        onSuccess: ({ success, failed }) => {
          // Update UI state
          if (success > 0) {
            setItems(prev => removeItemsFromArray(prev, ids));
            
            // Clear selections
            if (setSelectedIds) {
              setSelectedIds(new Set());
            }
          }
          
          // Call custom success callback
          if (options.onSuccess) {
            options.onSuccess({ success, failed });
          }
        },
        onError: (err) => {
          setError(err.message);
          if (options.onError) {
            options.onError(err);
          }
        }
      });
      
      return result;
    } finally {
      setIsDeleting(false);
    }
  }, [type, setItems, setSelectedIds]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    handleDelete,
    handleBulkDelete,
    isDeleting,
    error,
    clearError
  };
}

/**
 * Simplified hook for single delete operations
 * @param {string} type - The type of item ('product', 'question', 'user')
 * @param {Function} setItems - Function to update the items array in state
 * @returns {Object} - Delete handler and loading state
 */
export function useSimpleDelete(type, setItems) {
  const { handleDelete, isDeleting, error, clearError } = useDeleteItem(type, setItems);
  
  return {
    deleteItem: handleDelete,
    isDeleting,
    error,
    clearError
  };
}
