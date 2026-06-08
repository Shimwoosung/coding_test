import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function CodeEditor({ value, onChange }: Props) {
  return (
    <Editor
      height="100%"
      defaultLanguage="cpp"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      options={{
        fontSize: 15,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 4,
        automaticLayout: true,
        fontFamily: 'Consolas, "Courier New", monospace',
        renderWhitespace: 'selection',
        smoothScrolling: true,
        mouseWheelZoom: true, // Ctrl + 마우스휠로 글씨 크기 확대/축소
        scrollbar: { vertical: 'auto', horizontal: 'auto' },
      }}
    />
  );
}
