# Question Update Fix - Summary

## Problem
When updating questions through the author portal, questions were being removed from their products because relational fields (`productId`, `packageId`, `conceptId`, `subjectId`) were being overwritten with `null` or `undefined` values.

## Root Cause
The `updateQuestion` function in `src/lib/server-db.js` was blindly updating ALL fields passed in the `updates` object, even if they were:
1. System/relational fields that shouldn't be modified
2. `null` or `undefined` values

This meant that if the editor didn't include these fields in the update payload, they would be set to `null`, breaking the question's relationship with its product.

## Solution
Modified the `updateQuestion` function to:

### 1. **Whitelist Approach**
Only allow updates to editable content fields:
- Question content: `stem`, `choices`, `correct`
- Images: `stemImage`, `explanationCorrectImage`, `explanationWrongImage`, `summaryImage`
- Metadata: `system`, `subject`, `topic`, `difficulty`, `cognitiveLevel`
- Explanations: `explanationCorrect`, `explanationWrong`, `summary`
- Settings: `stemImageMode`, `explanationImageMode`, `references`, `tags`
- Status: `status`, `published`, `isLatest`
- Stats: `globalAttempts`, `globalCorrect`, `choiceDistribution`, etc.

### 2. **Protected Fields**
Never allow updates to:
- `id` - Primary key
- `conceptId` - Links to question concept
- `packageId` - Links to product package
- `productId` - Links to product
- `createdAt` - Creation timestamp
- `versionNumber` - Version control field

### 3. **Null/Undefined Protection**
Skip any field with `null` or `undefined` values to prevent accidentally overwriting existing data with empty values.

### 4. **Validation**
- Verify the question exists before updating
- Log warnings for ignored fields
- Return the existing question if no valid updates are provided

## Changes Made

### File: `src/lib/server-db.js`
**Function:** `updateQuestion(id, updates)`

**Before:**
```javascript
export function updateQuestion(id, updates) {
  const db = getDb();
  const fields = [];
  const params = [];
  
  Object.keys(updates).forEach(key => {
    if (key === 'id') return;
    // ... directly update all fields
  });
  
  db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  return getQuestionById(id);
}
```

**After:**
```javascript
export function updateQuestion(id, updates) {
  const db = getDb();
  
  // WHITELIST: Only editable question content fields
  const EDITABLE_FIELDS = [/* ... whitelist ... */];
  
  const fields = [];
  const params = [];
  
  // Verify question exists
  const existing = getQuestionById(id);
  if (!existing) {
    throw new Error(`Question ${id} not found`);
  }
  
  Object.keys(updates).forEach(key => {
    // Skip non-editable fields
    if (!EDITABLE_FIELDS.includes(key)) {
      console.warn(`updateQuestion: Ignoring non-editable field "${key}"`);
      return;
    }
    
    // Skip null/undefined values
    if (updates[key] === null || updates[key] === undefined) {
      console.warn(`updateQuestion: Skipping null/undefined value for "${key}"`);
      return;
    }
    
    // ... add field to update
  });
  
  // ... execute update
  return getQuestionById(id);
}
```

## Testing
Created test script: `scripts/test_update_fix.js`
- Verifies relational fields are preserved during updates
- Confirms content fields are updated as expected
- Test passed successfully ✅

## Impact
- **✅ Fixed:** Questions now maintain their product relationships after updates
- **✅ Preserved:** All existing functionality remains intact
- **✅ Protected:** System fields cannot be accidentally modified
- **✅ Safe:** Null/undefined values won't overwrite existing data
- **✅ Visible:** Updated questions remain visible in "Manage Questions" for their product

## Verification Steps
1. Edit a question in the author portal (`/author/create-question?id=...`)
2. Make changes to question content
3. Save the question
4. Navigate to "Manage Questions" for that product
5. Verify the question is still visible and associated with the correct product

## Related Files
- `src/lib/server-db.js` - Database operations (MODIFIED)
- `src/hooks/author/useQuestionEditor.js` - Question editor hook (no changes needed)
- `src/services/question.service.js` - Question service (no changes needed)
- `src/app/api/questions/route.js` - API route (no changes needed)
