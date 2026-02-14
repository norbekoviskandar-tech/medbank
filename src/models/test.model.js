// Test model schema
export class Test {
  constructor(id, title, questions = [], duration, createdBy) {
    this.id = id;
    this.title = title;
    this.questions = questions;
    this.duration = duration;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
