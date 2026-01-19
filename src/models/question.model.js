// question.model.js
export default class Question {
  constructor(data) {
    this.id = data.id;
    this.stem = data.stem;
    this.stemImage = data.stemImage || data.image || { data: "", size: "default", fileName: "" };
    this.choices = data.choices || [];
    this.correct = data.correct;
    this.subject = data.subject;
    this.system = data.system;
    this.topic = data.topic;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
    
    this.explanationCorrect = data.explanationCorrect || data.correctExplanation || "";
    this.explanationCorrectImage = data.explanationCorrectImage || { data: "", size: "default", fileName: "" };
    
    this.explanationWrong = data.explanationWrong || data.wrongExplanation || "";
    this.explanationWrongImage = data.explanationWrongImage || { data: "", size: "default", fileName: "" };
    
    this.summary = data.summary || "";
    this.summaryImage = data.summaryImage || { data: "", size: "default", fileName: "" };
    
    this.published = data.published ?? false;
    this.stemImageMode = data.stemImageMode || "auto";
    this.explanationImageMode = data.explanationImageMode || "auto";
  }
}
