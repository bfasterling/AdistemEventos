import { getFirebaseStorage } from "../firebase";
import { initializeApp, getApps } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

export interface StorageUploadResult {
  photoUrl: string;
  thumbnailUrl: string;
  storageType: "firebase" | "server-storage";
}

async function checkBucketReady(bucketName: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucketName}/o`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timer);
    // Si responde 404, el bucket de Cloud Storage no está creado en GCP
    return res.status !== 404;
  } catch {
    return false;
  }
}

export class StorageService {
  /**
   * Sube la foto optimizada y su thumbnail directamente a Firebase Storage.
   * Verifica disponibilidad del bucket antes de intentar para evitar bucles de reintento.
   * Si el bucket aún no está activado en Firebase Console, utiliza de inmediato el
   * repositorio de almacenamiento con persistencia en la nube (rehidratación automática).
   */
  static async uploadPhoto(
    photoId: string,
    fullBase64: string,
    thumbBase64: string
  ): Promise<StorageUploadResult> {
    const cleanFull = fullBase64.startsWith("data:") 
      ? fullBase64 
      : `data:image/jpeg;base64,${fullBase64}`;
    const cleanThumb = thumbBase64.startsWith("data:") 
      ? thumbBase64 
      : `data:image/jpeg;base64,${thumbBase64}`;

    // Lista de buckets candidatos
    const candidateBuckets = [
      firebaseConfig.storageBucket,
      `${firebaseConfig.projectId}.firebasestorage.app`,
      `${firebaseConfig.projectId}.appspot.com`
    ].filter(Boolean) as string[];

    const uniqueBuckets = Array.from(new Set(candidateBuckets));
    const app = getApps()[0] || initializeApp(firebaseConfig);

    // 1. Probar buckets de Firebase Storage de forma ágil y con timeout estricto
    for (const bucketName of uniqueBuckets) {
      const isReady = await checkBucketReady(bucketName);
      if (!isReady) {
        continue;
      }

      try {
        const bucketStorage = getStorage(app, bucketName);
        bucketStorage.maxUploadRetryTime = 2500;
        bucketStorage.maxOperationRetryTime = 2500;

        const photoStorageRef = ref(bucketStorage, `photos/${photoId}.jpg`);
        const thumbStorageRef = ref(bucketStorage, `photos/thumbs/thumb_${photoId}.jpg`);

        const uploadTask = async () => {
          await uploadString(photoStorageRef, cleanFull, "data_url", {
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000, immutable"
          });

          await uploadString(thumbStorageRef, cleanThumb, "data_url", {
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000, immutable"
          });

          const [photoUrl, thumbnailUrl] = await Promise.all([
            getDownloadURL(photoStorageRef),
            getDownloadURL(thumbStorageRef)
          ]);

          return { photoUrl, thumbnailUrl };
        };

        const result = await Promise.race([
          uploadTask(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout al contactar Firebase Storage")), 3500)
          )
        ]);

        console.log(`Foto ${photoId} subida con éxito a Firebase Storage (${bucketName})`);
        return {
          photoUrl: result.photoUrl,
          thumbnailUrl: result.thumbnailUrl,
          storageType: "firebase"
        };
      } catch (e: any) {
        console.warn(`No se pudo subir al bucket ${bucketName}:`, e?.message || e);
      }
    }

    console.log(
      "Almacenando en Repositorio de Storage dedicado con persistencia en la nube..."
    );

    // 2. Repositorio de Almacenamiento Dedicado (respaldado en la nube con rehidratación automática)
    const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/storage/photos/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoId,
        fullBase64,
        thumbBase64
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Error ${res.status} al subir archivo a Storage`);
    }

    const data = await res.json();
    return {
      photoUrl: data.photoUrl,
      thumbnailUrl: data.thumbnailUrl,
      storageType: "server-storage"
    };
  }

  /**
   * Elimina la foto y su miniatura del repositorio de almacenamiento.
   */
  static async deletePhoto(photoId: string, storageType?: string): Promise<void> {
    if (storageType === "firebase") {
      const candidateBuckets = [
        firebaseConfig.storageBucket,
        `${firebaseConfig.projectId}.firebasestorage.app`,
        `${firebaseConfig.projectId}.appspot.com`
      ].filter(Boolean) as string[];
      const uniqueBuckets = Array.from(new Set(candidateBuckets));
      const app = getApps()[0] || initializeApp(firebaseConfig);

      for (const bucketName of uniqueBuckets) {
        try {
          const bucketStorage = getStorage(app, bucketName);
          const photoStorageRef = ref(bucketStorage, `photos/${photoId}.jpg`);
          const thumbStorageRef = ref(bucketStorage, `photos/thumbs/thumb_${photoId}.jpg`);
          await Promise.allSettled([
            deleteObject(photoStorageRef),
            deleteObject(thumbStorageRef)
          ]);
        } catch {}
      }
    }

    // Limpiar también en el repositorio del servidor
    const baseUrl = typeof window !== "undefined" ? "" : "http://localhost:3000";
    fetch(`${baseUrl}/api/storage/photos/${photoId}`, { method: "DELETE" }).catch(() => {});
  }
}
