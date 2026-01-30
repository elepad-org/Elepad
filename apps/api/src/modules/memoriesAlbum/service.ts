import fs from "fs";
import os from "os";
import path from "path";
import { ApiException } from "@/utils/api-error";
import { GoogleGenAI, Part } from "@google/genai";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/supabase-types";
import { CreateAlbumRequest, AlbumWithPages, Album } from "./schema";
import { NotificationsService } from "../notifications/service";
import { uploadAlbumCoverImage } from "@/services/storage";
//import puppeteer from "puppeteer";
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
    this.processAlbumNarratives(album.id, userId, userGroup.groupId).catch(
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
   * Generate HTML template for album PDF
   */
  //Comentado por ahora para poder realizar el deploy
  /* private generateAlbumHTML(album: AlbumWithPages, familyName: string): string {
    const pagesHTML = album.pages
      .map((page, index) => {
        const imageUrl = page.imageUrl || "";
        const title = page.title || `Página ${index + 1}`;
        const description = page.description || "";

        return `
      <div class="page">
        <div class="page-content">
          <div class="image-section">
            <div class="polaroid-frame">
              <img src="${imageUrl}" alt="${title}" />
              <div class="polaroid-text">${title}</div>
            </div>
          </div>
          <div class="text-section">
            <h2 class="page-title">${title}</h2>
            <p class="page-description">${description}</p>
            <div class="page-number">Página ${index + 1} de ${album.pages.length}</div>
          </div>
        </div>
      </div>
    `;
      })
      .join("");

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${album.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', serif;
      background: #f5f5f5;
    }

    .cover-page {
      width: 297mm;
      height: 210mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #9a9ece 0%, #424a70 100%);
      color: white;
      page-break-after: always;
      padding: 40mm;
    }

    .cover-title {
      font-size: 48pt;
      font-weight: bold;
      margin-bottom: 20mm;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .cover-description {
      font-size: 18pt;
      text-align: center;
      max-width: 200mm;
      line-height: 1.6;
      margin-bottom: 10mm;
    }

    .cover-family {
      font-size: 14pt;
      font-style: italic;
      margin-top: 20mm;
    }

    .page {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      background: 
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 2px,
          rgba(157, 145, 125, 0.03) 2px,
          rgba(157, 145, 125, 0.03) 4px
        ),
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(157, 145, 125, 0.03) 2px,
          rgba(157, 145, 125, 0.03) 4px
        ),
        linear-gradient(180deg, #faf8f5 0%, #f5f2ed 100%);
      position: relative;
    }

    .page-content {
      width: 100%;
      height: 100%;
      display: flex;
    }

    .image-section {
      width: 50%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 15mm;
    }

    .polaroid-frame {
      background: white;
      padding: 12mm;
      border-radius: 4px;
      box-shadow: 
        0 10px 25px rgba(0, 0, 0, 0.1),
        0 20px 48px rgba(0, 0, 0, 0.05);
      transform: rotate(-2deg);
      max-width: 100%;
      max-height: 100%;
      display: flex;
      flex-direction: column;
    }

    .image-section img {
      width: 100%;
      height: auto;
      max-height: 140mm;
      object-fit: cover;
      border-radius: 2px;
      display: block;
    }

    .polaroid-text {
      margin-top: 8mm;
      min-height: 12mm;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2c2416;
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      font-family: 'Georgia', cursive;
    }

    .text-section {
      width: 50%;
      height: 100%;
      padding: 20mm 25mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
    }

    .page-title {
      font-size: 24pt;
      color: #424a70;
      margin-bottom: 15mm;
      line-height: 1.3;
      font-weight: 600;
    }

    .page-description {
      font-size: 14pt;
      color: #2c2416;
      line-height: 1.8;
      text-align: justify;
    }

    .page-number {
      position: absolute;
      bottom: 10mm;
      right: 20mm;
      font-size: 10pt;
      color: #7374a7;
      font-style: italic;
    }

    @page {
      size: A4 landscape;
      margin: 0;
    }

    @media print {
      body {
        background: white;
      }
      
      .page, .cover-page {
        page-break-after: always;
        page-break-inside: avoid;
      }

      .page:last-child, .cover-page:last-child {
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <h1 class="cover-title">${album.title}</h1>
    <p class="cover-description">${album.description || "Un álbum de recuerdos familiares"}</p>
    <p class="cover-family">${familyName}</p>
  </div>

  <!-- Album Pages -->
  ${pagesHTML}
</body>
</html>
    `.trim();
  } */

  /**
   * Export album to PDF
   */
/* 
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

    // Generate HTML
    const html = this.generateAlbumHTML(albumWithPages, familyName);

    let browser;
    try {
      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });

      const page = await browser.newPage();

      // Set content and wait for images to load
      await page.setContent(html, {
        waitUntil: ["networkidle0", "load"],
        timeout: 60000,
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        timeout: 60000,
      });

      await browser.close();

      // Upload to Supabase Storage
      const pdfUrl = await uploadAlbumPDF(
        this.supabase,
        userGroup.groupId,
        albumId,
        Buffer.from(pdfBuffer),
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
      if (browser) {
        await browser.close();
      }
      console.error("Error generating PDF:", error);
      throw new ApiException(500, "Error generating album PDF");
    }
  }
   */
}
