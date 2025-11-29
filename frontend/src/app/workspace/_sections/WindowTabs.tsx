import EmptyPage from "@/components/EmptyPage";
import { useWindowTabsStore } from "@/store/windowsStore";
import { XMarkIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";

export default function WindowTabs() {
  const { tabs, activeTabId, setActiveTabId, removeTab, moveTab } =
    useWindowTabsStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [previewTabs, setPreviewTabs] = useState<typeof tabs | null>(null);
  const [splitView, setSplitView] = useState<{
    left: (typeof tabs)[0];
    right: (typeof tabs)[0];
    leftActiveId?: string;
    rightActiveId?: string;
  } | null>(null);

  const getTabs = () => previewTabs ?? tabs;

  const handleClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    removeTab(tabId);
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);

  const handleDragEnd = () => {
    if (previewTabs && draggedIdx !== null) {
      // 计算最终位置
      const finalIdx = previewTabs.findIndex(
        (t) => t.id === tabs[draggedIdx].id
      );
      if (finalIdx !== draggedIdx) moveTab(draggedIdx, finalIdx);
    }
    setDraggedIdx(null);
    setPreviewTabs(null);
  };

  const handleDragEnter = (overIdx: number) => {
    if (draggedIdx === null || draggedIdx === overIdx) return;
    const newTabs = [...getTabs()];
    const [draggedTab] = newTabs.splice(draggedIdx, 1);
    newTabs.splice(overIdx, 0, draggedTab);
    setPreviewTabs(newTabs);
    setDraggedIdx(overIdx);
  };

  // 拖拽到主区域时，判断是否需要分屏
  const handleMainDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // console.log("draggedIdx", draggedIdx);
    console.log("drag over main area", e.clientX, window.innerWidth, splitView);
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIdx === null) return;
    const x = e.clientX;
    const width = window.innerWidth;
    if (x < width / 4) {
      // 鼠标在左侧 1/4 区域
      const leftTab = getTabs()[draggedIdx];
      const rightTab = activeTab;
      if (leftTab && rightTab) {
        console.log("分屏激活", leftTab, rightTab);
        setSplitView({ left: leftTab, right: rightTab });
      }
    } else {
      setSplitView(null);
    }
  };

  // 拖拽释放时，清除分屏状态
  const handleMainDrop = () => {
    setDraggedIdx(null);
    setPreviewTabs(null);
  };

  return (
    <div className="select-none flex flex-col h-full w-full min-h-0">
      {/* Tab导航条 */}
      <div className="absolute w-full left-0 top-0 items-center bg-gray-08 backdrop-blur-xs z-5 flex">
        {getTabs().map((tab, idx) => (
          <div
            key={tab.id}
            className={`flex items-center justify-center px-5 py-2 cursor-pointer text-sm
              ${
                tab.id === activeTabId
                  ? "bg-gray-07 text-white"
                  : "bg-gray-08 text-gray-04 hover:!text-white"
              }
            `}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", "tab");
              e.dataTransfer.effectAllowed = "move";
              handleDragStart(idx);
            }}
            // onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => handleDragEnter(idx)}
            // onDrop={handleDragEnd}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.title}
            <button
              className="ml-2 text-white hover:text-red-500 hover:cursor-pointer"
              onClick={(e) => handleClose(e, tab.id)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
        {getTabs().length === 0 && <></>}
      </div>

      {/* 内容区域 */}
      <div
        className="w-full h-full flex-1 bg-black relative flex"
        onDragOver={handleMainDragOver}
        onDrop={handleMainDrop}
      >
        {splitView?.left && splitView?.right ? (
          <>
            <div className="flex flex-row w-full h-full">
              <div className="w-1/2 h-full border-r border-white/10 overflow-auto">
                {typeof splitView.left.content === "function"
                  ? splitView.left.content()
                  : splitView.left.content}
              </div>
              <div className="w-1/2 h-full overflow-auto">
                {typeof splitView.right.content === "function"
                  ? splitView.right.content()
                  : splitView.right.content}
              </div>
            </div>
          </>
        ) : activeTab ? (
          <div className="w-full h-full">
            {typeof activeTab.content === "function"
              ? activeTab.content()
              : activeTab.content}
          </div>
        ) : (
          <EmptyPage />
        )}
      </div>
    </div>
  );
}
