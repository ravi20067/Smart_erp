import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
    Bot,
    Check,
    ChevronDown,
    Globe2,
    MessageCircle,
    Minimize2,
    Plus,
    Send,
    Sparkles,
    X,
} from "lucide-react";

export type AssistantLanguage = {
    label: string;
    value: string;
};

export type AssistantMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

export type SmartERPChatbotProps = {
    /**
     * Connect this to the existing AI service.
     * Do not invent a new backend endpoint here.
     */
    onSend?: (
        message: string,
        language: string,
        history: AssistantMessage[],
    ) => Promise<string>;

    title?: string;
    subtitle?: string;
    initialLanguage?: string;
    languages?: AssistantLanguage[];
    className?: string;
};

const defaultLanguages: AssistantLanguage[] = [
    { label: "Auto-detect", value: "auto" },
    { label: "English", value: "en" },
    { label: "हिन्दी", value: "hi" },
    { label: "Hinglish", value: "hinglish" },
    { label: "বাংলা", value: "bn" },
    { label: "தமிழ்", value: "ta" },
    { label: "తెలుగు", value: "te" },
    { label: "मराठी", value: "mr" },
    { label: "ગુજરાતી", value: "gu" },
    { label: "ਪੰਜਾਬੀ", value: "pa" },
    { label: "اردو", value: "ur" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
    { label: "العربية", value: "ar" },
    { label: "中文", value: "zh" },
    { label: "日本語", value: "ja" },
];

const makeId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function SmartERPChatbot({
    onSend,
    title = "Smart ERP Assistant",
    subtitle = "Multilingual AI assistance",
    initialLanguage = "auto",
    languages = defaultLanguages,
    className = "",
}: SmartERPChatbotProps) {
    const reduceMotion = useReducedMotion();

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [language, setLanguage] = useState(initialLanguage);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [history, setHistory] = useState<AssistantMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content:
                "Hello! Ask a question in your preferred language. I can help once the AI service is connected.",
        },
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "end",
        });
    }, [history, isLoading, isOpen, reduceMotion]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleNewConversation = () => {
        setHistory([
            {
                id: makeId(),
                role: "assistant",
                content:
                    "New conversation started. What would you like help with?",
            },
        ]);
        setError("");
        setMessage("");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const text = message.trim();
        if (!text || isLoading) return;

        if (!onSend) {
            setError(
                "The AI assistant is not connected yet. Connect this component to your existing AI service to enable responses.",
            );
            return;
        }

        const userMessage: AssistantMessage = {
            id: makeId(),
            role: "user",
            content: text,
        };

        const previousHistory = history.filter(
            (item) => item.id !== "welcome",
        );

        const nextHistory = [...previousHistory, userMessage];

        setHistory((current) => [...current, userMessage]);
        setMessage("");
        setError("");
        setIsLoading(true);

        try {
            const answer = await onSend(text, language, previousHistory);

            if (!answer || !answer.trim()) {
                throw new Error("The AI service returned an empty response.");
            }

            setHistory((current) => [
                ...current,
                {
                    id: makeId(),
                    role: "assistant",
                    content: answer.trim(),
                },
            ]);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Unable to get a response. Please try again.";

            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const panelTransition = reduceMotion
        ? { duration: 0 }
        : { duration: 0.22, ease: "easeOut" as const };

    return (
        <div className={className}>
            {/* Floating launcher */}
            <motion.button
                type="button"
                aria-label={isOpen ? "Close Smart ERP assistant" : "Open Smart ERP assistant"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
                whileHover={reduceMotion ? undefined : { scale: 1.04 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className="fixed bottom-5 right-5 z-[100] flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,0.24)] outline-none transition-shadow hover:shadow-[0_14px_45px_rgba(34,211,238,0.34)] focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b16] sm:bottom-6 sm:right-6"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.span
                            key="close"
                            initial={reduceMotion ? false : { opacity: 0, rotate: -45 }}
                            animate={{ opacity: 1, rotate: 0 }}
                            exit={{ opacity: 0, rotate: 45 }}
                            transition={panelTransition}
                        >
                            <X size={23} />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="bot"
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={panelTransition}
                        >
                            <Bot size={24} />
                        </motion.span>
                    )}
                </AnimatePresence>
                {!isOpen && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#070b16] bg-emerald-400" />
                )}
            </motion.button>

            {/* Chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.section
                        key="chat-panel"
                        role="dialog"
                        aria-label={title}
                        aria-modal="false"
                        initial={
                            reduceMotion
                                ? false
                                : { opacity: 0, y: 18, scale: 0.97 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={panelTransition}
                        className="fixed inset-x-3 bottom-[5.5rem] z-[99] flex h-[min(660px,calc(100dvh-7.5rem))] min-h-[390px] flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0b1220]/[0.98] shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[min(680px,calc(100dvh-8rem))] sm:w-[400px]"
                    >
                        {/* Header */}
                        <div className="relative overflow-hidden border-b border-white/[0.08] bg-white/[0.025] px-4 py-4">
                            <div className="pointer-events-none absolute -right-10 -top-16 h-32 w-32 rounded-full bg-cyan-500/[0.12] blur-3xl" />

                            <div className="relative flex items-center gap-3">
                                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-200">
                                    <Bot size={23} />
                                    <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#0b1220] bg-emerald-400" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-sm font-semibold text-white">
                                        {title}
                                    </h2>
                                    <p className="mt-1 truncate text-xs text-slate-400">
                                        {subtitle}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNewConversation}
                                    title="New conversation"
                                    aria-label="Start a new conversation"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                    <Plus size={17} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    title="Minimize assistant"
                                    aria-label="Minimize assistant"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                >
                                    <Minimize2 size={16} />
                                </button>
                            </div>

                            {/* Language selector */}
                            <div className="relative mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-slate-950/50 px-3">
                                <Globe2 size={15} className="shrink-0 text-cyan-300" />
                                <label htmlFor="smart-erp-chat-language" className="sr-only">
                                    Response language
                                </label>
                                <select
                                    id="smart-erp-chat-language"
                                    value={language}
                                    onChange={(event) => setLanguage(event.target.value)}
                                    className="min-w-0 flex-1 appearance-none bg-transparent py-2.5 text-xs text-slate-200 outline-none focus-visible:ring-1 focus-visible:ring-cyan-300"
                                >
                                    {languages.map((item) => (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                            className="bg-[#0b1220] text-white"
                                        >
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={14}
                                    className="pointer-events-none text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Conversation */}
                        <div
                            aria-live="polite"
                            aria-relevant="additions text"
                            className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
                        >
                            <div className="flex items-start gap-2.5">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                    <Sparkles size={14} />
                                </div>
                                <p className="rounded-xl rounded-tl-sm border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 text-xs leading-6 text-slate-400">
                                    Ask in your preferred language. Responses depend on the
                                    configured AI service and its available information.
                                </p>
                            </div>

                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-start gap-2.5 ${item.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {item.role === "assistant" && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                            <Sparkles size={14} />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[84%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-sm leading-6 ${item.role === "user"
                                            ? "rounded-tr-sm border border-cyan-400/15 bg-cyan-400/[0.08] text-slate-100"
                                            : "rounded-tl-sm border border-white/[0.08] bg-white/[0.035] text-slate-300"
                                            }`}
                                    >
                                        {item.content}
                                    </div>

                                    {item.role === "user" && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-200">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-400/[0.08] text-violet-200">
                                        <Sparkles size={14} />
                                    </div>
                                    <div
                                        className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.035] px-4 py-3"
                                        role="status"
                                        aria-label="Assistant is responding"
                                    >
                                        {[0, 1, 2].map((dot) => (
                                            <motion.span
                                                key={dot}
                                                animate={
                                                    reduceMotion
                                                        ? undefined
                                                        : { opacity: [0.35, 1, 0.35], y: [0, -2, 0] }
                                                }
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    delay: dot * 0.15,
                                                }}
                                                className="h-1.5 w-1.5 rounded-full bg-cyan-300"
                                            />
                                        ))}
                                        <span className="ml-1 text-xs text-slate-400">
                                            Thinking...
                                        </span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div
                                    role="alert"
                                    className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-200"
                                >
                                    {error}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Composer */}
                        <form
                            onSubmit={handleSubmit}
                            className="border-t border-white/[0.08] bg-white/[0.02] p-3"
                        >
                            <div className="rounded-2xl border border-white/[0.10] bg-slate-950/60 p-2 transition focus-within:border-cyan-400/30 focus-within:ring-2 focus-within:ring-cyan-400/[0.08]">
                                <label htmlFor="smart-erp-chat-input" className="sr-only">
                                    Enter your question
                                </label>
                                <textarea
                                    id="smart-erp-chat-input"
                                    ref={inputRef}
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" &&
                                            !event.shiftKey &&
                                            !event.nativeEvent.isComposing
                                        ) {
                                            event.preventDefault();
                                            event.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                    rows={2}
                                    maxLength={8000}
                                    placeholder="Ask anything..."
                                    className="max-h-32 min-h-[48px] w-full resize-y bg-transparent px-2 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
                                />

                                <div className="flex items-center justify-between gap-2 px-1 pb-1">
                                    <span className="text-[10px] text-slate-500">
                                        Enter to send · Shift + Enter for a new line
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={!message.trim() || isLoading}
                                        aria-label="Send message"
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-2 px-1 text-center text-[10px] leading-4 text-slate-500">
                                AI responses can be inaccurate. Avoid entering sensitive
                                personal information.
                            </p>
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
}