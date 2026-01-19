// Planner/Study Plan model schema
export class StudyPlan {
  constructor(id, userId, goals = [], schedule = {}) {
    this.id = id;
    this.userId = userId;
    this.goals = goals;
    this.schedule = schedule;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
