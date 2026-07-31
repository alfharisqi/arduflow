import { useEffect, useRef, useState } from 'react';

const previewSize = 320;
const outputSize = 384;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawCroppedImage(canvas, image, zoom, offset) {
  const context = canvas.getContext('2d');
  const size = canvas.width;
  const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = coverScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (size - width) / 2 + offset.x * (size / previewSize);
  const y = (size - height) / 2 + offset.y * (size / previewSize);

  context.clearRect(0, 0, size, size);
  context.save();
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, x, y, width, height);
  context.restore();
}

export function ProfileImageCropper({ source, onCancel, onApply }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setReady(false);
  }, [source]);

  useEffect(() => {
    if (!source) {
      return undefined;
    }

    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setReady(true);
    };
    image.src = source;

    return () => {
      imageRef.current = null;
    };
  }, [source]);

  useEffect(() => {
    if (!isReady || !canvasRef.current || !imageRef.current) {
      return;
    }

    drawCroppedImage(canvasRef.current, imageRef.current, zoom, offset);
  }, [isReady, offset, zoom]);

  if (!source) {
    return null;
  }

  function startDrag(event) {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offset,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event) {
    if (!dragRef.current) {
      return;
    }

    const nextX = dragRef.current.offset.x + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.offset.y + event.clientY - dragRef.current.y;

    setOffset({
      x: clamp(nextX, -previewSize / 2, previewSize / 2),
      y: clamp(nextY, -previewSize / 2, previewSize / 2),
    });
  }

  function endDrag(event) {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function applyCrop() {
    if (!imageRef.current) {
      return;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    drawCroppedImage(outputCanvas, imageRef.current, zoom, offset);
    onApply(outputCanvas.toDataURL('image/png'));
  }

  return (
    <div className="profile-cropper" role="dialog" aria-modal="true" aria-label="Crop foto profil">
      <div className="profile-cropper__panel">
        <h2>Crop foto profil</h2>
        <p>Geser gambar dan atur zoom sampai wajah berada di tengah lingkaran.</p>
        <div
          className="profile-cropper__canvas-wrap"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <canvas ref={canvasRef} width={previewSize} height={previewSize} />
        </div>
        <label className="profile-cropper__zoom">
          <span>Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <div className="profile-cropper__actions">
          <button className="profile-cropper__button profile-cropper__button--secondary" type="button" onClick={onCancel}>
            Batal
          </button>
          <button className="profile-cropper__button profile-cropper__button--primary" type="button" onClick={applyCrop}>
            Gunakan Foto
          </button>
        </div>
      </div>
    </div>
  );
}
