"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Editor, { OnMount, loader } from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { Awareness } from "y-protocols/awareness";
import type { editor } from "monaco-editor";

// Define user colors for cursor presence
const CURSOR_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
  "#F7DC6F", // Gold
  "#BB8FCE", // Purple
  "#85C1E9", // Sky
];

export interface CollaborativeEditorProps {
  doc: Y.Doc;
  awareness: Awareness;
  language: string;
  userId: string;
  userName?: string;
  userColor?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  isSynced?: boolean; // Add this to know if provider has synced
}

export function CollaborativeEditor({
  doc,
  awareness,
  language,
  userId,
  userName = "Anonymous",
  userColor,
  defaultValue = "",
  onChange,
  readOnly = false,
  isSynced = false,
}: CollaborativeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Get a consistent color for this user
  const color =
    userColor || CURSOR_COLORS[userId.charCodeAt(0) % CURSOR_COLORS.length];

  // Set up awareness state for this user
  useEffect(() => {
    awareness.setLocalStateField("user", {
      id: userId,
      name: userName,
      color: color,
    });

    return () => {
      awareness.setLocalStateField("user", null);
    };
  }, [awareness, userId, userName, color]);

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      // Get or create the shared text type
      const yText = doc.getText("monaco");

      // Smart initialization: wait for sync if we expect there to be content
      const checkAndInitialize = () => {
        const hasContent = yText.length > 0;
        const shouldInitialize = !hasContent && defaultValue;

        if (shouldInitialize) {
          console.log("[CollaborativeEditor] Initializing with default value (length:", defaultValue.length, ")");
          yText.insert(0, defaultValue);
        } else if (hasContent) {
          console.log("[CollaborativeEditor] Using existing Y.js content, length:", yText.length);
        } else {
          console.log("[CollaborativeEditor] Document is empty, no default value provided");
        }
      };

      // If synced, initialize immediately; otherwise wait for sync
      if (isSynced || !defaultValue) {
        checkAndInitialize();
      } else {
        // Wait up to 1 second for sync before initializing with default
        console.log("[CollaborativeEditor] Waiting for sync before initialization...");
        setTimeout(checkAndInitialize, 1000);
      }

      // Create Monaco binding
      bindingRef.current = new MonacoBinding(
        yText,
        editor.getModel()!,
        new Set([editor]),
        awareness
      );

      // Add custom styles for remote cursors
      const styleSheet = document.createElement("style");
      styleSheet.textContent = `
        .yRemoteSelection {
          opacity: 0.3;
        }
        .yRemoteSelectionHead {
          position: absolute;
          border-left: 2px solid;
          height: 100%;
          box-sizing: border-box;
        }
        .yRemoteSelectionHead::after {
          content: attr(data-name);
          position: absolute;
          top: -1.4em;
          left: -2px;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          white-space: nowrap;
          font-family: sans-serif;
        }
      `;
      document.head.appendChild(styleSheet);

      setIsEditorReady(true);

      // Set up change listener
      editor.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(editor.getValue());
        }
      });
    },
    [doc, awareness, defaultValue, onChange]
  );

  // Clean up binding on unmount
  useEffect(() => {
    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, []);

  // Update language when it changes
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      const model = editorRef.current.getModel();
      if (model) {
        loader.init().then((monaco) => {
          monaco.editor.setModelLanguage(model, language);
        });
      }
    }
  }, [language, isEditorReady]);

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-slate-700">
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "var(--font-geist-mono), monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 16, bottom: 16 },
          cursorBlinking: "smooth",
          smoothScrolling: true,
          contextmenu: true,
          folding: true,
          lineDecorationsWidth: 10,
          renderLineHighlight: "all",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-slate-900">
            <div className="flex items-center gap-2 text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              Loading editor...
            </div>
          </div>
        }
      />
    </div>
  );
}
