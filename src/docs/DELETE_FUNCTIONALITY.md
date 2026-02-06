# Delete Functionality Documentation

## Overview

This document explains the comprehensive delete functionality implemented for products, questions, and users in the MedBank application. The system provides unified delete handlers with proper API integration, UI state management, and error handling.

## Architecture

### Core Components

1. **`/src/utils/deleteUtils.js`** - Core utility functions for delete operations
2. **`/src/hooks/useDeleteItem.js`** - React hook for managing delete state
3. **Updated Components** - Products, Questions, and Users management pages

### Features

- ✅ Unified delete API for all item types
- ✅ Confirmation dialogs with customizable messages
- ✅ Automatic UI state updates after successful deletion
- ✅ Bulk delete operations with progress tracking
- ✅ Error handling with user-friendly messages
- ✅ Loading states during delete operations
- ✅ Selection management (clear selections after deletion)
- ✅ TypeScript-friendly with proper error types

## Usage

### 1. Basic Delete Operation

```javascript
import { handleDeleteItem } from '@/utils/deleteUtils';

// Delete a single item
const success = await handleDeleteItem('product', productId, {
  onSuccess: (id) => {
    console.log(`Product ${id} deleted successfully`);
    // UI is automatically updated
  },
  onError: (error) => {
    console.error('Delete failed:', error);
  }
});
```

### 2. Using the React Hook (Recommended)

```javascript
import { useDeleteItem } from '@/hooks/useDeleteItem';

function MyComponent() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const { handleDelete, handleBulkDelete, isDeleting, error } = useDeleteItem(
    'product',
    setItems,
    setSelectedIds
  );

  // Single delete
  const deleteItem = async (id) => {
    await handleDelete(id, {
      onSuccess: () => {
        // Additional custom logic
        console.log('Item deleted');
      }
    });
  };

  // Bulk delete
  const deleteSelected = async () => {
    const ids = Array.from(selectedIds);
    await handleBulkDelete(ids);
  };
}
```

### 3. Bulk Delete Operations

```javascript
import { handleBulkDelete } from '@/utils/deleteUtils';

const result = await handleBulkDelete('question', questionIds, {
  confirmMessage: `Delete ${questionIds.length} questions?`,
  onSuccess: ({ success, failed }) => {
    console.log(`Successfully deleted: ${success}`);
    console.log(`Failed to delete: ${failed}`);
  }
});
```

## API Endpoints

The delete utility automatically calls the appropriate API endpoints:

- **Products**: `DELETE /api/products/:id`
- **Questions**: `DELETE /api/questions/:id`
- **Users**: `DELETE /api/users/:id`

## UI State Management

### Automatic Updates

The delete utilities automatically handle:

1. **Removing items from arrays** - Uses `removeItemsFromArray()` helper
2. **Clearing selections** - Removes deleted items from `selectedIds`
3. **Loading states** - Shows loading indicators during operations
4. **Error states** - Displays error messages when operations fail

### Manual State Updates

If you need custom state management:

```javascript
const { handleDelete } = useDeleteItem('product', setItems);

await handleDelete(id, {
  onSuccess: (deletedId) => {
    // Custom logic beyond automatic updates
    if (editingId === deletedId) {
      setEditingId(null);
    }
  }
});
```

## Error Handling

### Built-in Error Messages

The system provides default error messages for each item type:

- Products: "Failed to delete product"
- Questions: "Failed to delete question"
- Users: "Failed to delete user"

### Custom Error Handling

```javascript
await handleDeleteItem('product', id, {
  onError: (error) => {
    // Custom error handling
    showNotification(error.message, 'error');
    logErrorToService(error);
  }
});
```

## Confirmation Messages

### Default Messages

Each item type has appropriate default confirmation messages:

- **Products**: Warns about active subscriptions
- **Questions**: Permanent deletion warning
- **Users**: Critical data purge warning

### Custom Messages

```javascript
await handleDeleteItem('user', userId, {
  confirmMessage: "Are you sure you want to delete this user? This cannot be undone."
});
```

## Bulk Operations

### Progress Tracking

Bulk delete operations provide detailed feedback:

```javascript
const result = await handleBulkDelete('question', ids);
// result = { success: 5, failed: 1 }
```

### Error Accumulation

Failed bulk operations collect all errors:

```
Delete operation completed.
Success: 8
Failed: 2

Errors:
question 123: Network error
question 456: Permission denied
```

## Implementation Examples

### Products Page

```javascript
// In manage-products/page.jsx
const { handleDelete: deleteProduct } = useDeleteItem(
  'product', 
  setProducts, 
  setSelectedIds
);

const handleDelete = async (id) => {
  await deleteProduct(id, {
    onSuccess: () => {
      // Clear editing state if needed
      if (editingId === id) {
        setEditingId(null);
        setShowCreateForm(false);
      }
    }
  });
};
```

### Questions Page

```javascript
// In manage-questions/page.jsx
const { 
  handleDelete: deleteQuestion, 
  handleBulkDelete: bulkDeleteQuestions 
} = useDeleteItem('question', setQuestions, setSelectedIds);

// Single delete
const handleDelete = async (id) => {
  await deleteQuestion(id);
};

// Bulk delete
const bulkDelete = async () => {
  const ids = Array.from(selectedIds);
  await bulkDeleteQuestions(ids);
};
```

### Users Page

```javascript
// In users/page.jsx
const { handleBulkDelete: bulkDeleteUsers } = useDeleteItem(
  'user',
  setUsers,
  setSelectedIds
);

const handleBulkDelete = async () => {
  const ids = Array.from(selectedIds);
  await bulkDeleteUsers(ids, {
    confirmMessage: `CRITICAL: Delete ${ids.length} accounts?`,
    successMessage: `Purge Complete: ${ids.length} identities erased.`
  });
};
```

## Best Practices

1. **Use the React Hook** - Provides automatic state management
2. **Handle Loading States** - Show loading indicators during operations
3. **Clear Selections** - Automatically handled by the hook
4. **Custom Confirmations** - Use context-appropriate messages
5. **Error Boundaries** - Wrap delete operations in try-catch when needed
6. **Permission Checks** - Ensure users have delete permissions

## Migration Guide

### From Old Implementation

```javascript
// OLD
const handleDelete = async (id) => {
  if (!confirm("Delete this item?")) return;
  try {
    await deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  } catch (err) {
    alert("Failed to delete");
  }
};

// NEW
const { handleDelete } = useDeleteItem('product', setProducts, setSelectedIds);
const handleDelete = async (id) => {
  await handleDelete(id);
};
```

## Testing

### Test Files

- `/src/utils/deleteUtils.test.js` - Example usage and test cases

### Manual Testing Checklist

- [ ] Single item deletion works
- [ ] Confirmation dialogs appear
- [ ] Items are removed from UI after deletion
- [ ] Selections are cleared after deletion
- [ ] Bulk delete operations work
- [ ] Error messages display correctly
- [ ] Loading states show during operations
- [ ] Network errors are handled gracefully

## Future Enhancements

1. **Undo Functionality** - Add temporary restore capability
2. **Soft Delete** - Implement trash/recycle bin
3. **Audit Logging** - Track all delete operations
4. **Batch Progress** - Show progress for large bulk operations
5. **Permission Integration** - Role-based delete permissions
