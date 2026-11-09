

export const MAX_ORIGINAL_SIZE_BYTES = 5 * 1024 * 1024; 
export const MAX_IMAGE_DIMENSION = 1600;

export interface CompressResult {
  base64: string;
  dataUrl: string;
  sizeBytes: number;
}

export async function compressImage(file: File): Promise<CompressResult> {
  if (file.size > MAX_ORIGINAL_SIZE_BYTES) {
    throw new Error("Ukuran file melebihi batas maksimal 5 MB");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memproses gambar"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/webp", 0.82);
        const base64 = dataUrl.split(",")[1] ?? "";
        const sizeBytes = Math.round((base64.length * 3) / 4);

        resolve({ base64, dataUrl, sizeBytes });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

