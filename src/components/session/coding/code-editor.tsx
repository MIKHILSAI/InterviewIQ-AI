import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { editor as MonacoEditorType } from 'monaco-editor';
import type { Monaco } from '@monaco-editor/react';
import { CodingLanguage } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';
import { Skeleton } from '@/components/ui/skeleton';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  highlightLine,
}: {
  value: string;
  onChange: (value: string) => void;
  language: CodingLanguage;
  readOnly?: boolean;
  highlightLine?: number;
}) {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationIds = useRef<string[]>([]);
  const [editorMounted, setEditorMounted] = useState(false);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !monacoRef.current) return;
    decorationIds.current = editor.deltaDecorations(
      decorationIds.current,
      highlightLine && highlightLine > 0
        ? [{
            range: new monacoRef.current.Range(highlightLine, 1, highlightLine, 1),
            options: {
              isWholeLine: true,
              className: 'bg-warning/20',
              glyphMarginClassName: 'bg-warning',
            },
          }]
        : []
    );
    if (highlightLine && highlightLine > 0) {
      editor.revealLineInCenter(highlightLine);
    }
  }, [highlightLine]);

  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (model && model.getValue() !== value) {
      model.setValue(value);
    }
  }, [value]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly, domReadOnly: readOnly });
  }, [readOnly]);

  return (
    <div className="relative h-[360px] min-h-[360px] w-full">
      <Suspense fallback={<Skeleton className="absolute inset-0 rounded-xl" />}>
        <MonacoEditor
          height="360px"
          language={language}
          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
          value={value}
          onChange={(next) => onChange(next || '')}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            if (editor.getValue() !== value) {
              editor.setValue(value);
            }
            if (highlightLine && highlightLine > 0) {
              editor.revealLineInCenter(highlightLine);
            }
            setEditorMounted(true);
          }}
          options={{
            readOnly,
            domReadOnly: readOnly,
            ariaLabel: readOnly ? 'Submitted code, read only' : 'Code editor. Type your solution here.',
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 4,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            glyphMargin: true,
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          }}
        />
      </Suspense>
      {!editorMounted && (
        <textarea
          aria-label={readOnly ? 'Code scaffold, read only' : 'Code editor. Type your solution here.'}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          readOnly={readOnly}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 h-full w-full resize-none overflow-auto bg-background p-3 font-mono text-sm leading-6 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      )}
    </div>
  );
}
