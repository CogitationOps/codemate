"use client";

import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Plus, Settings2, Sparkles } from "lucide-react";
import { Workspace } from "@/backend/types";

type AppSidebarProps = {
  activeWorkspaceId: string;
  onSelectWorkspace: (id: string) => void;
};

export function AppSidebar({
  activeWorkspaceId,
  onSelectWorkspace,
}: AppSidebarProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsUrl, setNewWsUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkspaces(data);
      }
    } catch (e) {
      console.error("Failed to fetch workspaces", e);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    const interval = setInterval(() => {
      // Poll every 5 seconds if any workspace is indexing
      if (workspaces.some((ws) => ws.status === "indexing")) {
        fetchWorkspaces();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [workspaces]);

  const handleCreate = async () => {
    if (!newWsUrl) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/workspace/create", {
        method: "POST",
        body: JSON.stringify({ name: newWsName, repoUrl: newWsUrl }),
      });
      const data = await res.json();
      if (data.id) {
        setWorkspaces([data, ...workspaces]);
        onSelectWorkspace(data.id);
        setIsDialogOpen(false);
        setNewWsName("");
        setNewWsUrl("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Codemate">
              <Sparkles className="size-4 text-primary" />
              <span className="font-semibold text-lg tracking-tight">Codemate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New Workspace">
                  <Plus className="size-4" />
                  <span>Create Workspace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Link a Repository</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Provide a GitHub URL to index your codebase.
                </p>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workspace Name</label>
                  <Input 
                    placeholder="My Feature Branch" 
                    value={newWsName} 
                    onChange={e => setNewWsName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GitHub URL</label>
                  <Input 
                    placeholder="https://github.com/..." 
                    value={newWsUrl} 
                    onChange={e => setNewWsUrl(e.target.value)} 
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreate} 
                  disabled={isCreating || !newWsUrl}
                >
                  {isCreating ? <Loader2 className="animate-spin mr-2 size-4" /> : null}
                  Start Indexing
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaces.map((ws) => (
                <SidebarMenuItem key={ws.id}>
                  <SidebarMenuButton
                    isActive={ws.id === activeWorkspaceId}
                    onClick={() => onSelectWorkspace(ws.id)}
                    tooltip={ws.name}
                  >
                    {ws.status === "indexing" ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : (
                      <MessageSquare className="size-4" />
                    )}
                    <span className="truncate">{ws.name}</span>
                    {ws.status === "indexing" && (
                      <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase font-bold">
                        Indexing
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings2 className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
