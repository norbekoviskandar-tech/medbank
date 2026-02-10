import { NextResponse } from 'next/server';
import { safeGetDb, getAllQuestions, updateQuestion, createQuestion, deleteQuestion } from '@/lib/server-db';

// GET /api/questions?packageId=xxx - Get questions
export async function GET(request) {
  console.log("\n==============================");
  console.log("➡️ /api/questions GET HIT");
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || searchParams.get('packageId');
    const includeUnpublished = searchParams.get('includeUnpublished') !== 'false';
    
    console.log("📦 GET params:", { productId, includeUnpublished });
    
    const questions = getAllQuestions(productId, includeUnpublished);
    console.log(`✅ Returning ${questions.length} questions`);
    return NextResponse.json(questions);
  } catch (error) {
    console.error('🔥 QUESTION GET CRASH:');
    console.error(error);
    console.error(error.stack);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/questions - Create a new question
export async function POST(req) {
  console.log("\n==============================");
  console.log("➡️ /api/questions POST HIT");

  let body;

  try {
    body = await req.json();
    console.log("📦 BODY RECEIVED:", {
      id: body.id,
      productId: body.productId,
      packageId: body.packageId,
      system: body.system,
      subject: body.subject,
      topic: body.topic,
      hasChoices: Array.isArray(body.choices),
      choicesCount: body.choices?.length,
      status: body.status
    });
  } catch (e) {
    console.error("❌ JSON PARSE ERROR:", e);
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    console.log("🧠 LOADING DB...");
    const db = safeGetDb();
    console.log("✅ DB LOADED");

    const { 
      id, stem, stemImage, choices, correct, 
      explanationCorrect, explanationCorrectImage,
      explanationWrong, explanationWrongImage,
      summary, summaryImage,
      system, subject, topic, 
      packageId, productId, status, versionNumber,
      stemImageMode, explanationImageMode,
      references, tags, conceptId
    } = body;

    console.log("🔍 FIELDS:", {
      id: !!id,
      stem: !!stem,
      choices: Array.isArray(choices),
      correct,
      system,
      subject,
      topic,
      packageId,
      status
    });

    // Validation
    const effectiveProductId = productId || packageId;
    if (!effectiveProductId) throw new Error("Missing productId/packageId - questions must belong to a product");
    if (!stem) throw new Error("Missing stem");
    if (!Array.isArray(choices)) throw new Error("Choices must be an array");
    if (!system) throw new Error("Missing system");
    if (!subject) throw new Error("Missing subject");

    console.log("✅ VALIDATION OK");

    // Generate ID if missing
    const questionId = id || crypto.randomUUID();
    const now = new Date().toISOString();
    const effectiveConceptId = conceptId || `concept_${questionId}`;

    console.log("🆔 Question ID:", questionId);
    console.log("🔗 Concept ID:", effectiveConceptId);

    // First, ensure the concept exists
    try {
      console.log("📝 Creating concept entry...");
      const conceptSql = `
        INSERT OR IGNORE INTO question_concepts (id, productId, packageId, system, subject, topic, tags, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.prepare(conceptSql).run(
        effectiveConceptId,
        effectiveProductId.toString(),
        effectiveProductId.toString(),
        system,
        subject,
        topic || 'Mixed',
        JSON.stringify(tags || []),
        now
      );
      console.log("✅ Concept ready");
    } catch (conceptErr) {
      console.warn("⚠️ Concept creation warning (may already exist):", conceptErr.message);
    }

    // Simplified approach: use createQuestion to ensure all fields are mapped correctly
    const result = createQuestion({
      ...body,
      id: questionId,
      conceptId: effectiveConceptId,
      createdAt: now,
      updatedAt: now,
      productId: effectiveProductId.toString(),
      packageId: effectiveProductId.toString()
    });

    console.log("🎉 INSERT SUCCESS:", result);

    // Log governance history
    try {
      console.log("📜 Logging governance history...");
      db.prepare(`
        INSERT INTO governance_history (versionId, conceptId, fromState, toState, performedBy, performedAt, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        questionId,
        effectiveConceptId,
        null,
        status || 'draft',
        'author',
        now,
        'Author manual entry'
      );
      console.log("✅ Governance logged");
    } catch (govErr) {
      console.warn("⚠️ Governance log warning:", govErr.message);
    }

    return Response.json({ 
      success: true, 
      id: questionId,
      conceptId: effectiveConceptId
    }, { status: 201 });

  } catch (err) {
    console.error("🔥 QUESTION PIPELINE CRASH:");
    console.error(err);
    console.error(err.stack);

    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// PUT /api/questions - Update a question
export async function PUT(request) {
  console.log("\n==============================");
  console.log("➡️ /api/questions PUT HIT");

  let body;

  try {
    body = await request.json();
    console.log("📦 UPDATE BODY:", {
      id: body.id,
      packageId: body.packageId,
      system: body.system,
      subject: body.subject,
      status: body.status
    });
  } catch (e) {
    console.error("❌ JSON PARSE ERROR:", e);
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    if (!body.id) throw new Error("Missing id for update");
    if (!body.packageId) throw new Error("Missing packageId");
    if (!body.system) throw new Error("Missing system");
    if (!body.subject) throw new Error("Missing subject");

    console.log("✅ VALIDATION OK");
    console.log("💾 Calling updateQuestion...");
    
    const updated = updateQuestion(body.id, body);
    
    console.log("🎉 UPDATE SUCCESS:", body.id);
    return NextResponse.json({ success: true, ...updated });

  } catch (err) {
    console.error("🔥 QUESTION UPDATE CRASH:");
    console.error(err);
    console.error(err.stack);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/questions - Delete a question
export async function DELETE(request) {
  console.log("\n==============================");
  console.log("➡️ /api/questions DELETE HIT");

  try {
    const { id } = await request.json();
    
    if (!id) {
      console.error("❌ VALIDATION FAILED: Missing id");
      return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    }

    console.log("🗑️ Deleting question:", id);
    deleteQuestion(id);
    console.log("✅ DELETE SUCCESS:", id);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("🔥 QUESTION DELETE CRASH:");
    console.error(err);
    console.error(err.stack);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
