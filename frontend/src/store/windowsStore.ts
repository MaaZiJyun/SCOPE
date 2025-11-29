import { create } from "zustand";
import { ReactNode } from "react";

export interface WindowTab {
  id: string;
  title: string;
  content: ReactNode | (() => ReactNode);
}

export interface WindowGroup {
  id: number;
  tabs: WindowTab[];
}

interface WindowTabsState {
  tabs: WindowTab[]; // will be removed in the future, use groups instead
  groups: WindowGroup[];
  activeGroupId: number;
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: (tab: WindowTab) => void;
  removeTab: (tabId: string) => void;
  initialize: (initialTabs: WindowTab[]) => void;
  moveTab: (fromIdx: number, toIdx: number) => void;
}

export const useWindowTabsStore = create<WindowTabsState>((set, get) => ({
  groups: [],
  tabs: [],
  activeTabId: "",
  activeGroupId: 0,

  setActiveTabId: (id: string) => set({ activeTabId: id }),

  addGroup: () => {
    const { groups } = get();
    const group: WindowGroup = {
      id: groups.length + 1, // Unique ID based on array length
      tabs: [],
    };
    set({
      groups: [...groups, group],
      activeGroupId: group.id,
      activeTabId: group.tabs[0]?.id ?? "",
    });
  },

  removeGroup: (groupId: number) => {
    const { groups, activeGroupId } = get();
    const newGroups = groups.filter((g) => g.id !== groupId);
    const isActiveRemoved = activeGroupId === groupId;

    set({
      groups: newGroups,
      activeGroupId: isActiveRemoved ? newGroups[0]?.id ?? "" : activeGroupId,
      activeTabId: "",
    });
  },

  addTab: (tab: WindowTab) => {
    const { tabs } = get();
    const exists = tabs.some((t) => t.id === tab.id);
    if (!exists) {
      set({
        tabs: [...tabs, tab],
        activeTabId: tab.id,
      });
    } else {
      set({ activeTabId: tab.id });
    }
  },

  removeTab: (tabId: string) => {
    const { tabs, activeTabId } = get();
    const newTabs = tabs.filter((t) => t.id !== tabId);
    const isActiveRemoved = activeTabId === tabId;

    set({
      tabs: newTabs,
      activeTabId: isActiveRemoved ? newTabs[0]?.id ?? "" : activeTabId,
    });
  },

  moveTab: (fromIdx: number, toIdx: number) => {
    const { tabs } = get();
    if (fromIdx < 0 || fromIdx >= tabs.length || toIdx < 0 || toIdx >= tabs.length) return;

    const newTabs = [...tabs];
    const [movedTab] = newTabs.splice(fromIdx, 1);
    newTabs.splice(toIdx, 0, movedTab);

    set({ tabs: newTabs });
  },

  initialize: (initialTabs: WindowTab[]) => {
    set({
      tabs: initialTabs,
      activeTabId: initialTabs[0]?.id ?? "",
    });
  },
}));
