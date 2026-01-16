import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePostAlbumCreate,
  usePostAlbumTranscribe,
  useGetAlbumId,
  useGetAlbum,
} from "@elepad/api-client";
//TODO: Agregar la creación de notificaciones

interface CreateAlbumData {
  title: string;
  description?: string;
  memoryIds: string[];
}

interface TranscribeAudioData {
  audio: File;
}

interface UseAlbumCreationReturn {
  // Crear álbum
  isCreating: boolean;
  isProcessing: boolean;
  processingAlbumTitle: string | null;
  error: string | null;
  createAlbum: (data: CreateAlbumData) => Promise<void>;
  dismissProcessingDialog: () => void;

  // Transcribir audio
  isTranscribing: boolean;
  transcriptionError: string | null;
  transcribeAudio: (data: TranscribeAudioData) => Promise<string | null>;

  // Obtener álbumes
  albumsQuery: ReturnType<typeof useGetAlbum>;
  getAlbumQuery: (id: string) => ReturnType<typeof useGetAlbum>;
}

export function useAlbumCreation(): UseAlbumCreationReturn {
  const queryClient = useQueryClient();
  const [processingAlbumTitle, setProcessingAlbumTitle] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Refs para control de flujo
  const isCreatingRef = useRef(false);
  const isTranscribingRef = useRef(false);

  // API Hooks
  const createAlbumApi = usePostAlbumCreate();
  const transcribeAudioApi = usePostAlbumTranscribe();
  const albumsQuery = useGetAlbum(
    {
      limit: 50,
      offset: 0,
    },
    {
      query: {
        staleTime: 0,
        gcTime: 1000 * 60,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
      },
    }
  );

  // Crear álbum
  const createAlbum = useCallback(
    async (data: CreateAlbumData) => {
      if (isCreatingRef.current) {
        console.warn("⚠️ Ya hay una creación en progreso");
        return;
      }

      isCreatingRef.current = true;
      setIsCreating(true);
      setError(null);

      try {
        console.log("📝 Creando álbum:", data.title);

        createAlbumApi.mutateAsync({
          data: {
            title: data.title,
            description: data.description || "",
            memoryIds: data.memoryIds,
          },
        });

        //console.log("📦 Respuesta del API:", response);

        // Extraer datos de la respuesta (puede estar envuelta)
        //const responseData = "data" in response ? response.data : response;

        

        //const album = responseData as { title: string; id: string };

        // Mostrar dialog de procesamiento
        //setProcessingAlbumTitle(album.title);

       

        // Invalidar queries para refrescar la lista de álbumes
        await queryClient.invalidateQueries({ queryKey: ["GetAlbums"] });

        //console.log("✅ Álbum creado exitosamente:", album.id);
      } catch (err) {
        console.error("❌ Error creating album:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Error al crear el álbum";
        setError(errorMessage);
        setProcessingAlbumTitle(null);
      } finally {
        isCreatingRef.current = false;
        setIsCreating(false);
      }
    },
    [createAlbumApi, queryClient]
  );

  // Transcribir audio
  const transcribeAudio = useCallback(
    async (data: TranscribeAudioData): Promise<string | null> => {
      if (isTranscribingRef.current) {
        console.warn("⚠️ Ya hay una transcripción en progreso");
        return null;
      }

      isTranscribingRef.current = true;
      setIsTranscribing(true);
      setTranscriptionError(null);

      try {
        console.log("🎙️ Transcribiendo audio...");

        const response = await transcribeAudioApi.mutateAsync({
          data: { audio: data.audio },
        });

        console.log("📦 Respuesta de transcripción:", response);

        // Extraer datos de la respuesta
        const responseData = "data" in response ? response.data : response;

        if (!responseData || typeof responseData !== "object") {
          throw new Error("Invalid transcription response");
        }

        const { text } = responseData as { text: string };

        console.log("✅ Audio transcrito exitosamente");
        return text;
      } catch (err) {
        console.error("❌ Error transcribing audio:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Error al transcribir audio";
        setTranscriptionError(errorMessage);
        return null;
      } finally {
        isTranscribingRef.current = false;
        setIsTranscribing(false);
      }
    },
    [transcribeAudioApi]
  );

  // Función auxiliar para obtener un álbum específico
  const getAlbumQuery = useCallback(
    (id: string) => {
      return useGetAlbumId(
        id,
        {
          query: {
            enabled: !!id,
            staleTime: 0,
            gcTime: 1000 * 60,
          },
        }
      );
    },
    []
  );

  return {
    // Crear álbum
    isCreating,
    isProcessing: processingAlbumTitle !== null,
    processingAlbumTitle,
    error,
    createAlbum,
    dismissProcessingDialog: () => setProcessingAlbumTitle(null),

    // Transcribir audio
    isTranscribing,
    transcriptionError,
    transcribeAudio,

    // Obtener álbumes
    albumsQuery,
    getAlbumQuery,
  };
}
