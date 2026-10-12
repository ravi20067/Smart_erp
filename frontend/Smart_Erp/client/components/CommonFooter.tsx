import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function CommonFooter() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.footer
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-auto border-t border-white/[0.08] bg-[#081223]/60 backdrop-blur-xl px-4 py-4 sm:px-6 lg:px-8"
        >
            <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
                <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200">
                        <Sparkles size={13} />
                    </span>
                    <span className="text-slate-300 font-semibold">Smart ERP</span>
                    <span className="text-slate-600">·</span>
                    <span>Institutional Management System</span>
                </div>

                <p className="text-slate-500 text-center">
                    © {new Date().getFullYear()} Smart ERP. All rights reserved.
                </p>

                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-slate-400 font-medium">Campus Cloud Operational</span>
                </div>
            </div>
        </motion.footer>
    );
}
