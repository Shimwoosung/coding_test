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
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        tabSize: 4,
        automaticLayout: true,
        fontFamily: 'Consolas, "Courier New", monospace',
        renderWhitespace: 'selection',
        smoothScrolling: true,
      }}
    />
  );
}
