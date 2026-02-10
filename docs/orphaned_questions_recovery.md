# Orphaned Questions - Status and Recovery

## Current Status

✅ **Good News:** After checking your database, **0 orphaned questions** were found.

All questions are currently properly linked to their products. This means either:
1. The bug hadn't affected any questions yet, or
2. Questions were created with proper product associations and haven't been edited yet

## What Happened to Lost Questions?

### The Bug's Impact
Before the fix, when a question was edited through the author portal, the `updateQuestion` function would:
1. Accept an update payload from the editor
2. Update ALL fields in the payload, including relational fields
3. If `productId` or `packageId` were not in the payload (or were `null`/`undefined`), they would be overwritten with `NULL`
4. The question would become "orphaned" - no longer associated with any product

### Data State of Orphaned Questions
Questions that lost their product association would:
- ❌ Not appear in the "Manage Questions" page for any specific product
- ❌ Not be available for student tests for that product
- ✅ Still exist in the database with all their content intact
- ✅ Still have their `conceptId` which links to the `question_concepts` table

### Good News
The questions themselves were **NOT deleted** - only the link to their product was broken. All question content (stem, choices, explanations, images, etc.) remained intact in the database.

## Recovery Methods

I've created two recovery tools for you:

### 1. Find Orphaned Questions
**Script:** `scripts/find_orphaned_questions.js`

Searches for questions with NULL `productId` and `packageId`:
```bash
node scripts/find_orphaned_questions.js
```

This will show:
- How many orphaned questions exist
- Details about each orphaned question
- Which ones can be automatically recovered

### 2. Recover Orphaned Questions
**Script:** `scripts/recover_orphaned_questions.js`

Attempts to restore orphaned questions to their products:
```bash
node scripts/recover_orphaned_questions.js
```

Recovery strategies:
1. **Via ConceptId** (Most reliable) - Uses the `conceptId` to find the original product from the `question_concepts` table
2. **Via Default Product** (Fallback) - Assigns to an active product if conceptId method fails

## Prevention

The fix I implemented ensures this won't happen again by:

1. **Whitelist Approach** - Only editable content fields can be updated
2. **Protected Fields** - Relational fields (`productId`, `packageId`, `conceptId`) can never be overwritten
3. **Null Protection** - `null` or `undefined` values are skipped during updates

## What You Should Do

### Immediate Action
✅ **Already Done:** The fix is in place, no orphaned questions found

### Regular Monitoring
Run the check script periodically to ensure no questions become orphaned:
```bash
node scripts/find_orphaned_questions.js
```

### If Orphaned Questions Are Found
1. Run the recovery script:
   ```bash
   node scripts/recover_orphaned_questions.js
   ```
2. Verify recovered questions appear in "Manage Questions"
3. For questions that can't be auto-recovered, manually reassign them:
   - Note the question ID from the report
   - Find the question in the database
   - Update its `productId` and `packageId` manually

## Database Queries for Manual Recovery

If you need to manually check or recover questions:

### Find Orphaned Questions
```sql
SELECT id, stem, system, subject, conceptId 
FROM questions 
WHERE (packageId IS NULL OR packageId = '') 
  AND (productId IS NULL OR productId = '');
```

### Manually Restore a Question
```sql
-- Replace YOUR_QUESTION_ID and YOUR_PRODUCT_ID
UPDATE questions 
SET packageId = YOUR_PRODUCT_ID, productId = YOUR_PRODUCT_ID
WHERE id = 'YOUR_QUESTION_ID';
```

### Find Product by Name
```sql
SELECT id, name FROM products WHERE isActive = 1 AND isDeleted = 0;
```

## Prevention Checklist

✅ Fixed `updateQuestion` function to use whitelist approach  
✅ Protected relational fields from being overwritten  
✅ Added null/undefined value protection  
✅ Created monitoring scripts  
✅ Created recovery scripts  
✅ Documented the issue and solution  

## Summary

Your current database is clean with **0 orphaned questions**. The bug fix is in place to prevent this from happening in the future. The recovery tools are available if needed, but currently there's nothing to recover.
