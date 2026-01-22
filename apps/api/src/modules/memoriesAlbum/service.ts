import fs from "fs";
import os from "os";
import path from "path";
import { ApiException } from "@/utils/api-error";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { CreateAlbumRequest, AlbumWithPages, Album } from "./schema";
import { NotificationsService } from "../notifications/service";
import dotenv from "dotenv";

dotenv.config();

export type pageWithMemory = {
  id: string;
  order: number;
  title: string | null;
  description: string | null;
  memories: {
    id: string;
    title: string | null;
    caption: string | null;
    mediaUrl: string | null;
    mimeType: string | null;
  };
};

export class MemoriesAlbumService {
  private apiKey: string;
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.supabase = supabase;
  }

  async transcribeAudio(file: File): Promise<string> {
    if (!this.apiKey) {
      throw new ApiException(500, "Gemini API key not configured");
    }

    if (!file) {
      throw new ApiException(400, "Audio file is required");
    }

    // Validate MIME
    if (!file.type || !file.type.startsWith("audio/")) {
      throw new ApiException(
        415,
        "Unsupported media type - only audio files allowed"
      );
    }

    // Write file to temp location because Gemini File API expects a path
    const tmpDir = os.tmpdir();
    const ext = (file.name || "audio").split(".").pop() || "bin";
    const tmpName = `postales-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const tmpPath = path.join(tmpDir, tmpName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(tmpPath, buffer);

      const genAI = new GoogleGenerativeAI(this.apiKey);
      const fileManager = new GoogleAIFileManager(this.apiKey);

      // Upload to Gemini file API
      const uploadResult = await fileManager.uploadFile(tmpPath, {
        mimeType: file.type,
        displayName: "Postal Audio",
      });

      let googleFile = await fileManager.getFile(uploadResult.file.name);

      // Bucle de espera
      // Sirve cuando los archivos son grandes y se tardan en procesar, evita que tire error por no encontrar el archivo
      while (googleFile.state === FileState.PROCESSING) {
        console.log("Procesando archivo...");
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Espera 2 seg
        googleFile = await fileManager.getFile(uploadResult.file.name);
      }

      if (googleFile.state === FileState.FAILED) {
        throw new Error("El procesamiento del audio falló en Google.");
      }

      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });

      const prompt =
        "Transcribe este audio exactamente como fue dicho. Si hay pausas largas o muletillas excesivas, elimínalas para que se lea fluido. No generes otra respuesta más que la traducción del audio, y no inventes nada que no sea dicho en el audio.";

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);

      const transcription = result.response?.text?.() || "";

      fs.unlinkSync(tmpPath);
      await fileManager.deleteFile(uploadResult.file.name);

      return transcription;
    } catch (err) {
      console.error("Postales transcoding error:", err);
      throw new ApiException(500, "Error transcribing audio");
    } finally {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
    }
  }

  /**
   * Create an album and process it with AI-generated narratives
   */
  async createAlbum(
    userId: string,
    data: CreateAlbumRequest
  ) {
    const { data: userGroup, error: userGroupError } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (!userGroup?.groupId || userGroupError) {
      throw new ApiException(404, "User family group not found");
    }

    const notificationsService = new NotificationsService(this.supabase);
      /* await notificationsService.createNotification({
        userId,
        eventType: "achievement", //TODO: change event & entity type to more appropiate ones
        entityType: "memory",
        entityId: userId, // ?
        title: "Generando Álbum",
        body: `Estamos generando tu álbum. Te avisaremos cuando esté listo.`,
      }); */

    const { data: memories, error: memoriesError } = await this.supabase
      .from("memories")
      .select("id, groupId, title, caption, mediaUrl, mimeType")
      .in("id", data.memoryIds)
      .eq("groupId", userGroup.groupId);

    if (memoriesError) {
      console.error("Error fetching memories:", memoriesError);
      await notificationsService.createNotification({
        userId,
        eventType: "achievement", //TODO: change event & entity type to more appropiate ones
        entityType: "memory",
        entityId: userId, // ?
        title: "Error al procesar el álbum",
        body: "¡Lo sentimos! Hubo un problema al generar tu álbum. Por favor, intenta nuevamente.",
      });
      throw new ApiException(500, "Error fetching memories");
    }

    if (!memories || memories.length !== data.memoryIds.length) {
      await notificationsService.createNotification({
        userId,
        eventType: "achievement", //TODO: change event & entity type to more appropiate ones
        entityType: "memory",
        entityId: userId, // ?
        title: "Error al procesar el álbum",
        body: "¡Lo sentimos! Hubo un problema al generar tu álbum. Por favor, intenta nuevamente.",
      });
      throw new ApiException(
        400,
        "Some memories not found or don't belong to your group"
      );
    }

    // Filter only image memories
    const imageMemories = memories.filter(
      (m) => m.mimeType && m.mimeType.startsWith("image/")
    );

    if (imageMemories.length === 0) {
      await notificationsService.createNotification({
        userId,
        eventType: "achievement", //TODO: change event & entity type to more appropiate ones
        entityType: "memory",
        entityId: userId, // ?
        title: "Error al procesar el álbum",
        body: "¡Lo sentimos! Hubo un problema al generar tu álbum. Por favor, intenta nuevamente.",
      });
      throw new ApiException(400, "No image memories found in the selection");
    }

    // Create album record with "processing" status
    const { data: album, error: albumError } = await this.supabase
      .from("memoriesAlbums")
      .insert({
        groupId: userGroup.groupId,
        createdBy: userId,
        title: data.title,
        description: data.description,
        status: "processing",
      })
      .select()
      .single();

    if (albumError || !album) {
      console.error("Error creating album:", albumError);
      await notificationsService.createNotification({
        userId,
        eventType: "achievement", //TODO: change event & entity type to more appropiate ones
        entityType: "memory",
        entityId: userId, // ?
        title: "Error al procesar el álbum",
        body: "¡Lo sentimos! Hubo un problema al generar tu álbum. Por favor, intenta nuevamente.",
      });
      throw new ApiException(500, "Error creating album");
    }

    // Create album pages with initial order (respecting memoryIds order)
    const pagesToInsert = data.memoryIds
      .map((memoryId, index) => {
        const memory = imageMemories.find((m) => m.id === memoryId);
        if (!memory || !memory.mediaUrl) return null;

        return {
          albumId: album.id,
          memoryId: memory.id,
          imageUrl: memory.mediaUrl,
          title: memory.title || null,
          description: memory.caption || null,
          order: index,
        };
      })
      .filter((p) => p !== null);

    const { data: pages, error: pagesError } = await this.supabase
      .from("memoriesAlbumPages")
      .insert(pagesToInsert)
      .select();

    if (pagesError || !pages) {
      console.error("Error creating album pages:", pagesError);
      // Rollback: delete the album
      await this.supabase.from("memoriesAlbums").delete().eq("id", album.id);
      await notificationsService.createNotification({
        userId,
        eventType: "achievement", //TODO: change event & entity type to more appropiate ones
        entityType: "memory",
        entityId: userId, // ?
        title: "Error al procesar el álbum",
        body: "¡Lo sentimos! Hubo un problema al generar tu álbum. Por favor, intenta nuevamente.",
      });
      throw new ApiException(500, "Error creating album pages");
    }

    await this.processAlbumNarratives(album.id, userId, userGroup.groupId).catch(
      (err) => {
        console.error("Error processing album narratives:", err);
        throw new ApiException(500, "Error generating the album pages content");
      }
    );
  }

  /**
   * Process album narratives using Gemini AI
   */
  private async processAlbumNarratives(
    albumId: string,
    userId: string,
    groupId: string
  ): Promise<void> {
    try {
      // Get album pages with memory data
      const { data: pages, error: pagesError } = await this.supabase
        .from("memoriesAlbumPages")
        .select(
          `
          id,
          order,
          title,
          description,
          memories (
            id,
            title,
            caption,
            mediaUrl,
            mimeType
          )
        `
        )
        .eq("albumId", albumId)
        .order("order", { ascending: true });

      if (pagesError || !pages) {
        throw new Error("Failed to fetch album pages");
      }

      // Get album info
      const { data: album } = await this.supabase
        .from("memoriesAlbums")
        .select("title, description")
        .eq("id", albumId)
        .single();

      if (!album) {
        throw new Error("Album not found");
      }

      // Get family group info
      const { data: familyGroup } = await this.supabase
        .from("familyGroups")
        .select("name")
        .eq("id", groupId)
        .single();

      // Generate narratives for each page
      const narratives = await this.generateNarrativesWithGemini(
        album,
        familyGroup?.name || "Tu familia",
        pages
      );

      // Update album pages with generated narratives
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page) continue; //For lint errors...
        const narrative = narratives[i];

        await this.supabase
          .from("memoriesAlbumPages")
          .update({
            description: narrative,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", page.id);
      }

      // Update album status to "ready"
      await this.supabase
        .from("memoriesAlbums")
        .update({
          status: "ready",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", albumId);

      // Create notification for user
      const notificationsService = new NotificationsService(this.supabase);
      await notificationsService.createNotification({
        userId,
        eventType: "achievement",
        entityType: "memory",
        entityId: albumId,
        title: "¡Tu álbum está listo!",
        body: `Ya generamos tu álbum "${album.title}". ¡Que lo disfrutes!`,
      });
    } catch (error) {
      console.error("Error processing album narratives:", error);

      // Update album status to "error"
      await this.supabase
        .from("memoriesAlbums")
        .update({
          status: "error",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", albumId);

      // Notify user about the error
      const notificationsService = new NotificationsService(this.supabase);
      await notificationsService.createNotification({
        userId,
        eventType: "achievement",
        entityType: "memory",
        entityId: albumId,
        title: "Error al procesar el álbum",
        body: "¡Lo sentimos! Hubo un problema al generar tu álbum. Por favor, intenta nuevamente.",
      });
    }
  }

  /**
   * Generate narratives for album pages using Gemini AI
   */
  private async generateNarrativesWithGemini(
    album: { title: string; description: string | null },
    familyName: string,
    pages: pageWithMemory[]
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      //model: "gemini-2.0-flash-exp",
      model: "gemini-3-flash-preview",
    });

    // Download and convert images to base64
    const imageData: Array<{
      inlineData: { data: string; mimeType: string };
    }> = [];

    for (const page of pages) {
      const memory = page.memories;
      if (memory?.mediaUrl && memory?.mimeType?.startsWith("image/")) {
        try {
          const response = await fetch(memory.mediaUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          imageData.push({
            inlineData: {
              data: base64,
              mimeType: memory.mimeType,
            },
          });
        } catch (err) {
          console.error("Error downloading image:", err);
          // Use placeholder if image download fails
          imageData.push({
            inlineData: {
              data: "",
              mimeType: "image/jpeg",
            },
          });
        }
      }
    }

    // Prompt with context
    const pagesContext = pages
      .map((page, idx) => {
        const memory = page.memories;
        return `Imagen ${idx + 1}: ${memory?.title || "Sin título"}\nDescripción original: ${memory?.caption || "Sin descripción"}`;
      })
      .join("\n\n");

    const prompt = `Eres un asistente que crea narrativas emotivas y personales para álbumes de fotos familiares.

Contexto del álbum:
- Título: ${album.title}
- Descripción: ${album.description || "Sin descripción adicional"}
- Familia: ${familyName}

A continuación te proporciono ${pages.length} imágenes con sus descripciones originales:

${pagesContext}

Tu tarea es generar una narrativa emotiva y personalizada para CADA imagen, creando una historia coherente que conecte todas las fotos del álbum. Cada narrativa debe:
1. Ser emotiva y capturar el momento especial
2. Conectar con las otras imágenes para crear una historia fluida
3. Tener entre 2-3 oraciones
4. Usar un tono cálido y personal
5. Incorporar detalles visibles en la imagen

Responde SOLO con las narrativas, una por línea, separadas por "---". NO incluyas números, títulos ni otro texto adicional.

Ejemplo de formato de respuesta:
Esta foto captura un momento especial...
---
En esta imagen podemos ver...
---
Este recuerdo nos muestra...`;

    // Generate content with images
    const result = await model.generateContent([prompt, ...imageData]);
    const response = result.response.text();

    // Parse narratives
    const narratives = response
      .split("---")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    // If we don't get enough narratives, fill with original captions
    while (narratives.length < pages.length) {
      const idx = narratives.length;
      narratives.push(
        pages[idx]?.memories?.caption ||
          pages[idx]?.memories?.title ||
          "Un momento especial capturado en el tiempo."
      );
    }

    return narratives.slice(0, pages.length);
  }

  async getAllAlbumsForUserGroup(
    userId: string,
    limit: number,
    offset: number
  ): Promise<Album[]> {
    //get user gruopId
    const { data: userGroup, error: userGroupError } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (!userGroup?.groupId || userGroupError) {
      throw new ApiException(404, "User family group not found");
    }

    const { data: albums, error: albumsError } = await this.supabase
      .from("memoriesAlbums")
      .select("*")
      .eq("groupId", userGroup.groupId)
      .eq("status", "ready")
      .range(offset, offset + limit - 1);

    if (albumsError) {
      console.error("Error getting the family group albums");
      throw new ApiException(500, "Error getting the family group albums");
    }

    return albums.map((album) => ({
      ...album,
      createdAt: new Date(album.createdAt),
      updatedAt: album.updatedAt ? new Date(album.updatedAt) : null,
    }));
  }

  async getAlbumById(userId: string, albumId: string): Promise<AlbumWithPages> {
    //get user gruopId
    const { data: userGroup, error: userGroupError } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (!userGroup?.groupId || userGroupError) {
      throw new ApiException(404, "User family group not found");
    }

    const { data: album, error: albumError } = await this.supabase
      .from("memoriesAlbums")
      .select("*")
      .eq("id", albumId)
      .eq("groupId", userGroup.groupId)
      .single();

    if (albumError || !album) {
      throw new ApiException(404, "Album not found");
    }

    const { data: pages, error: pagesError } = await this.supabase
      .from("memoriesAlbumPages")
      .select("*")
      .eq("albumId", albumId)
      .order("order", { ascending: true });

    if (pagesError) {
      console.error("Error fetching album pages:", pagesError);
      throw new ApiException(500, "Error fetching album pages");
    }

    return {
      ...album,
      createdAt: new Date(album.createdAt),
      updatedAt: album.updatedAt ? new Date(album.updatedAt) : null,
      pages: pages.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : null,
      })),
    };
  }
}
