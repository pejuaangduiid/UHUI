import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

interface ActionItemsProps {
  items: ActionItem[];
  onToggle: (id: string, done: boolean) => void;
  isLoading?: boolean;
}

export const ActionItems: React.FC<ActionItemsProps> = ({ items, onToggle, isLoading }) => {
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          disabled={isLoading}
          onClick={() => onToggle(item.id, !item.done)}
          className={`w-full text-left p-3.5 rounded-lg border transition flex items-start gap-3 ${item.done
              ? "bg-blue-950/20 border-blue-900/40 text-zinc-400"
              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-100"
            }`}
        >
          <div className="mt-0.5 shrink-0 text-blue-500">
            {item.done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-zinc-600" />}
          </div>
          <div className="flex-1">
            <span className="text-xs font-semibold text-zinc-500 mr-2">{`Aksi #${idx + 1}`}</span>
            <span className={`text-sm ${item.done ? "line-through text-zinc-400" : "text-zinc-200"}`}>
              {item.text}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

