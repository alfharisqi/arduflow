import { useEffect, useRef, useState } from 'react';

<<<<<<< HEAD
const previewWidth = 640;
const previewHeight = 360;

=======
const previewWidth = 360;
const previewHeight = 203;
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
const outputWidth = 1280;
const outputHeight = 720;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawCroppedImage(canvas, image, zoom, offset) {
  const context = canvas.getContext('2d');
<<<<<<< HEAD

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  const coverScale = Math.max(
    canvas.width / image.naturalWidth,
    canvas.height / image.naturalHeight,
  );
<<<<<<< HEAD

  const scale = coverScale * zoom;

  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  const x =
    (canvas.width - width) / 2 +
    offset.x * (canvas.width / previewWidth);

  const y =
    (canvas.height - height) / 2 +
    offset.y * (canvas.height / previewHeight);

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.drawImage(
    image,
    x,
    y,
    width,
    height,
  );
=======
  const scale = coverScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = (canvas.width - width) / 2 + offset.x * (canvas.width / previewWidth);
  const y = (canvas.height - height) / 2 + offset.y * (canvas.height / previewHeight);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, width, height);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
}

function dataUrlToFile(dataUrl, fileName) {
  const [header, data] = dataUrl.split(',');
<<<<<<< HEAD

  const mimeType =
    header.match(/data:([^;]+)/)?.[1] ||
    'image/jpeg';

  const binary = atob(data);

=======
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png';
  const binary = atob(data);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

<<<<<<< HEAD
  return new File(
    [bytes],
    fileName,
    {
      type: mimeType,
      lastModified: Date.now(),
    },
  );
}

function createCompressedJpeg(canvas, baseName) {
  const name =
    baseName.replace(/\.[^.]+$/, '') ||
    'gallery-cover';

  const qualities = [
    0.82,
    0.72,
    0.62,
    0.52,
  ];

=======
  return new File([bytes], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

function createCompressedJpeg(canvas, baseName) {
  const name = baseName.replace(/\.[^.]+$/, '') || 'workshop-cover';
  const qualities = [0.82, 0.72, 0.62, 0.52];
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  let dataUrl = '';
  let file = null;

  for (const quality of qualities) {
<<<<<<< HEAD
    dataUrl = canvas.toDataURL(
      'image/jpeg',
      quality,
    );

    file = dataUrlToFile(
      dataUrl,
      `${name}-cropped.jpg`,
    );
=======
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    file = dataUrlToFile(dataUrl, `${name}-cropped.jpg`);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

    if (file.size <= 4 * 1024 * 1024) {
      break;
    }
  }

<<<<<<< HEAD
  return {
    dataUrl,
    file,
  };
}

export function WorkshopImageCropper({
  source,
  fileName = 'gallery-cover.png',
  onCancel,
  onApply,
}) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const dragRef = useRef(null);

  const [zoom, setZoom] = useState(1);

  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const [isReady, setReady] = useState(false);

  useEffect(() => {
    setOffset({
      x: 0,
      y: 0,
    });

=======
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
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    setZoom(1);
    setReady(false);
  }, [source]);

  useEffect(() => {
    if (!source) {
      return undefined;
    }

    const image = new Image();
<<<<<<< HEAD

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    image.onload = () => {
      imageRef.current = image;
      setReady(true);
    };
<<<<<<< HEAD

=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    image.src = source;

    return () => {
      imageRef.current = null;
    };
  }, [source]);

  useEffect(() => {
<<<<<<< HEAD
    if (
      !isReady ||
      !canvasRef.current ||
      !imageRef.current
    ) {
      return;
    }

    drawCroppedImage(
      canvasRef.current,
      imageRef.current,
      zoom,
      offset,
    );
  }, [
    isReady,
    offset,
    zoom,
  ]);
=======
    if (!isReady || !canvasRef.current || !imageRef.current) {
      return;
    }

    drawCroppedImage(canvasRef.current, imageRef.current, zoom, offset);
  }, [isReady, offset, zoom]);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

  if (!source) {
    return null;
  }

  function startDrag(event) {
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offset,
    };
