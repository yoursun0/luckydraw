"use client";

import { useSession } from "@/lib/store";
import { buildExportText, exportFilename } from "@/lib/export";

/**
 * "Export Winners" button, shown on the FINISHED phase. Downloads the
 * winners summary as a .txt file (format: docs/winner-export-schema.md).
 */
export default function ExportWinnersButton() {
  const { state } = useSession();
  if (state.phase !== "FINISHED") return null;

  const handleExport = () => {
    const text = buildExportText(state.config, state.results);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFilename(state.config.eventTitle, new Date());
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-full text-lg font-semibold backdrop-blur transition-all"
    >
      ⬇ Export Winners
    </button>
  );
}
