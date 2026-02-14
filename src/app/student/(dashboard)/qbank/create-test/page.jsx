"use client";

import { useEffect, useState, useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { getAllQuestions } from "@/services/question.service";
import { getProductById } from "@/services/product.service";
import CreateTestTemplateA from "./CreateTestTemplateA";
import CreateTestTemplateB from "./CreateTestTemplateB";

export default function CreateTestPage() {
  const [questions, setQuestions] = useState([]);
  const [productConfig, setProductConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedStudentProduct } = useContext(AppContext);
  const userId = typeof window !== 'undefined' ? localStorage.getItem("medbank_user") : null;

  useEffect(() => {
    async function initPage() {
      setIsLoading(true);
      try {
        if (!userId) return;

        // Determine active product context
        const activeProduct = selectedStudentProduct || 
                             JSON.parse(localStorage.getItem("medbank_focused_product") || "null");

        const packageId = activeProduct?.id || "14"; 
        const packageName = activeProduct?.name || "Standard QBank";

        console.log(`[CreateTest] Initializing for Product: ${packageName} (ID: ${packageId})`);

        localStorage.setItem("medbank_selected_package", packageId);
        localStorage.setItem("medbank_selected_package_name", packageName);

        const [p, allFetched] = await Promise.all([
          getProductById(packageId),
          getAllQuestions(packageId)
        ]);

        setProductConfig(p || null);

        const fetchedArray = Array.isArray(allFetched) ? allFetched : [];
        const normalizeLabel = (value) => String(value || "")
          .toLowerCase()
          .replace(/[–—-]/g, " ")
          .replace(/[^a-z0-9]+/g, " ")
          .trim();

        const resolveProductSystem = (questionSystem, productSystems) => {
          if (!Array.isArray(productSystems) || productSystems.length === 0) return questionSystem;
          if (!questionSystem) return questionSystem;

          const exact = productSystems.find((s) => String(s).toLowerCase() === String(questionSystem).toLowerCase());
          if (exact) return exact;

          const normalizedQuestion = normalizeLabel(questionSystem);
          const aliasNormalizedQuestion = normalizedQuestion
            .replace(/\bcardiology\b/g, "cardiovascular")
            .replace(/\becg\b/g, "cardiovascular");

          const fuzzy = productSystems.find((s) => {
            const normalizedSystem = normalizeLabel(s);
            return (
              normalizedSystem === aliasNormalizedQuestion ||
              aliasNormalizedQuestion.includes(normalizedSystem) ||
              normalizedSystem.includes(aliasNormalizedQuestion)
            );
          });

          if (fuzzy) return fuzzy;
          if (productSystems.length === 1) return productSystems[0];
          return questionSystem;
        };

        const normalizedQuestions = fetchedArray.map((q) => ({
          ...q,
          system: resolveProductSystem(q.system, p?.systems),
        }));

        const validQuestions = normalizedQuestions.filter(q => 
          (q.published === 1 || q.published === true || q.lifecycleStatus === 'published' || q.status === 'published') &&
          q.system && q.system.trim() !== '' &&
          q.subject && q.subject.trim() !== ''
        );

        setQuestions(validQuestions);
      } catch (error) {
        console.error("Error initializing create test page:", error);
      } finally {
        setIsLoading(false);
      }
    }
    initPage();
  }, [selectedStudentProduct, userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse font-bold tracking-widest uppercase">Loading Product...</div>
      </div>
    );
  }

  const isTemplateB = productConfig?.templateType === 'ECG';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans select-none overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {isTemplateB ? (
          <CreateTestTemplateB
            questions={questions}
            userId={userId}
            productConfig={productConfig}
          />
        ) : (
            <CreateTestTemplateA
              questions={questions}
              userId={userId}
            />
        )}
      </div>
    </div>
  );
}
