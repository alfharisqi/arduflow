import { useEffect, useRef, useState } from 'react';

const previewWidth = 360;
const previewHeight = 203;
const outputWidth = 1280;
const outputHeight = 720;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawCroppedImage(canvas, image, zoom, offset) {
  const context = canvas.getContext('2d');
  const coverScale = Math.max(
    canvas.width / image.naturalWidth,
    canvas.height / image.naturalHeight,
  );
  const scale = coverScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (canvas.width - width) / 2 + offset.x * (canvas.width / previewWidth);
  const y = (canvas.height - height) / 2 + offset.y * (canvas.height / previewHeight);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, width, height);
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

function createCompressedJpeg(canvas, baseName) {
  const name = baseName.replace(/\.[^.]+$/, '') || 'workshop-cover';
  const qualities = [0.82, 0.72, 0.62, 0.52];
  let dataUrl = '';
  let file = null;

  for (const quality of qualities) {
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    file = dataUrlToFile(dataUrl, `${name}-cropped.jpg`);

    if (file.size <= 4 * 1024 * 1024) {
      break;
    }
  }

  return { dataUrl, file };
}

export function WorkshopImageCropper({ source, fileName = 'workshop-cover.png', onCancel, onApply }) {
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
      x: clamp(nextX, -previewWidth / 2, previewWidth / 2),
      y: clamp(nextY, -previewHeight / 2, previewHeight / 2),
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
    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;
    drawCroppedImage(outputCanvas, imageRef.current, zoom, offset);

    onApply(createCompressedJpeg(outputCanvas, fileName));
  }

  return (
    <div className="profile-cropper workshop-cropper" role="dialog" aria-modal="true" aria-label="Crop gambar workshop">
      <div className="profile-cropper__panel workshop-cropper__panel">
        <h2>Crop Gambar Workshop</h2>
        <p>Geser gambar dan atur zoom sampai area sampul terlihat pas.</p>
        <div
          className="profile-cropper__canvas-wrap workshop-cropper__canvas-wrap"
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <canvas ref={canvasRef} width={previewWidth} height={previewHeight} />
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
            Gunakan Gambar
          </button>
        </div>
      </div>
    </div>
  );
}
