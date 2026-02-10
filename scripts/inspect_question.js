const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'medbank.db');
const db = new Database(dbPath);

const questionId = process.argv[2];

if (!questionId) {
    console.log("Usage: node inspect_question.js <questionId>");
    process.exit(1);
}

try {
    const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
    if (!q) {
        console.log(`Question ${questionId} not found.`);
    } else {
        console.log("--- Standard Fields ---");
        console.log("ID:", q.id);
        console.log("Stem:", q.stem ? q.stem.substring(0, 50) + "..." : "NULL");
        
        console.log("\n--- Explanation Fields (Raw) ---");
        console.log("Explanation:", q.explanation);
        console.log("Explanation Correct:", q.explanationCorrect);
        console.log("Explanation Wrong:", q.explanationWrong);
        
        console.log("\n--- JSON Fields ---");
        try {
            console.log("Choices:", JSON.parse(q.choices));
        } catch(e) { console.log("Choices (Invalid JSON):", q.choices); }
    }
} catch (error) {
    console.error("Error reading DB:", error.message);
}
