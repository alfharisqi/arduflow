import { TinyMCEEditor } from './TinyMCEEditor.jsx';

export function GalleryRichTextEditor({ value, onChange, hasError }) {
  return (
    <div className={`admin-gallery-upload-editor${hasError ? ' is-invalid' : ''}`}>
      <TinyMCEEditor
        value={value}
        onChange={onChange}
        height={360}
        ariaLabel="Deskripsi kegiatan"
      />
    </div>
  );
}
