/**
 * Shared constants and utility functions for Create Test functionality
 */

export const SUBJECTS = ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Microbiology", "Pharmacology", "Public Health", "Behavioral Science"];

export const SYSTEMS = ["Cardiovascular", "Respiratory", "Gastrointestinal", "Renal", "Neurology", "Endocrine", "Hematology & Oncology", "Musculoskeletal & Integumentary", "Reproductive", "Multi-system"];

export const STATUS_FILTERS = ["Unused", "Incorrect", "Marked", "Omitted", "Correct"];

/**
 * Shuffles questions and returns a set of IDs
 * @param {Array} pool - The pool of questions to select from
 * @param {number} count - Number of questions to select
 * @returns {Array} - Array of question IDs
 */
export const selectRandomQuestions = (pool, count) => {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(q => q.id);
};

/**
 * Generates a unique test ID scoped by user ID
 * @param {string} userId - Current user ID
 * @returns {string} - Unique test ID
 */
export const generateTestId = (userId) => {
  return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validates and retrieves the persistent test ID for the session
 * @param {string} userId - Current user ID
 * @returns {string} - Persistent or new test ID
 */
export const getPersistentTestId = (userId) => {
  if (typeof window === 'undefined') return '';
  
  let testId = sessionStorage.getItem('current_test_id');
  if (!testId || !testId.startsWith(userId + '_')) {
    testId = generateTestId(userId);
    sessionStorage.setItem('current_test_id', testId);
  }
  return testId;
};
