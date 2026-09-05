"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, Clock, List, Loader2 } from "./components/Icons";
import HistoryItem from "./components/HistoryItem";
import { formatRecipeText } from "./components/RecipeFormatter";

export default function HomePage() {
  const [ingredients, setIngredients] = useState("");
  const [time, setTime] = useState(30);
  const [dishName, setDishName] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const recipeRef = useRef(null);

  // Framer Motion variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const generateRecipe = useCallback(async () => {
    if (!ingredients.trim() || loading) return;

    setLoading(true);
    setHasError(false);
    setDishName(null);
    setRecipe(null);
    setStatusMessage("Generating recipe...");

    try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, time }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recipe generation failed.");

      const text = data.text || "Error: No response.";
      const lines = text.split("\n");
      const title = lines[0]?.trim();
      const body = lines.slice(1).join("\n").trim();

      setDishName(title);
      setRecipe(body);
      setMeta({ ingredients, time });
      setHistory([{ recipe: text, ingredients, time, createdAt: new Date().toLocaleDateString() }, ...history]);
      setStatusMessage("Recipe generated!");
      recipeRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setHasError(true);
      setStatusMessage(err.message || "Error generating recipe.");
    } finally {
      setLoading(false);
    }
  }, [ingredients, time, loading, history]);

  const handleCopy = useCallback(async () => {
    if (!dishName || !recipe) return;
    try {
      await navigator.clipboard.writeText(`${dishName}\n\n${recipe}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  }, [dishName, recipe]);

  const handleReset = useCallback(() => {
    setDishName(null);
    setRecipe(null);
    setMeta(null);
    setIngredients("");
    setHasError(false);
    setStatusMessage("");
  }, []);

  const ingredientCount = meta?.ingredients
    ? meta.ingredients.split(",").map((i) => i.trim()).filter(Boolean).length
    : 0;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 text-gray-800 font-sans p-6"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* HEADER */}
      <motion.header className="text-center mb-10" variants={fadeInUp}>
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-orange-600 drop-shadow-lg">
          FOOD GENIE 🧑‍🍳
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Instantly create recipes with your ingredients.</p>
      </motion.header>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* INPUT + GENERATE */}
        <motion.div className="lg:w-2/3" variants={fadeInUp}>
          <motion.div
            className="p-6 bg-white rounded-3xl shadow-lg border border-teal-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
            whileHover={{ scale: 1.02 }}
          >
            <h2 className="text-3xl font-bold text-teal-600 flex items-center mb-6">
              <Zap className="mr-3 text-orange-500" /> What&apos;s for Dinner?
            </h2>

            <textarea
              className="w-full p-4 bg-gray-100 rounded-xl border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-300 text-gray-800 mb-4 transition-all"
              placeholder="List ingredients..."
              rows="3"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />

            <label className="flex items-center mb-3 text-sm text-gray-700">
              <Clock className="mr-2 text-orange-400" /> Max Time (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-1/3 p-3 border-2 border-gray-300 rounded-xl mb-6 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
            />

            <motion.button
              onClick={generateRecipe}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-md disabled:opacity-50 relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-teal-400 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-md"></span>
              <span className="relative inline-flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate My Recipe 🚀"
                )}
              </span>
            </motion.button>

            {/* Error feedback */}
            {hasError && !loading && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm"
              >
                <span>⚠️</span>
                <span>{statusMessage}</span>
              </motion.div>
            )}
          </motion.div>

          {/* LOADING SKELETON */}
          {loading && (
            <motion.div
              className="mt-8 bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="animate-pulse space-y-5">
                <div className="h-3 w-28 bg-teal-100 rounded-full" />
                <div className="h-8 w-2/3 bg-gray-200 rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-7 w-24 bg-orange-100 rounded-full" />
                  <div className="h-7 w-28 bg-teal-100 rounded-full" />
                </div>
                <div className="h-px bg-gray-100" />
                <div className="space-y-2.5">
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-11/12" />
                  <div className="h-4 bg-gray-100 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </motion.div>
          )}

          {/* GENERATED RECIPE DISPLAY */}
          {!loading && dishName && recipe && (
            <motion.div
              ref={recipeRef}
              className="mt-8 bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden hover:shadow-2xl transition-shadow duration-500"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Accent strip */}
              <div className="h-1.5 bg-gradient-to-r from-orange-500 via-red-400 to-teal-500" />

              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-sm font-medium text-teal-600 mb-1">Your dish is ready</p>
                    <motion.h3
                      className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {dishName}
                    </motion.h3>
                  </div>
                  <span className="text-4xl shrink-0" aria-hidden="true">🍽️</span>
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium border border-orange-200">
                    <Clock className="w-4 h-4" /> Ready in {meta?.time ?? time} min
                  </span>
                  {ingredientCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium border border-teal-200">
                      🧂 {ingredientCount} ingredient{ingredientCount === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                <div className="h-px bg-gray-100 mb-6" />

                {/* Recipe body */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="leading-relaxed text-gray-700"
                >
                  {formatRecipeText(recipe)}
                </motion.div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    {copied ? "✅ Copied" : "📋 Copy recipe"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    🔄 Start a new recipe
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* HISTORY */}
        <motion.div
          className="lg:w-1/3"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-6 bg-white rounded-3xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
              <List className="mr-2 text-teal-600" /> Recipe History 📚
            </h2>
            {history.length === 0 ? (
              <p className="text-gray-500 italic">No recipes yet.</p>
            ) : (
              <motion.div
                className="space-y-4 max-h-[70vh] overflow-y-auto"
                initial="hidden"
                animate="visible"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              >
                {history.map((item, idx) => (
                  <motion.div key={idx} variants={fadeInUp} whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                    <HistoryItem
                      item={item}
                      onSelect={(title, body) => {
                        setDishName(title);
                        setRecipe(body);
                        setMeta({ ingredients: item.ingredients, time: item.time });
                        recipeRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}