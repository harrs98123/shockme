"use client" 

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
 
const PLACEHOLDERS = [
  "I want a mind-bending thriller like Inception",
  "Something cozy for a rainy Sunday afternoon",
  "Mujhe kuch romantic aur emotional dikhao",
  "A futuristic cyberpunk world with neon lights",
  "Koi badhiya thriller movie batao",
  "High-stakes heist movie with a twist ending",
  "Sujhav do: best sci-fi movies of all time",
];

interface AIChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (think?: boolean, deepSearch?: boolean) => void;
  loading?: boolean;
}
 
const AIChatInput = ({ value, onChange, onSearch, loading }: AIChatInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [deepSearchActive, setDeepSearchActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
 
  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || value) return;
 
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 4000); // 4 seconds for slower cycling
 
    return () => clearInterval(interval);
  }, [isActive, value]);
 
  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!value) setIsActive(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);
 
  const handleActivate = () => setIsActive(true);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || loading) return;
    onSearch(thinkActive, deepSearchActive);
  };
 
  const containerVariants = {
    collapsed: {
      height: 68,
      boxShadow: "0 2px 20px 0 rgba(0,0,0,0.2)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 128,
      boxShadow: "0 8px 40px 0 rgba(79, 70, 229, 0.15)",
      transition: { type: "spring" as const, stiffness: 120, damping: 18 },
    },
  };
 
  const placeholderContainerVariants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };
 
  const letterVariants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring" as const, stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring" as const, stiffness: 80, damping: 20 },
      },
    },
  };
 
  return (
    <div className="w-full flex justify-center items-center text-white">
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl"
        variants={containerVariants}
        animate={isActive || value ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 32, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(24px)" }}
        onClick={handleActivate}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-stretch w-full h-full">
          {/* Input Row */}
          <div className="flex items-center gap-2 p-3 rounded-full max-w-3xl w-full">
            <button
              className="p-3 rounded-full hover:bg-white/5 transition text-gray-400 hover:text-white"
              title="Attach file"
              type="button"
              tabIndex={-1}
            >
              <Paperclip size={20} />
            </button>
 
            {/* Text Input & Placeholder */}
            <div className="relative flex-1">
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="flex-1 border-0 outline-0 rounded-md py-2 text-lg bg-transparent w-full font-medium text-white placeholder-transparent"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
                disabled={loading}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center py-2">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !value && (
                    <motion.span
                      key={placeholderIndex}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 select-none pointer-events-none text-lg"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {PLACEHOLDERS[placeholderIndex]
                        .split("")
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: "inline-block" }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
 
            <button
              className="p-3 rounded-full hover:bg-white/5 transition text-gray-400 hover:text-white"
              title="Voice input"
              type="button"
              tabIndex={-1}
            >
              <Mic size={20} />
            </button>
            <button
              onClick={() => handleSubmit()}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full font-medium justify-center transition-all disabled:opacity-50"
              title="Send"
              type="button"
              disabled={loading || !value.trim()}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
 
          {/* Expanded Controls */}
          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            variants={{
              hidden: {
                opacity: 0,
                y: 20,
                pointerEvents: "none" as const,
                transition: { duration: 0.25 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto" as const,
                transition: { duration: 0.35, delay: 0.08 },
              },
            }}
            initial="hidden"
            animate={isActive || value ? "visible" : "hidden"}
            style={{ marginTop: 8 }}
          >
            <div className="flex gap-3 items-center">
              {/* Think Toggle */}
              <button
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-bold group ${
                  thinkActive
                    ? "bg-indigo-500/20 outline outline-indigo-500/40 text-indigo-200"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
                title="Think"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setThinkActive((a) => !a);
                }}
              >
                <Lightbulb
                  className={`${thinkActive ? "fill-yellow-400 text-yellow-400" : "group-hover:text-yellow-400"} transition-all`}
                  size={18}
                />
                Brain Analysis
              </button>
 
              {/* Deep Search Toggle */}
              <motion.button
                className={`flex items-center px-4 gap-2 py-2.5 rounded-full transition-all font-bold whitespace-nowrap overflow-hidden justify-start  ${
                  deepSearchActive
                    ? "bg-purple-500/20 outline outline-purple-500/40 text-purple-200"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
                title="Deep Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeepSearchActive((a) => !a);
                }}
                initial={false}
                animate={{
                  width: deepSearchActive ? 145 : 44,
                  paddingLeft: deepSearchActive ? 16 : 12,
                }}
              >
                <div className="flex-shrink-0">
                  <Globe className={deepSearchActive ? "text-purple-400" : ""} size={18} />
                </div>
                <motion.span
                className="pb-[1px]"
                  initial={false}
                  animate={{
                    opacity: deepSearchActive ? 1 : 0,
                  }}
                >
                  Neural Research
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};
 
export { AIChatInput };
