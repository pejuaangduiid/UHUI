"use client";

import React from "react";
import { ComposerBar } from "./ComposerBar";
import { GroupSectionHeader } from "./GroupSectionHeader";
import { ThreadForm } from "./ThreadForm";
import { ThreadList } from "./ThreadList";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];
type Group = components["schemas"]["CommunityGroupDTO"];

interface CommunityFeedProps {
  userInitials: string;
  activeGroup?: Group;
  isMember: boolean;
  isCreating: boolean;
  onToggleCreate: () => void;
  onJoinGroup: () => void;
  isJoining: boolean;
  onLeaveGroup?: () => void;
  isLeaving?: boolean;
  groups?: Group[];
  onSubmitThread: (data: { kind: string; title: string; content: string; targetGroupId?: string }) => void;
  isPosting: boolean;
  threads: Thread[];
  isLoading: boolean;
  onSelectThread: (thread: Thread) => void;
  onSelectGroup: (groupSlug: string) => void;
  currentUserId?: string;
  onEdit: (thread: Thread) => void;
  onDelete: (threadId: string) => void;
  isMyPosts: boolean;
  formError?: string;
}

export function CommunityFeed({
  userInitials,
  activeGroup,
  isMember,
  isCreating,
  onToggleCreate,
  onJoinGroup,
  isJoining,
  onLeaveGroup,
  isLeaving,
  groups,
  onSubmitThread,
  isPosting,
  threads,
  isLoading,
  onSelectThread,
  onSelectGroup,
  currentUserId,
  onEdit,
  onDelete,
  isMyPosts,
  formError,
}: CommunityFeedProps) {
  return (
    <div className="space-y-6">
      <ComposerBar userInitials={userInitials} activeGroupName={activeGroup?.name} onOpen={onToggleCreate} />
      <GroupSectionHeader
        activeGroup={activeGroup}
        isMember={isMember}
        isCreating={isCreating}
        onToggleCreate={onToggleCreate}
        onJoinGroup={onJoinGroup}
        isJoining={isJoining}
        onLeaveGroup={onLeaveGroup}
        isLeaving={isLeaving}
      />
      {isCreating && (
        <ThreadForm
          placeholderTitle={activeGroup ? `Tulis topik di ${activeGroup.name}...` : undefined}
          onSubmit={onSubmitThread}
          isLoading={isPosting}
          onCancel={onToggleCreate}
          groups={groups}
          defaultGroupId={activeGroup?.id}
          errorMessage={formError}
        />
      )}
      <ThreadList
        threads={threads}
        isLoading={isLoading}
        onSelect={onSelectThread}
        onSelectGroup={onSelectGroup}
        currentUserId={currentUserId}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage={isMyPosts ? "Anda belum membuat postingan." : undefined}
        emptyAction={
          <button
            type="button"
            onClick={onToggleCreate}
            className="inline-flex items-center gap-2 rounded-[11px] bg-[#1D5FAE] hover:bg-[#184e91] px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
          >
            <span>+ Buat Postingan Sekarang</span>
          </button>
        }
      />
    </div>
  );
}

