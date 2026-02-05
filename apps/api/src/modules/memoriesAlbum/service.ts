import fs from "fs";
import os from "os";
import path from "path";
import { ApiException } from "@/utils/api-error";
import { GoogleGenAI, Part } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { CreateAlbumRequest, AlbumWithPages, Album } from "./schema";
import { NotificationsService } from "../notifications/service";
import { uploadAlbumCoverImage, uploadAlbumPDF } from "@/services/storage";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
  private client: GoogleGenAI;
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    if (!this.apiKey) {
      console.warn("GEMINI_API_KEY is not set");
    }
    // Inicialización única del cliente para toda la clase
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
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
        "Unsupported media type - only audio files allowed",
      );
    }

    const tmpDir = os.tmpdir();
    const ext = (file.name || "audio").split(".").pop() || "bin";
    const tmpName = `postales-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const tmpPath = path.join(tmpDir, tmpName);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(tmpPath, buffer);

      // 1. Upload usando la nueva API client.files
      const uploadResult = await this.client.files.upload({
        file: tmpPath,
        config: {
          mimeType: file.type,
          displayName: "Postal Audio",
        },
      });

      if (!uploadResult || !uploadResult.name || !uploadResult.uri) {
        throw new Error("File upload failed or returned incomplete metadata");
      }

      // 2. Polling de estado
      let fileInfo = await this.client.files.get({ name: uploadResult.name });

      while (fileInfo && fileInfo.state === "PROCESSING") {
        console.log("Procesando archivo...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileInfo = await this.client.files.get({ name: uploadResult.name });
      }

      if (!fileInfo || fileInfo.state === "FAILED") {
        throw new Error("El procesamiento del audio falló en Google.");
      }

      // 3. Generar contenido
      const prompt =
        "Transcribe este audio exactamente como fue dicho. Si hay pausas largas o muletillas excesivas, elimínalas para que se lea fluido. No generes otra respuesta más que la traducción del audio, y no inventes nada que no sea dicho en el audio.";

      const result = await this.client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                fileData: {
                  fileUri: uploadResult.uri,
                  mimeType:
                    uploadResult.mimeType ||
                    file.type ||
                    "application/octet-stream",
                },
              },
            ],
          },
        ],
      });

      const transcription =
        result && typeof result.text === "string" ? result.text : "";

      // Limpieza
      try {
        await this.client.files.delete({ name: uploadResult.name });
      } catch (e) {
        console.warn("No se pudo eliminar el archivo remoto:", e);
      }

      return transcription || "";
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
  async createAlbum(userId: string, data: CreateAlbumRequest) {
    const { data: userGroup, error: userGroupError } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (!userGroup?.groupId || userGroupError) {
      throw new ApiException(404, "User family group not found");
    }

    const { data: memories, error: memoriesError } = await this.supabase
      .from("memories")
      .select("id, groupId, title, caption, mediaUrl, mimeType")
      .in("id", data.memoryIds)
      .eq("groupId", userGroup.groupId);

    if (memoriesError) {
      console.error("Error fetching memories:", memoriesError);
      throw new ApiException(500, "Error fetching memories");
    }

    if (!memories || memories.length !== data.memoryIds.length) {
      throw new ApiException(
        400,
        "Some memories not found or don't belong to your group",
      );
    }

    // Filter only image memories
    const imageMemories = memories.filter(
      (m) => m.mimeType && m.mimeType.startsWith("image/"),
    );

    if (imageMemories.length === 0) {
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
      throw new ApiException(500, "Error creating album");
    }

    // Create album pages
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
      throw new ApiException(500, "Error creating album pages");
    }

    // Process in background (async without await usually, but logic kept as provided)
    await this.processAlbumNarratives(album.id, userId, userGroup.groupId).catch(
      (err) => {
        console.error("Error processing album narratives:", err);
      },
    );
  }

  /**
   * Process album narratives using Gemini AI
   */
  private async processAlbumNarratives(
    albumId: string,
    userId: string,
    groupId: string,
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
        `,
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
        pages,
      );

      // Update album pages with generated narratives
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page) continue;
        const narrative = narratives[i];

        await this.supabase
          .from("memoriesAlbumPages")
          .update({
            description: narrative,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", page.id);
      }

      // Generate and upload album cover image
      let coverImageUrl: string | null = null;
      try {
        const imageBuffer = await this.generateAlbumCoverImage(
          album,
          narratives,
          pages[0],
        );
        coverImageUrl = await uploadAlbumCoverImage(
          this.supabase,
          groupId,
          albumId,
          imageBuffer,
        );
      } catch (err) {
        console.error("Error generating or uploading album cover image:", err);
      }

      // Update album status to "ready"
      await this.supabase
        .from("memoriesAlbums")
        .update({
          status: "ready",
          coverImageUrl: coverImageUrl,
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
    pages: pageWithMemory[],
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Preparar las partes para el contenido multimodal (Texto + Imágenes inline)
    const contentParts: Part[] = [];

    // Prompt inicial
    const prompt = `Eres un asistente que crea narrativas emotivas y personales para álbumes de fotos familiares.

Contexto del álbum:
- Título: ${album.title}
- Descripción: ${album.description || "Sin descripción adicional"}
- Familia: ${familyName}

A continuación te proporciono ${pages.length} imágenes con sus descripciones originales:

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

    contentParts.push({ text: prompt });

    // Descargar imágenes y añadirlas como partes inline
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (!page) continue;
      const memory = page.memories;

      // Texto descriptivo de la imagen
      contentParts.push({
        text: `Imagen ${i + 1} (Título: ${memory?.title || "Sin título"}, Info: ${memory?.caption || "Sin info"}):`,
      });

      if (memory?.mediaUrl && memory?.mimeType?.startsWith("image/")) {
        try {
          const response = await fetch(memory.mediaUrl);
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          contentParts.push({
            inlineData: {
              data: base64,
              mimeType: memory.mimeType,
            },
          });
        } catch (err) {
          console.error("Error downloading image for Gemini:", err);
          contentParts.push({
            text: "[Imagen no disponible, usar descripción original]",
          });
        }
      }
    }

    // Generar contenido
    try {
      const result = await this.client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: contentParts,
          },
        ],
      });

      // Extract text safely from result
      let responseText = "";
      if (result) {
        if (typeof result.text === "string") {
          responseText = result.text;
        } else if (result.candidates?.[0]?.content?.parts) {
          for (const part of result.candidates[0].content.parts) {
            if (part.text) {
              responseText += part.text;
            }
          }
        }
      }

      // Parse narratives
      const narratives = responseText
        .split("---")
        .map((n: string) => n.trim())
        .filter((n: string) => n.length > 0);

      // Relleno si faltan narrativas
      while (narratives.length < pages.length) {
        const idx = narratives.length;
        narratives.push(
          pages[idx]?.memories?.caption || "Un momento especial.",
        );
      }

      return narratives.slice(0, pages.length);
    } catch (e) {
      console.error("Error calling Gemini API:", e);
      // Fallback
      return pages.map((p) => p.memories.caption || "Recuerdo familiar.");
    }
  }

  /**
   * Generate an album cover image using Gemini AI (Imagen 3)
   */
  private async generateAlbumCoverImage(
    album: { title: string; description: string | null },
    narratives: string[],
    firstPage?: pageWithMemory,
  ): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const narrativesSummary = narratives.slice(0, 3).join(" ");
    const imagePrompt = `Create a beautiful, artistic album cover image for a family photo album.
    
    Title: ${album.title}
    Description: ${album.description || "Family memories"}
    Vibe: ${narrativesSummary}
    
    Style: Warm, emotional, soft colors, photorealistic or artistic illustration suitable for a book cover.`;

    try {
      const response = await this.client.models.generateImages({
        //model: "gemini-2.5-flash-image",
        model: "imagen-4.0-generate-001", // Los modelos 3.0 para atras fueron dados de baja
        prompt: imagePrompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "1:1",
        },
      });

      const imagePart = response.generatedImages?.[0]?.image?.imageBytes;

      if (imagePart) {
        return Buffer.from(imagePart, "base64");
      }

      throw new Error("No image data in response");
    } catch (error) {
      console.error("Error generating cover image:", error);
      // Fallback: use the first image of the album as cover
      try {
        if (firstPage) {
          const mediaUrl = firstPage?.memories?.mediaUrl;
          if (mediaUrl) {
            const resp = await fetch(mediaUrl);
            if (!resp.ok)
              throw new Error(
                `Failed to download fallback image: ${resp.status}`,
              );
            const buf = Buffer.from(await resp.arrayBuffer());
            return buf;
          }
        }
      } catch (fallbackErr) {
        console.error("Error fetching fallback cover image:", fallbackErr);
      }

      throw error;
    }
  }

  async getAllAlbumsForUserGroup(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Album[]> {
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

  /**
   * Export album to PDF using pdf-lib
   */
  async exportAlbumToPDF(userId: string, albumId: string): Promise<string> {
    // Get user's family group
    const { data: userGroup, error: userGroupError } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (!userGroup?.groupId || userGroupError) {
      throw new ApiException(404, "User family group not found");
    }

    // Get album with pages
    const albumWithPages = await this.getAlbumById(userId, albumId);

    if (albumWithPages.status !== "ready") {
      throw new ApiException(400, "Album is not ready for export");
    }

    // Get family group info
    const { data: familyGroup } = await this.supabase
      .from("familyGroups")
      .select("name")
      .eq("id", userGroup.groupId)
      .single();

    const familyName = familyGroup?.name || "Tu familia";

    try {
      // Generate PDF using pdf-lib
      const pdfBuffer = await this.generateAlbumPDFBuffer(
        albumWithPages,
        familyName,
      );

      // Upload to Supabase Storage
      const pdfUrl = await uploadAlbumPDF(
        this.supabase,
        userGroup.groupId,
        albumId,
        pdfBuffer,
      );

      // Update album with PDF URL
      const { error: updateError } = await this.supabase
        .from("memoriesAlbums")
        .update({
          urlPdf: pdfUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", albumId);

      if (updateError) {
        console.error("Error updating album with PDF URL:", updateError);
      }

      // Send notification to user
      const notificationsService = new NotificationsService(this.supabase);
      await notificationsService.createNotification({
        userId,
        eventType: "achievement",
        entityType: "memory",
        entityId: albumId,
        title: "¡Tu PDF está listo!",
        body: `Hemos generado el PDF de tu álbum "${albumWithPages.title}". Ya puedes descargarlo.`,
      });

      return pdfUrl;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new ApiException(500, "Error generating album PDF");
    }
  }

  /**
   * Calculate X position to center text
   */
  private calculateCenteredX(
    text: string,
    fontSize: number,
    containerWidth: number,
  ): number {
    // Approximate calculation: average character width is roughly 0.5 * fontSize
    const approximateWidth = text.length * fontSize * 0.5;
    return Math.max(0, (containerWidth - approximateWidth) / 2);
  }

  /**
   * Remove emojis from text to avoid WinAnsi encoding issues
   */
  private removeEmojis(text: string): string {
    // Remove emojis and other non-ASCII characters that StandardFonts can't encode
    return text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Emojis
      .replace(/[\u{2600}-\u{27BF}]/gu, "") // Miscellaneous Symbols
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
      .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII
      .trim();
  }

  /**
   * Generate PDF buffer for album using pdf-lib
   */
  private async generateAlbumPDFBuffer(
    album: AlbumWithPages,
    familyName: string,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    // Fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lightFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Page dimensions
    const pageWidth = 842;
    const pageHeight = 595;

    // Cover page
    const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);

    // Draw gradient background
    const gradientSteps = 50;
    for (let step = 0; step < gradientSteps; step++) {
      const ratio = step / gradientSteps;
      // Interpolate between #9a9ece (154, 158, 206) and #424a70 (66, 74, 112)
      const r = 154 - (154 - 66) * ratio;
      const g = 158 - (158 - 74) * ratio;
      const b = 206 - (206 - 112) * ratio;
      
      const stepHeight = pageHeight / gradientSteps;
      const stepY = pageHeight - (step * stepHeight);
      
      coverPage.drawRectangle({
        x: 0,
        y: stepY - stepHeight,
        width: pageWidth,
        height: stepHeight,
        color: rgb(r / 255, g / 255, b / 255),
      });
    }

    // Title
    const titleX = this.calculateCenteredX(album.title, 42, pageWidth);
    coverPage.drawText(album.title, {
      x: titleX,
      y: pageHeight - 150,
      size: 42,
      font: titleFont,
      color: rgb(1, 1, 1),
      maxWidth: pageWidth - 100,
    });

    // Description
    if (album.description) {
      const descX = this.calculateCenteredX(
        album.description,
        16,
        pageWidth,
      );
      coverPage.drawText(album.description, {
        x: descX,
        y: pageHeight - 280,
        size: 16,
        font: bodyFont,
        color: rgb(1, 1, 1),
        maxWidth: pageWidth - 200,
        lineHeight: 24,
      });
    }

    // Family name
    const familyX = this.calculateCenteredX(
      familyName,
      14,
      pageWidth,
    );
    coverPage.drawText(familyName, {
      x: familyX,
      y: 80,
      size: 14,
      font: lightFont,
      color: rgb(1, 1, 1),
      maxWidth: pageWidth - 100,
    });

    // Content pages
    for (let i = 0; i < album.pages.length; i++) {
      const page = album.pages[i];
      if (!page) continue;

      const contentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      const backgroundColor = rgb(250 / 255, 248 / 255, 245 / 255); // #faf8f5

      // Draw background
      contentPage.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: backgroundColor,
      });

      // Image section (left half)
      const imageX = 30;
      const imageY = 100;
      const imageMaxWidth = (pageWidth / 2) - 60;
      const imageMaxHeight = 400;

      // Draw polaroid frame
      const frameWidth = Math.min(imageMaxWidth, 340);
      const frameHeight = frameWidth + 50;
      const frameBg = rgb(1, 1, 1);
      const frameCenterX = imageX + (imageMaxWidth - frameWidth) / 2;
      const frameCenterY = imageY + (imageMaxHeight - frameHeight) / 2;

      // Draw shadow behind polaroid (draw shadow first so it's behind)
      contentPage.drawRectangle({
        x: frameCenterX - 5,
        y: frameCenterY - 10,
        width: frameWidth,
        height: frameHeight,
        color: rgb(0.95, 0.95, 0.95),
      });

      // Draw polaroid frame on top of the shadow
      contentPage.drawRectangle({
        x: frameCenterX,
        y: frameCenterY,
        width: frameWidth,
        height: frameHeight,
        color: frameBg,
      });

      // Draw image if available (at the top of the polaroid)
      if (page.imageUrl) {
        try {
          const imageResponse = await fetch(page.imageUrl);
          if (!imageResponse.ok) {
            console.warn(
              `Failed to fetch image for page ${i + 1}: ${imageResponse.status}`,
            );
          } else {
            const imageBuffer = await imageResponse.arrayBuffer();
            const imageBytes = new Uint8Array(imageBuffer);
            let image;

            // Embed image based on URL or try JPEG first as fallback
            if (page.imageUrl.includes(".png")) {
              image = await pdfDoc.embedPng(imageBytes);
            } else if (page.imageUrl.includes(".gif")) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              try {
                image = await pdfDoc.embedJpg(imageBytes);
              } catch {
                image = await pdfDoc.embedPng(imageBytes);
              }
            }

            // Calculate scaled dimensions for image (top part of polaroid)
            const imageWidth = frameWidth - 30;
            const imageHeight = frameWidth - 30;

            // Position image at the top of the polaroid with a small margin
            const imageTopY = frameCenterY + frameHeight - 15; // top inner margin (reduced)
            const imageYPos = imageTopY - imageHeight; // place image so its top is imageTopY

            contentPage.drawImage(image, {
              x: frameCenterX + 10,
              y: imageYPos,
              width: imageWidth,
              height: imageHeight,
            });
          }
        } catch (error) {
          console.error(
            `Error loading image for page ${i + 1}:`,
            error,
          );
        }
      }
      // Draw image title (polaroid text - at the bottom, centered)
      // Clean title to remove emojis and non-ASCII characters
      const cleanedTitle = page.title ? this.removeEmojis(page.title) : "";
      if (cleanedTitle) {
        // Calculate centered position for title at bottom of polaroid
        const innerWidth = frameWidth - 20;
        const centeredOffset = this.calculateCenteredX(cleanedTitle, 11, innerWidth);
        const titleX = frameCenterX + 10 + centeredOffset;
        const titleY = frameCenterY + 20; // reduced bottom margin inside polaroid

        contentPage.drawText(cleanedTitle, {
          x: titleX,
          y: titleY,
          size: 11,
          font: titleFont,
          color: rgb(44 / 255, 36 / 255, 22 / 255), // #2c2416
          maxWidth: innerWidth,
        });
      }

      // Text section (right half)
      const textX = pageWidth / 2 + 20;
      const textWidth = (pageWidth / 2) - 50;

      // Page title (clean emojis for proper rendering)
      const pageTitleText = this.removeEmojis(page.title || "");
      contentPage.drawText(pageTitleText, {
        x: textX,
        y: pageHeight - 100,
        size: 22,
        font: titleFont,
        color: rgb(66 / 255, 74 / 255, 112 / 255), // #424a70
        maxWidth: textWidth,
        lineHeight: 28,
      });

      // Page description
      if (page.description) {
        contentPage.drawText(page.description, {
          x: textX,
          y: pageHeight - 250,
          size: 13,
          font: bodyFont,
          color: rgb(44 / 255, 36 / 255, 22 / 255), // #2c2416
          maxWidth: textWidth,
          lineHeight: 20,
        });
      }

      // Page number
      contentPage.drawText(`Página ${i + 1} de ${album.pages.length}`, {
        x: pageWidth - 150,
        y: 30,
        size: 10,
        font: lightFont,
        color: rgb(115 / 255, 116 / 255, 167 / 255), // #7374a7
      });
    }

    // Save PDF to buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Delete an album by ID
   * Verifies the user has access to the album before deleting
   */
  async deleteAlbum(userId: string, albumId: string): Promise<void> {
    // First, verify the album exists and user has access to it
    const { data: userGroup } = await this.supabase
      .from("users")
      .select("groupId")
      .eq("id", userId)
      .single();

    if (!userGroup?.groupId) {
      throw new ApiException(404, "User is not part of any family group");
    }

    const { data: album, error: albumError } = await this.supabase
      .from("memoriesAlbums")
      .select("id, groupId")
      .eq("id", albumId)
      .eq("groupId", userGroup.groupId)
      .single();

    if (albumError || !album) {
      throw new ApiException(404, "Album not found or you don't have access to it");
    }

    // Delete the album
    const { error: deleteError } = await this.supabase
      .from("memoriesAlbums")
      .delete()
      .eq("id", albumId);

    if (deleteError) {
      console.error("Error deleting album:", deleteError);
      throw new ApiException(500, "Error deleting album");
    }
  }
}
