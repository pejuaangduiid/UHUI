"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { parseProblem } from "@/lib/api/errors";
import { useSession } from "@/hooks/use-session";
import { useHubThreads, useCreateHubThread } from "@/hooks/use-hub";
import { useCommunityGroups, useGroupThreads, useCreateGroupThread, useJoinCommunityGroup, useLeaveCommunityGroup } from "@/hooks/use-community-groups";
import { useMyThreads, useUpdateThread, useDeleteThread } from "@/hooks/use-thread-ops";
import { ThreadDetailView } from "@/components/domain/community/ThreadDetailView";
import { SectoralGroups } from "@/components/domain/community/SectoralGroups";
import { CommunityHeader } from "@/components/domain/community/CommunityHeader";
import { CommunityFeed } from "@/components/domain/community/CommunityFeed";
import { EditThreadModal } from "@/components/domain/community/EditThreadModal";
import type { components } from "@/types/api";

type Thread = components["schemas"]["ThreadDTO"];

export default function KomunitasHubPage() {
  const { user } = useSession();
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [editingThread, setEditingThread] = useState<Thread | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [kindFilter, setKindFilter] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [formError, setFormError] = useState("");

  const { data: groups } = useCommunityGroups();
  const joinGroup = useJoinCommunityGroup(), leaveGroup = useLeaveCommunityGroup();
  const activeGroup = groups?.find((g) => g.slug === selectedSector);
  const isMember = Boolean(activeGroup?.is_member);

  const { data: hubThreads, isLoading: isHubLoading } = useHubThreads();
  const { data: groupThreads, isLoading: isGroupLoading } = useGroupThreads(activeGroup?.id ?? "");
  const { data: myThreads, isLoading: isMyLoading } = useMyThreads();

  const createHubThread = useCreateHubThread(), createGroupThread = useCreateGroupThread(activeGroup?.id ?? "");
  const updateThread = useUpdateThread(), deleteThread = useDeleteThread();

  const isMyPosts = kindFilter === "my_posts";
  const activeThreads = isMyPosts ? (myThreads ?? []) : activeGroup ? (groupThreads ?? []) : (hubThreads ?? []);
  const isLoading = isMyPosts ? isMyLoading : activeGroup ? isGroupLoading : isHubLoading;
  const filtered = activeThreads.filter((t) => !kindFilter || kindFilter === "my_posts" || t.kind === kindFilter);

  const handleSelectGroup = (slug: string) => {
    setSelectedSector(slug);
    setSelectedThread(null);
    setIsCreating(false);
    setFormError("");
    if (kindFilter === "my_posts") setKindFilter("");
  };

  const handleToggleCreate = () => { setIsCreating((p) => !p); setFormError(""); setSelectedThread(null); };
  const handleJoinGroup = () => activeGroup && joinGroup.mutate(activeGroup.id);
  const handleLeaveGroup = () => {
    if (!activeGroup) return;
    toast.warning(`Keluar dari grup ${activeGroup.name}?`, {
      action: {
        label: "Keluar",
        onClick: () => {
          leaveGroup.mutate(activeGroup.id, {
            onSuccess: () => { setIsCreating(false); toast.success(`Berhasil keluar dari ${activeGroup.name}`); },
            onError: (err) => toast.error("Gagal keluar: " + parseProblem(err).message),
          });
        },
      },
      cancel: { label: "Batal", onClick: () => { } },
    });
  };

  const handleCreate = (data: { kind: string; title: string; content: string; targetGroupId?: string }) => {
    setFormError("");
    const target = data.targetGroupId || (activeGroup ? activeGroup.id : "");
    const onErr = (err: unknown) => {
      const msg = parseProblem(err).message || "Gagal membuat postingan.";
      setFormError(msg);
      toast.error(msg);
    };
    if (target) {
        createGroupThread.mutate({ groupId: target, kind: data.kind || "discussion", title: data.title, content: data.content }, {
          onSuccess: () => {
            setIsCreating(false);
            setSelectedThread(null);
            toast.success("Postingan berhasil diterbitkan di grup!");
            const tg = groups?.find((g) => g.id === target);
            if (tg) setSelectedSector(tg.slug);
          },
          onError: onErr,
        });
      } else {
        createHubThread.mutate({ kind: data.kind || "discussion", title: data.title, content: data.content }, {
          onSuccess: () => {
            setIsCreating(false);
            setSelectedThread(null);
            toast.success("Postingan berhasil diterbitkan ke publik!");
          },
          onError: onErr,
        });
      }
  };

    const handleDelete = (id: string) => {
      toast.warning("Hapus postingan ini secara permanen?", {
        action: {
          label: "Hapus",
          onClick: () => {
            deleteThread.mutate(id, {
              onSuccess: () => {
                if (selectedThread?.id === id) setSelectedThread(null);
                toast.success("Postingan berhasil dihapus");
              },
              onError: (err) => toast.error("Gagal menghapus: " + parseProblem(err).message),
            });
          },
        },
        cancel: { label: "Batal", onClick: () => { } },
      });
    };

    const handleSaveEdit = (data: { id: string; title: string; content: string }) => {
      updateThread.mutate(data, {
        onSuccess: () => {
          setEditingThread(null);
          if (selectedThread?.id === data.id) setSelectedThread((p) => p && { ...p, ...data });
        },
      });
    };

    const userInitials = (user?.full_name || "User").slice(0, 2).toUpperCase();

    return (
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl space-y-7">
        <CommunityHeader
          activeGroup={activeGroup} isMember={isMember} isCreating={isCreating} onToggleCreate={handleToggleCreate}
          onJoinGroup={handleJoinGroup} isJoining={joinGroup.isPending} onLeaveGroup={handleLeaveGroup} isLeaving={leaveGroup.isPending}
          kindFilter={kindFilter} onSelectKind={(k) => { setKindFilter(k); setSelectedThread(null); setIsCreating(false); }}
        />
        <SectoralGroups selectedGroupSlug={selectedSector} onSelectGroup={handleSelectGroup} />
        {selectedThread ? (
          <ThreadDetailView
            thread={selectedThread} onBack={() => setSelectedThread(null)} onSelectGroup={handleSelectGroup}
            currentUserId={user?.id} onEdit={(t) => setEditingThread(t)} onDelete={handleDelete}
          />
        ) : (
          <CommunityFeed
            userInitials={userInitials} activeGroup={activeGroup} isMember={isMember} isCreating={isCreating}
            onToggleCreate={handleToggleCreate} onJoinGroup={handleJoinGroup} isJoining={joinGroup.isPending}
            onLeaveGroup={handleLeaveGroup} isLeaving={leaveGroup.isPending} groups={groups} onSubmitThread={handleCreate}
            isPosting={createGroupThread.isPending || createHubThread.isPending} threads={filtered} isLoading={isLoading}
            onSelectThread={(t) => setSelectedThread(t)} onSelectGroup={handleSelectGroup} currentUserId={user?.id}
            onEdit={(t) => setEditingThread(t)} onDelete={handleDelete} isMyPosts={isMyPosts} formError={formError}
          />
        )}
        {editingThread && (
          <EditThreadModal
            thread={editingThread} isOpen={Boolean(editingThread)} onClose={() => setEditingThread(null)}
            onSave={handleSaveEdit} isLoading={updateThread.isPending}
          />
        )}
      </div>
    );
  }
