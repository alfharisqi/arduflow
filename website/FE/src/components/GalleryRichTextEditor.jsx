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
<<<<<<< HEAD
}
=======
}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
