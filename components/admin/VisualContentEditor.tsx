"use client";

import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Strikethrough,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type VisualContentEditorProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minRows?: number;
};

type CommandButton = {
  label: string;
  icon: typeof Bold;
  command: string;
  value?: string;
};

const blockCommands: CommandButton[] = [
  { label: "Đoạn văn", icon: Pilcrow, command: "formatBlock", value: "p" },
  { label: "Tiêu đề 1", icon: Heading1, command: "formatBlock", value: "h2" },
  { label: "Tiêu đề 2", icon: Heading2, command: "formatBlock", value: "h3" },
  { label: "Trích dẫn", icon: Quote, command: "formatBlock", value: "blockquote" },
];

const inlineCommands: CommandButton[] = [
  { label: "Đậm", icon: Bold, command: "bold" },
  { label: "Nghiêng", icon: Italic, command: "italic" },
  { label: "Gạch ngang", icon: Strikethrough, command: "strikeThrough" },
  { label: "Danh sách", icon: List, command: "insertUnorderedList" },
  { label: "Danh sách số", icon: ListOrdered, command: "insertOrderedList" },
  { label: "Đường phân cách", icon: Minus, command: "insertHorizontalRule" },
];

function normalizeHtml(html: string) {
  return html
    .replace(/<div><br><\/div>/g, "")
    .replace(/<div>/g, "<p>")
    .replace(/<\/div>/g, "</p>")
    .trim();
}

export function VisualContentEditor({ name, value, onChange, placeholder, minRows = 13 }: VisualContentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");

  useEffect(() => {
    if (mode === "visual" && editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [mode, value]);

  function syncFromEditor() {
    const html = normalizeHtml(editorRef.current?.innerHTML ?? "");
    onChange(html);
  }

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncFromEditor();
  }

  function addLink() {
    const url = window.prompt("Nhập URL liên kết");
    if (!url) return;
    runCommand("createLink", url);
  }

  return (
    <div className="visual-editor-shell">
      <input type="hidden" name={name} value={value} />
      <div className="visual-toolbar" aria-label="Thanh công cụ soạn thảo">
        {blockCommands.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} type="button" title={item.label} onClick={() => runCommand(item.command, item.value)}>
              <Icon size={17} strokeWidth={1.9} />
            </button>
          );
        })}
        <span className="toolbar-divider" />
        {inlineCommands.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} type="button" title={item.label} onClick={() => runCommand(item.command, item.value)}>
              <Icon size={17} strokeWidth={1.9} />
            </button>
          );
        })}
        <button type="button" title="Chèn liên kết" onClick={addLink}>
          <Link2 size={17} strokeWidth={1.9} />
        </button>
        <span className="toolbar-spacer" />
        <button type="button" title={mode === "visual" ? "Xem HTML" : "Soạn trực quan"} onClick={() => setMode(mode === "visual" ? "html" : "visual")}>
          {mode === "visual" ? <Code2 size={17} strokeWidth={1.9} /> : <Eye size={17} strokeWidth={1.9} />}
        </button>
      </div>

      {mode === "visual" ? (
        <div
          ref={editorRef}
          className="visual-editor-area article-content"
          contentEditable
          data-placeholder={placeholder}
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          style={{ minHeight: `${minRows * 28}px` }}
          suppressContentEditableWarning
        />
      ) : (
        <textarea
          className="visual-html-source"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={minRows}
          placeholder="<p>Nội dung HTML...</p>"
        />
      )}
    </div>
  );
}
