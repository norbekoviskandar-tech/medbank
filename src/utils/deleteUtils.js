import { deleteProduct } from "@/services/product.service";
import { deleteQuestion } from "@/services/question.service";
import { deleteUser } from "@/services/user.service";

/**
 * Unified delete handler for products, questions, and users
 * @param {string} type - The type of item to delete ('product', 'question', 'user')
 * @param {string} id - The ID of the item to delete
 * @param {Object} options - Additional options
 * @param {Function} options.onSuccess - Callback after successful deletion
 * @param {Function} options.onError - Callback on error
 * @param {string} options.confirmMessage - Custom confirmation message
 * @param {boolean} options.showConfirmation - Whether to show confirmation dialog (default: true)
 * @returns {Promise<boolean>} - Returns true if deleted successfully
 */
export async function handleDeleteItem(type, id, options = {}) {
  const {
    onSuccess,
    onError,
    confirmMessage,
    showConfirmation = true,
    successMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
  } = options;

  // Show confirmation dialog if required
  if (showConfirmation) {
    const message = confirmMessage || getDefaultConfirmMessage(type);
    if (!confirm(message)) {
      return false;
    }
  }

  try {
    // Call the appropriate delete service
    let result;
    switch (type) {
      case 'product':
        result = await deleteProduct(id);
        break;
      case 'question':
        result = await deleteQuestion(id);
        break;
      case 'user':
        result = await deleteUser(id);
        break;
      default:
        throw new Error(`Unknown delete type: ${type}`);
    }

    // Show success message
    if (successMessage) {
      alert(successMessage);
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(id, type);
    }

    return true;
  } catch (error) {
    console.error(`Failed to delete ${type}:`, error);
    
    // Show error message
    const errorMessage = error.message || `Failed to delete ${type}`;
    alert(errorMessage);
    
    // Call error callback
    if (onError) {
      onError(error, type);
    }
    
    return false;
  }
}

/**
 * Bulk delete handler for multiple items
 * @param {string} type - The type of items to delete
 * @param {Array<string>} ids - Array of IDs to delete
 * @param {Object} options - Additional options
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function handleBulkDelete(type, ids, options = {}) {
  const {
    onSuccess,
    onError,
    confirmMessage,
    showConfirmation = true,
    successMessage = `Deleted ${ids.length} ${type}(s) successfully`
  } = options;

  if (!ids.length) {
    alert(`No ${type}s selected for deletion`);
    return { success: 0, failed: 0 };
  }

  // Show confirmation dialog if required
  if (showConfirmation) {
    const message = confirmMessage || `Permanently delete ${ids.length} selected ${type}(s)? This cannot be undone.`;
    if (!confirm(message)) {
      return { success: 0, failed: 0 };
    }
  }

  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  try {
    // Delete items one by one to handle individual failures
    for (const id of ids) {
      try {
        await handleDeleteItem(type, id, { 
          showConfirmation: false, 
          successMessage: null 
        });
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`${type} ${id}: ${error.message}`);
      }
    }

    // Show final result message
    if (successCount > 0 && failedCount === 0) {
      if (successMessage) alert(successMessage);
    } else if (failedCount > 0) {
      const message = `Delete operation completed.\nSuccess: ${successCount}\nFailed: ${failedCount}\n\nErrors:\n${errors.join('\n')}`;
      alert(message);
    }

    // Call success callback
    if (onSuccess) {
      onSuccess({ success: successCount, failed: failedCount, ids });
    }

    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error(`Bulk delete failed for ${type}s:`, error);
    
    if (onError) {
      onError(error, type);
    }
    
    return { success: successCount, failed: failedCount + 1 };
  }
}

/**
 * Update UI state after deletion
 * @param {Array} items - Current items array
 * @param {string|Array} deletedIds - ID(s) of deleted items
 * @returns {Array} - Updated items array
 */
export function removeItemsFromArray(items, deletedIds) {
  const idsToDelete = Array.isArray(deletedIds) ? deletedIds : [deletedIds];
  return items.filter(item => !idsToDelete.includes(item.id));
}

/**
 * Get default confirmation message for item type
 * @param {string} type - Item type
 * @returns {string} - Default confirmation message
 */
function getDefaultConfirmMessage(type) {
  switch (type) {
    case 'product':
      return "Are you sure you want to PERMANENTLY delete this product? This action cannot be undone and will remove the record from the database completely.";
    case 'question':
      return "Delete this question permanently? This cannot be undone.";
    case 'user':
      return "Are you sure you want to PERMANENTLY delete this user account? This will PURGE ALL DATA (tests, stats, progress) and remove the record completely. This cannot be undone.";
    default:
      return `Are you sure you want to delete this ${type}?`;
  }
}
