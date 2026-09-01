import { useEffect, useId, useRef } from 'react';

const TINYMCE_CDN_URL = 'https://cdn.jsdelivr.net/npm/tinymce@7/tinymce.min.js';

let tinymceScriptPromise = null;

const wrapStyles = {
  inline: 'display:inline-block;float:none;margin:0 4px;position:static;max-width:100%;height:auto;',
  squareLeft: 'float:left;margin:6px 18px 12px 0;max-width:48%;height:auto;',
  squareRight: 'float:right;margin:6px 0 12px 18px;max-width:48%;height:auto;',
  tightLeft: 'float:left;margin:2px 12px 8px 0;max-width:48%;height:auto;shape-margin:6px;',
  tightRight: 'float:right;margin:2px 0 8px 12px;max-width:48%;height:auto;shape-margin:6px;',
  topBottom: 'display:block;float:none;margin:16px auto;max-width:100%;height:auto;clear:both;',
  behind: 'position:absolute;z-index:0;opacity:.55;max-width:55%;height:auto;',
  front: 'position:relative;z-index:10;float:left;margin:6px 18px 12px 0;max-width:48%;height:auto;',
  center: 'display:block;float:none;margin:16px auto;max-width:70%;height:auto;clear:both;',
};

function loadTinyMCE() {
  if (window.tinymce) {
    return Promise.resolve(window.tinymce);
  }

  if (!tinymceScriptPromise) {
    tinymceScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TINYMCE_CDN_URL;
      script.referrerPolicy = 'origin';
      script.onload = () => resolve(window.tinymce);
      script.onerror = () => reject(new Error('TinyMCE gagal dimuat.'));
      document.head.appendChild(script);
    });
  }

  return tinymceScriptPromise;
}

function selectedImage(editor) {
  const node = editor.selection.getNode();

  if (node?.nodeName === 'IMG') {
    return node;
  }

  return editor.dom.getParent(node, 'img') || null;
}