<<<<<<< HEAD

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
=======
    event.currentTarget.setPointerCapture(event.pointerId);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  }

  function moveDrag(event) {
    if (!dragRef.current) {
      return;
    }

<<<<<<< HEAD
    const nextX =
      dragRef.current.offset.x +
      event.clientX -
      dragRef.current.x;

    const nextY =
      dragRef.current.offset.y +
      event.clientY -
      dragRef.current.y;

    setOffset({
      x: clamp(
        nextX,
        -previewWidth / 2,
        previewWidth / 2,
      ),

      y: clamp(
        nextY,
        -previewHeight / 2,
        previewHeight / 2,
      ),
=======
    const nextX = dragRef.current.offset.x + event.clientX - dragRef.current.x;
    const nextY = dragRef.current.offset.y + event.clientY - dragRef.current.y;

    setOffset({
      x: clamp(nextX, -previewWidth / 2, previewWidth / 2),
      y: clamp(nextY, -previewHeight / 2, previewHeight / 2),
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    });
  }

  function endDrag(event) {
    dragRef.current = null;
<<<<<<< HEAD

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // pointer sudah dilepas
    }
=======
    event.currentTarget.releasePointerCapture(event.pointerId);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  }

  function applyCrop() {
    if (!imageRef.current) {
      return;
    }

<<<<<<< HEAD
    const outputCanvas =
      document.createElement('canvas');

    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    drawCroppedImage(
      outputCanvas,
      imageRef.current,
      zoom,
      offset,
    );

    onApply(
      createCompressedJpeg(
        outputCanvas,
        fileName,
      ),
    );
  }

  return (
    <div
      className="profile-cropper workshop-cropper"
      role="dialog"
      aria-modal="true"
      aria-label="Crop gambar kegiatan"
    >
      <div
        className="profile-cropper__panel workshop-cropper__panel"
        style={{
          width: 'min(760px, calc(100vw - 40px))',
          maxWidth: '760px',
        }}
      >
        <h2>Crop Gambar Kegiatan</h2>

        <p>
          Geser gambar dan atur zoom sampai
          area sampul terlihat pas.
        </p>

        {/* AREA CROP 16:9 */}
        <div
          style={{
            position: 'relative',

            width: '100%',
            maxWidth: '680px',

            aspectRatio: '16 / 9',

            margin: '24px auto',

            overflow: 'hidden',

            border: '2px solid #00A2FF',
            borderRadius: '8px',

            background: '#000',

            cursor: 'grab',

            touchAction: 'none',
          }}
=======
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
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
<<<<<<< HEAD
          <canvas
            ref={canvasRef}
            width={previewWidth}
            height={previewHeight}
            style={{
              position: 'absolute',

              inset: 0,

              display: 'block',

              width: '100%',
              height: '100%',

              borderRadius: 0,
            }}
          />
        </div>

        <label
          className="profile-cropper__zoom"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',

            width: '100%',
          }}
        >
          <span
            style={{
              flex: '0 0 auto',
            }}
          >
            Zoom
          </span>

=======
          <canvas ref={canvasRef} width={previewWidth} height={previewHeight} />
        </div>
        <label className="profile-cropper__zoom">
          <span>Zoom</span>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
<<<<<<< HEAD
            onChange={(event) =>
              setZoom(
                Number(event.target.value),
              )
            }
            style={{
              flex: 1,
            }}
          />
        </label>

        <div
          className="profile-cropper__actions"
          style={{
            display: 'flex',

            alignItems: 'center',
            justifyContent: 'flex-end',

            gap: '14px',

            marginTop: '28px',
          }}
        >
          <button
            className="profile-cropper__button profile-cropper__button--secondary"
            type="button"
            onClick={onCancel}
          >
            Batal
          </button>

          <button
            className="profile-cropper__button profile-cropper__button--primary"
            type="button"
            onClick={applyCrop}
          >
=======
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <div className="profile-cropper__actions">
          <button className="profile-cropper__button profile-cropper__button--secondary" type="button" onClick={onCancel}>
            Batal
          </button>
          <button className="profile-cropper__button profile-cropper__button--primary" type="button" onClick={applyCrop}>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
            Gunakan Gambar
          </button>
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
