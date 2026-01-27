import { useState } from "react";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import { File, Directory } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useToast } from "@/components/shared/Toast";

interface UsePdfDownloadOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePdfDownload(options?: UsePdfDownloadOptions) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { showToast } = useToast();

  const sanitizeFilename = (filename: string) =>
    filename
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]/g, "_")
      .replace(/\s+/g, "_")
      .trim();

  const ensureDownloadParam = (url: string) => {
    try {
      const u = new URL(url);
      if (!u.searchParams.has("download")) u.searchParams.set("download", "true");
      return u.toString();
    } catch {
      return url;
    }
  };

  const getCacheDir = () => {
    const cache = FileSystem.Paths.cache || "";
    if (!cache) throw new Error("Cache directory not available");
    return new Directory(cache);
  };

  const downloadToCacheWithFileApi = async (pdfUrl: string, filename: string) => {
    const cacheDir = getCacheDir();

    // Create cache directory if it doesn't already exist (idempotent)
    try {
      if (!cacheDir.exists) cacheDir.create({ intermediates: true, idempotent: true });
    } catch (err) {
      // rethrow permission-like errors with helpful message
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("permission") || msg.includes("WRITE")) {
        throw new Error("No se poseen permisos para escribir en el almacenamiento de la app.");
      }
      throw err as Error;
    }

    const targetUri = `${cacheDir.uri.replace(/\/+$/, "")}/${filename}`;
    const targetFile = new File(targetUri);

    // If exists, try to delete to ensure clean download
    try {
      const info = targetFile.info();
      if (info.exists) {
        try {
          targetFile.delete();
        } catch {
          // ignore deletion failure and attempt idempotent download
        }
      }
    } catch {
      // ignore
    }

    // Download into the target file (idempotent to allow overwrite)
    const downloaded = await File.downloadFileAsync(ensureDownloadParam(pdfUrl), targetFile, {
      idempotent: true,
    });

    const downloadedInfo = downloaded.info();
    if (!downloadedInfo.exists) throw new Error("El archivo no fue descargado correctamente");

    return downloaded;
  };

  const sharePdf = async (pdfUrl: string, albumTitle: string) => {
    if (!pdfUrl) return;
    setIsDownloading(true);
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error("Compartir no está disponible en este dispositivo");

      showToast({ message: "Preparando PDF...", type: "info" });

      const filename = `${sanitizeFilename(albumTitle)}.pdf`;
      const downloaded = await downloadToCacheWithFileApi(pdfUrl, filename);

      const shareUri = downloaded.contentUri || downloaded.uri;

      await Sharing.shareAsync(shareUri, {
        mimeType: "application/pdf",
        dialogTitle: `Compartir ${albumTitle}`,
        UTI: "com.adobe.pdf",
      });

      options?.onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast({ message: msg, type: "error" });
      options?.onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setIsDownloading(false);
    }
  };

  const savePdf = async (pdfUrl: string, albumTitle: string): Promise<string | undefined> => {
    if (!pdfUrl) return;
    setIsDownloading(true);
    try {
      const filename = `${sanitizeFilename(albumTitle)}.pdf`;
      showToast({ message: "Descargando...", type: "info" });

      const downloaded = await downloadToCacheWithFileApi(pdfUrl, filename);

      if (Platform.OS === "android") {
        // Ask user for destination directory (SAF via Directory picker)
        const destDir = await Directory.pickDirectoryAsync();
        if (!destDir) throw new Error("No se seleccionó carpeta de destino");

        // Create or get target file in destination
        let destFile: File;
        try {
          destFile = destDir.createFile(filename, "application/pdf") as File;
        } catch {
          // If create fails because exists, create File instance and overwrite via write
          const destUri = `${destDir.uri.replace(/\/+$/, "")}/${filename}`;
          destFile = new File(destUri);
        }

        // Get bytes from downloaded file and write
        const bytes = await downloaded.bytes();
        await destFile.write(bytes);

        const savedUri = destFile.contentUri || destFile.uri;
        showToast({ message: "PDF guardado en la carpeta seleccionada", type: "success" });
        options?.onSuccess?.();
        return savedUri;
      } else {
        // iOS and others: use share sheet to allow saving to Files
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        });
        options?.onSuccess?.();
        return downloaded.uri;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast({ message: msg, type: "error" });
      options?.onError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setIsDownloading(false);
    }
  };

  const cleanupCache = async () => {
    try {
      const cacheDir = getCacheDir();
      if (!cacheDir.exists) return;

      const contents = cacheDir.list();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      for (const item of contents) {
        if (item instanceof File && item.uri.endsWith(".pdf")) {
          try {
            const info = item.info();
            const mod = info.modificationTime ?? info.creationTime ?? 0;
            const modMs = mod > 1e10 ? mod : mod * 1000;
            if (modMs && now - modMs > oneDay) item.delete();
          } catch {
            // ignore per-file errors
          }
        }
      }
    } catch (e) {
      console.warn("Error cleaning cache", e);
    }
  };

  const findSavedPdf = async (albumTitle: string): Promise<string | undefined> => {
    try {
      const cacheDir = getCacheDir();
      if (!cacheDir.exists) return undefined;

      const filename = `${sanitizeFilename(albumTitle)}.pdf`;
      const contents = FileSystem.Paths.document.list();
      console.log(contents)

      for (const item of contents) {
        if (item instanceof File && item.uri.endsWith(filename)) {
          const info = item.info();
          if (info.exists) {
            console.log(info)
            return item.uri || item.contentUri;
          }
        }
      }
      return undefined;
    } catch (e) {
      console.warn("Error finding saved PDF", e);
      return undefined;
    }
  };

  return {
    sharePdf,
    savePdf,
    findSavedPdf,
    isDownloading,
    cleanupCache,
  };
}
