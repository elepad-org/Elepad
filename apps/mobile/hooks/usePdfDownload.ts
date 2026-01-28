import { useState } from "react";
import { File, Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from 'expo-intent-launcher';
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
      if (!u.searchParams.has("download"))
        u.searchParams.set("download", "true");
      return u.toString();
    } catch {
      return url;
    }
  };

  const getCacheDir = () => {
    const cache = Paths.cache || "";
    if (!cache) throw new Error("Cache directory not available");
    return new Directory(cache);
  };

  const downloadToCacheWithFileApi = async (
    pdfUrl: string,
    filename: string,
  ) => {
    const cacheDir = getCacheDir();

    try {
      if (!cacheDir.exists)
        cacheDir.create({ intermediates: true, idempotent: true });
    } catch (err) {
      console.log(err)
      throw err as Error;
    }

    const targetUri = `${cacheDir.uri.replace(/\/+$/, "")}/${filename}`;
    const targetFile = new File(targetUri);

    try {
      const info = targetFile.info();
      if (info.exists) {
        try {
          targetFile.delete();
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    const downloaded = await File.downloadFileAsync(
      ensureDownloadParam(pdfUrl),
      targetFile,
      {
        idempotent: true,
      },
    );

    const downloadedInfo = downloaded.info();
    if (!downloadedInfo.exists)
      throw new Error("El archivo no fue descargado correctamente");

    return downloaded;
  };

  const sharePdf = async (pdfUrl: string, albumTitle: string) => {
    if (!pdfUrl) return;
    setIsDownloading(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        showToast({message: "Compartir no está disponible en este dispositivo", type: "error"});
        throw new Error;
      }

      showToast({ message: "Preparando álbum...", type: "info" });

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
      console.log(err)
      showToast({ message: "Error al intentar compartir el álbum", type: "error" });
      options?.onError?.(err instanceof Error ? err : new Error);
    } finally {
      setIsDownloading(false);
    }
  };

  const viewLocalPdf = async (
    pdfUrl: string,
  ): Promise<void> => {
    if (!pdfUrl) return;
    setIsDownloading(true);
    try {
      showToast({ message: "Cargando archivo...", type: "info" });


      const destDir = new Directory(Paths.cache);
      destDir.create({ idempotent: true, intermediates: true });

      const output = await File.downloadFileAsync(pdfUrl, destDir, {idempotent: true});
      console.log(output)


      const savedUri = await FileSystem.getContentUriAsync(output.uri);

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: savedUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        type: 'application/pdf', // Para apps que lean pdf
        });
      options?.onSuccess?.();
      setIsDownloading(false);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(err);
      showToast({ message: "No se pudo abrir el PDF. Intenta nuevamente", type: "error" });
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

  return {
    sharePdf,
    viewLocalPdf,
    isDownloading,
    cleanupCache,
  };
}
