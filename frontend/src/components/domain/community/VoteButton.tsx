"use client";

import React from "react";
import { ChevronUp } from "lucide-react";
import { useVote } from "@/hooks/use-vote";

interface VoteButtonProps {
  threadId: string;
  upvotesCount: number;
  hasVoted?: boolean;
}

export function VoteButton({
  threadId,
  upvotesCount,
  hasVoted = false,
}: VoteButtonProps) {
  const voteMutation = useVote(threadId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    voteMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={voteMutation.isPending}
      aria-label="Upvote"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
        hasVoted
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted/60 hover:bg-muted text-muted-foreground border-border hover:text-foreground"
      }`}
    >
      <ChevronUp className={`h-3.5 w-3.5 ${hasVoted ? "stroke-[3]" : ""}`} />
      <span>{upvotesCount}</span>
    </button>
  );
}