function applyWrap(editor, key) {
  const img = selectedImage(editor);

  if (!img) {
    editor.notificationManager.open({
      text: 'Klik gambar di dalam editor terlebih dahulu.',
      type: 'warning',
      timeout: 2500,
    });
    return;
  }

  editor.dom.setAttrib(img, 'style', wrapStyles[key]);
  editor.dom.setAttrib(img, 'data-text-wrap', key);

  if (key === 'topBottom' || key === 'center' || key === 'inline') {
    editor.dom.setStyle(img, 'clear', key === 'inline' ? '' : 'both');
  }

  editor.nodeChanged();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getReferenceHtml(item) {
  const kindLabel = item.kind === 'node' ? 'Node' : 'Komponen';
  const title = item.name || item.label || kindLabel;
  const meta = [item.category, item.value ? `Value: ${item.value}` : '']
    .filter(Boolean)
    .join(' | ');
  const description = item.description || item.specification || '';

  return (
    '<span class="project-step-reference" contenteditable="false" data-project-reference="' +
    escapeHtml(item.kind || 'component') +
    '">' +
    '<strong>' +
    escapeHtml(kindLabel) +
    ': ' +
    escapeHtml(title) +
    '</strong>' +
    (meta ? '<small>' + escapeHtml(meta) + '</small>' : '') +
    (description ? '<em>' + escapeHtml(description) + '</em>' : '') +
    '</span>&nbsp;'
  );
}

function registerProjectReferenceTools(editor, referencesRef) {
  editor.ui.registry.addMenuButton('projectrefs', {
    text: 'Sematkan Item',
    tooltip: 'Sematkan komponen atau node yang sudah ditambahkan',
    fetch: (callback) => {
      const references = Array.isArray(referencesRef.current) ? referencesRef.current : [];

      if (!references.length) {
        callback([
          {
            type: 'menuitem',
            text: 'Tambahkan komponen atau node terlebih dahulu',
            enabled: false,
          },
        ]);
        return;
      }

      const groups = [
        ['component', 'Komponen'],
        ['node', 'Node'],
      ].map(([kind, label]) => ({
        kind,
        label,
        items: references.filter((item) => item.kind === kind),
      }));

      callback(groups
        .filter((group) => group.items.length)
        .map((group) => ({
          type: 'nestedmenuitem',
          text: group.label,
          getSubmenuItems: () => group.items.map((item) => ({
            type: 'menuitem',
            text: item.value ? `${item.name} (${item.value})` : item.name,
            onAction: () => editor.insertContent(getReferenceHtml(item)),
          })),
        })));
    },
  });
}

function registerCustomTools(editor, referencesRef, enableProjectReferences) {
  editor.ui.registry.addMenuButton('textwrap', {
    text: 'Text Wrap',
    tooltip: 'Atur text wrapping gambar',
    icon: 'align-left',
    fetch: (callback) => {
      callback([
        {
          type: 'menuitem',
          text: 'In Line with Text',
          icon: 'image',
          onAction: () => applyWrap(editor, 'inline'),
        },
        { type: 'separator' },
        {
          type: 'nestedmenuitem',
          text: 'With Text Wrapping',
          icon: 'align-left',
          getSubmenuItems: () => [
            { type: 'menuitem', text: 'Square - Left', onAction: () => applyWrap(editor, 'squareLeft') },
            { type: 'menuitem', text: 'Square - Right', onAction: () => applyWrap(editor, 'squareRight') },
            { type: 'menuitem', text: 'Tight - Left', onAction: () => applyWrap(editor, 'tightLeft') },
            { type: 'menuitem', text: 'Tight - Right', onAction: () => applyWrap(editor, 'tightRight') },
            { type: 'menuitem', text: 'Top and Bottom', onAction: () => applyWrap(editor, 'topBottom') },
            { type: 'menuitem', text: 'Behind Text', onAction: () => applyWrap(editor, 'behind') },
            { type: 'menuitem', text: 'In Front of Text', onAction: () => applyWrap(editor, 'front') },
            { type: 'menuitem', text: 'Centered', onAction: () => applyWrap(editor, 'center') },
          ],
        },
        { type: 'separator' },
        {
          type: 'menuitem',
          text: 'Reset Image Layout',
          icon: 'remove',
          onAction: () => {
            const img = selectedImage(editor);

            if (!img) {
              editor.notificationManager.open({
                text: 'Klik gambar terlebih dahulu.',
                type: 'warning',
                timeout: 2500,
              });
              return;
            }

            editor.dom.setAttrib(img, 'style', '');
            editor.dom.setAttrib(img, 'data-text-wrap', '');
            editor.nodeChanged();
          },
        },
      ]);
    },
  });

  editor.ui.registry.addButton('arduinocode', {
    text: 'Arduino Code',
    tooltip: 'Sisipkan kode Arduino/C++',
    icon: 'sourcecode',
    onAction: () => {
      editor.windowManager.open({
        title: 'Tambahkan Kode Arduino',
        size: 'large',
        body: {
          type: 'panel',
          items: [
            {
              type: 'selectbox',
              name: 'language',
              label: 'Bahasa',
              items: [
                { text: 'Arduino / C++', value: 'cpp' },
                { text: 'C', value: 'c' },
                { text: 'Plain Text', value: 'none' },
              ],
            },
            {
              type: 'input',
              name: 'filename',
              label: 'Nama file (opsional)',
              placeholder: 'contoh: blink.ino',
            },
            {
              type: 'textarea',
              name: 'code',
              label: 'Kode',
              placeholder: `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}`,
            },
          ],
        },
        buttons: [
          { type: 'cancel', text: 'Batal' },
          { type: 'submit', text: 'Tambahkan Kode', buttonType: 'primary' },
        ],
        initialData: {
          language: 'cpp',
          filename: '',
          code: '',
        },
        onSubmit: (api) => {
          const data = api.getData();
          const code = String(data.code || '').trim();

          if (!code) {
            editor.notificationManager.open({
              text: 'Kode Arduino belum diisi.',
              type: 'warning',
              timeout: 2500,
            });
            return;
          }

          const languageClass =
            data.language === 'cpp' ? 'language-cpp' : data.language === 'c' ? 'language-c' : '';
          const filename = String(data.filename || '').trim() || 'Arduino / C++';
          const html =
            '<div class="arduino-code-block" contenteditable="false">' +
            '<div class="arduino-code-header">' +
            '<span>' +
            escapeHtml(filename) +
            '</span><span>Arduino Code</span></div>' +
            '<pre><code class="' +
            languageClass +
            '">' +
            escapeHtml(code) +
            '</code></pre></div><p><br></p>';

          editor.insertContent(html);
          api.close();
        },
      });
    },
  });

  if (enableProjectReferences) {
    registerProjectReferenceTools(editor, referencesRef);
  }
}

const editorContentStyle = `
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;
    line-height: 1.7;
    max-width: 960px;
    margin: 24px auto;
    padding: 0 20px 80px;
    min-height: 320px;
    position: relative;
  }
  p { margin: 0 0 14px; }
  img { max-width: 100%; height: auto; }
  img[data-text-wrap] { outline-offset: 3px; }
  img[data-text-wrap="behind"] { pointer-events: auto; }
  .arduino-code-block {
    position: relative;
    margin: 18px 0;
    border: 1px solid #d1d5db;
    border-radius: 10px;
    overflow: hidden;
    background: #f8fafc;
  }
  .arduino-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 12px;
    border-bottom: 1px solid #d1d5db;
    background: #eef2f7;
    color: #334155;
    font-size: 13px;
    font-weight: 700;
  }
  .arduino-code-block pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;
    background: #ffffff;
  }
  .arduino-code-block code {
    font-family: Consolas, Monaco, "Courier New", monospace;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre;
  }
  .project-step-reference {
    display: inline-grid;
    max-width: 100%;
    margin: 2px 4px;
    padding: 7px 9px;
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    background: #eff6ff;
    color: #1e3a8a;
    vertical-align: middle;
    line-height: 1.35;
  }
  .project-step-reference strong {
    font-size: 13px;
    font-weight: 800;
  }
  .project-step-reference small,
  .project-step-reference em {
    color: #475569;
    font-size: 12px;
    font-style: normal;
  }
  .mce-content-body::after {
    content: "";
    display: block;
    clear: both;
  }
`;

export function TinyMCEEditor({
  value,
  onChange,
  height = 420,
  className = '',
  ariaLabel = 'Editor teks',
  disabled = false,
  projectReferences = [],
  enableProjectReferences = false,
}) {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const valueRef = useRef(value || '');
  const onChangeRef = useRef(onChange);
  const referencesRef = useRef(projectReferences);
  const generatedId = useId().replace(/:/g, '');
  const editorId = `tinymce-${generatedId}`;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    referencesRef.current = projectReferences;
  }, [projectReferences]);

  useEffect(() => {
    valueRef.current = value || '';

    if (editorRef.current && editorRef.current.getContent() !== valueRef.current) {
      editorRef.current.setContent(valueRef.current);
    }
  }, [value]);

  useEffect(() => {
    let isCancelled = false;

    loadTinyMCE().then((tinymce) => {
      if (isCancelled || !textareaRef.current) {
        return;
      }

      const toolbar =
        'undo redo | blocks | bold italic underline strikethrough | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | link image media table | ' +
        `textwrap arduinocode${enableProjectReferences ? ' projectrefs' : ''} | removeformat | code preview fullscreen`;

      tinymce.init({
        target: textareaRef.current,
        height,
        menubar: 'file edit view insert format tools table help',
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          'anchor',
          'searchreplace',
          'visualblocks',
          'code',
          'fullscreen',
          'insertdatetime',
          'media',
          'table',
          'help',
          'wordcount',
        ],
        toolbar,
        automatic_uploads: false,
        image_title: true,
        file_picker_types: 'image',
        paste_data_images: true,
        readonly: disabled,
        content_style: editorContentStyle,
        file_picker_callback: (callback, inputValue, meta) => {
          if (meta.filetype !== 'image') return;

          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif';

          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              callback(reader.result, {
                alt: file.name,
                title: file.name,
              });
            };
            reader.readAsDataURL(file);
          };

          input.click();
        },
        setup: (editor) => {
          editorRef.current = editor;
          registerCustomTools(editor, referencesRef, enableProjectReferences);

          editor.on('init', () => {
            editor.getContainer()?.setAttribute('aria-label', ariaLabel);
            editor.setContent(valueRef.current || '');
          });

          editor.on('change input undo redo setcontent', () => {
            const html = editor.getContent();
            valueRef.current = html;
            onChangeRef.current(html);
          });
        },
      });
    });

    return () => {
      isCancelled = true;

      if (editorRef.current) {
        editorRef.current.remove();
        editorRef.current = null;
      }
    };
  }, [ariaLabel, disabled, enableProjectReferences, height]);

  return (
    <div className={['tinymce-editor', className].filter(Boolean).join(' ')}>
      <textarea id={editorId} ref={textareaRef} defaultValue={value || ''} aria-label={ariaLabel} />
    </div>
  );
}
