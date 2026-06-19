import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useEffect, useState } from 'react';
import './ImageUpload.css';

function ImageUpload({ onImagesAdd, initialImages = [] }) {
  const [images, setImages] = useState(initialImages);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const appendImage = (imageData) => {
    setImages((prev) => {
      const next = [...prev, imageData];
      onImagesAdd(next);
      return next;
    });
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      if (image.dataUrl) {
        appendImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Camera error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setIsLoading(true);
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      });

      if (image.dataUrl) {
        appendImage(image.dataUrl);
      }
    } catch (error) {
      console.error('Gallery error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInput = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result?.toString() || '';
        if (imageData) {
          appendImage(imageData);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesAdd(newImages);
  };

  return (
    <div className="image-upload-container">
      <div className="upload-buttons">
        <button type="button" className="upload-btn camera-btn" onClick={takePhoto} disabled={isLoading}>
          {isLoading ? '⏳ Processing...' : '📷 Take Photo'}
        </button>

        <button type="button" className="upload-btn gallery-btn" onClick={pickFromGallery} disabled={isLoading}>
          {isLoading ? '⏳ Processing...' : '🖼️ Pick from Gallery'}
        </button>

        <label className="upload-btn file-btn">
          📁 Choose Files
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {images.length > 0 && (
        <div className="images-preview">
          <p className="preview-label">
            Selected Images ({images.length})
          </p>
          <div className="images-grid">
            {images.map((image, index) => (
              <div key={index} className="image-item">
                <img src={image} alt={`Preview ${index + 1}`} className="preview-image" />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeImage(index)}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
