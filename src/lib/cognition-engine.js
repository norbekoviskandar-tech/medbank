/**
 * cognition-engine.js
 * 
 * Core intelligence layer for inferring behavioral traits and readiness 
 * from immutable forensic logs.
 */

/**
 * Analyze a single exam session for behavioral signals.
 * @param {Object} test - The full test object with sessionState.logs
 */
export function analyzeSessionBehavior(test) {
    const logs = test.sessionState?.logs || [];
    if (logs.length === 0) return null;

    let secondGuesses = 0; // Right -> Wrong
    let recoveries = 0;    // Wrong -> Right
    let impulsivityCount = 0; // Wrong under 10s
    let totalQuestions = test.questions.length;
    
    const questionEvents = {}; // Map of qId -> list of selection logs

    logs.forEach(log => {
        if (log.action === 'select_answer') {
            if (!questionEvents[log.questionId]) questionEvents[log.questionId] = [];
            questionEvents[log.questionId].push(log);
        }
    });

    Object.entries(questionEvents).forEach(([qId, events]) => {
        if (events.length < 2) return;

        const q = test.questions.find(item => item.id === qId);
        if (!q) return;

        const firstChoice = events[0].choice;
        const lastChoice = events[events.length - 1].choice;

        if (firstChoice === q.correct && lastChoice !== q.correct) {
            secondGuesses++;
        } else if (firstChoice !== q.correct && lastChoice === q.correct) {
            recoveries++;
        }

        // Impulsivity: Incorrect choice made very quickly (under 10s of cumulative time for that Q)
        // Note: For truly deep impulsivity we'd need per-log cumulative timers, 
        // but here we'll use a heuristic based on the first event's offset if available.
        if (events[0].offset < 10000 && firstChoice !== q.correct && events.length === 1) {
            impulsivityCount++;
        }
    });

    // Fatigue Detection: Compare accuracy in first half vs second half
    const halfIndex = Math.floor(test.questions.length / 2);
    const firstHalf = test.questions.slice(0, halfIndex);
    const secondHalf = test.questions.slice(halfIndex);

    const firstHalfCorrect = firstHalf.filter(q => q.userAnswer === q.correct).length;
    const secondHalfCorrect = secondHalf.filter(q => q.userAnswer === q.correct).length;

    const firstHalfAccuracy = firstHalf.length > 0 ? firstHalfCorrect / firstHalf.length : 0;
    const secondHalfAccuracy = secondHalf.length > 0 ? secondHalfCorrect / secondHalf.length : 0;
    const fatigueFactor = firstHalfAccuracy > 0 ? Math.max(0, (firstHalfAccuracy - secondHalfAccuracy) / firstHalfAccuracy) : 0;

    return {
        overthinkingScore: secondGuesses / (totalQuestions || 1),
        recoveryScore: recoveries / (totalQuestions || 1),
        impulsivityScore: impulsivityCount / (totalQuestions || 1),
        fatigueFactor: fatigueFactor
    };
}

/**
 * Calculate pass probability based on accuracy, unique exposure, and stability.
 */
export function calculateReadiness(stats) {
    const { 
        accuracy, // 0 to 1
        uniqueExposure, // % of unique questions used (0 to 1)
        performanceStability // inverse of variance (0 to 1) 
    } = stats;

    // Weighting: Accuracy (60%), Stability (20%), Exposure (20%)
    // High exposure with low accuracy = "memorized pool" penalty
    const exposureWeight = uniqueExposure < 0.3 ? 0.5 : 1.0; 
    const baseScore = (accuracy * 0.6) + (performanceStability * 0.2) + (uniqueExposure * 0.2);
    
    return Math.round(baseScore * exposureWeight * 100);
}
