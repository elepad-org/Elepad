import { useState } from "react";
import { View, FlatList, Pressable, Image, Keyboard } from "react-native";
import {
  Text,
  ActivityIndicator,
  TextInput as PaperTextInput,
  IconButton,
} from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import { StyledTextInput } from "../shared";
import CancelButton from "../shared/CancelButton";
import SaveButton from "../shared/SaveButton";
import { usePostSpotifySearch } from "@elepad/api-client";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url?: string;
  uri: string;
}

interface SpotifySearchComponentProps {
  onTrackSelected: (trackId: string, trackData: SpotifyTrack, description?: string) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

export default function SpotifySearchComponent({
  onTrackSelected,
  onCancel,
  isUploading = false,
}: SpotifySearchComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  // Step: "search" = buscar/seleccionar, "description" = agregar descripción opcional
  const [step, setStep] = useState<"search" | "description">("search");
  const [description, setDescription] = useState("");

  const searchMutation = usePostSpotifySearch();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Limpiar resultados y selección previos antes de buscar
    setSearchResults([]);
    setSelectedTrack(null);

    try {
      const result = await searchMutation.mutateAsync({
        data: {
          query: searchQuery,
          limit: 20,
        },
      });

      // El resultado viene en result.tracks.items (la API siempre devolverá `tracks`)
      if (result && 'tracks' in result) {
        const tracks = (result.tracks as { items: SpotifyTrack[] } | undefined)?.items ?? [];
        setSearchResults(tracks);
      }

      console.log("Spotify search results:", result);

    } catch (error) {
      console.error("Error searching Spotify:", error);
      setSearchResults([]);
    }
  };

  const handleContinueToDescription = () => {
    if (selectedTrack) {
      setStep("description");
    }
  };

  const handleBackToSearch = () => {
    setStep("search");
    setDescription("");
  };

  const handleSaveTrack = () => {
    if (selectedTrack) {
      const desc = description.trim() || undefined;
      onTrackSelected(selectedTrack.id, selectedTrack, desc);
    }
  };

  const renderTrackItem = ({ item }: { item: SpotifyTrack }) => {
    const albumCover = item.album?.images?.[2]?.url || item.album?.images?.[0]?.url;
    const artistsText = item.artists?.map((a) => a.name).join(", ") || "Artista desconocido";
    const isSelected = selectedTrack?.id === item.id;

    return (
      <Pressable
        onPress={() => setSelectedTrack(item)}
        style={({ pressed }) => ({
          flexDirection: "row",
          padding: 0,
          backgroundColor: isSelected
            ? COLORS.primary + "20"
            : pressed
              ? COLORS.backgroundSecondary
              : "transparent",
          borderRadius: 8,
          marginBottom: 4,
          borderWidth: 2,
          borderColor: isSelected ? COLORS.primary : "transparent",
        })}
        disabled={isUploading || searchMutation.isPending}
      >
        {albumCover && (
          <Image
            source={{ uri: albumCover }}
            style={{
              width: 65,
              height: 65,
              borderRadius: 4,
              marginRight: 12,
            }}
          />
        )}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text
            style={{
              ...STYLES.paragraphText,
              color: "#000",
              fontWeight: "600",
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <Text
            style={{

              color: COLORS.textSecondary,
              marginTop: 1,
              fontSize: 13,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {artistsText}
          </Text>
          <Text
            style={{

              color: COLORS.textPlaceholder,
              marginTop: 2,
              fontSize: 11,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.album?.name || ""}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Paso 2: Modal intermedio con preview de la canción y descripción opcional
  if (step === "description" && selectedTrack) {
    const albumCover = selectedTrack.album?.images?.[0]?.url || selectedTrack.album?.images?.[1]?.url;
    const artistsText = selectedTrack.artists?.map((a) => a.name).join(", ") || "Artista desconocido";

    return (
      <View
        style={{
          backgroundColor: COLORS.background,
          padding: 0,
          borderRadius: 20,
        }}
      >
        <Text style={{ ...STYLES.heading, marginBottom: 12 }}>Agregar recuerdo</Text>

        {/* Preview de la canción seleccionada */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#191414",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          {albumCover && (
            <Image
              source={{ uri: albumCover }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 6,
                marginRight: 12,
              }}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 15,
                fontFamily: "Montserrat",
              }}
              numberOfLines={1}
            >
              {selectedTrack.name}
            </Text>
            <Text
              style={{
                color: "#b3b3b3",
                fontSize: 13,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {artistsText}
            </Text>
            {selectedTrack.album?.name && (
              <Text
                style={{
                  color: "#666",
                  fontSize: 11,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {selectedTrack.album.name}
              </Text>
            )}
          </View>
          <IconButton
            icon="spotify"
            size={22}
            iconColor="#1DB954"
            style={{ margin: 0 }}
          />
        </View>

        {/* Input de descripción opcional */}
        <StyledTextInput
          label="Descripción (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          marginBottom={6}
          disabled={isUploading}
        />
        
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
            paddingBottom: 20,
          }}
        >
          <View style={{ width: 120 }}>
            <CancelButton
              onPress={handleBackToSearch}
              disabled={isUploading}
              text="Volver"
            />
          </View>
          <View style={{ width: 120 }}>
            <SaveButton
              onPress={handleSaveTrack}
              text={isUploading ? "Guardando..." : "Guardar"}
              disabled={isUploading}
              loading={isUploading}
            />
          </View>
        </View>
      </View>
    );
  }

  // Paso 1: Búsqueda y selección de canción
  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 0,
        borderRadius: 20,
      }}
    >
      <Text style={{ ...STYLES.heading, marginBottom: 5 }}>Buscar en Spotify</Text>

      <StyledTextInput
        label="Nombre de la canción"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        disabled={searchMutation.isPending || isUploading}
        marginBottom={6}
        right={
          <PaperTextInput.Icon
            icon="magnify"
            onPress={() => {
              Keyboard.dismiss();
              handleSearch();
            }}
            disabled={searchMutation.isPending || isUploading || !searchQuery.trim()}
          />
        }
      />

      {searchMutation.isPending && (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>
            Buscando en Spotify...
          </Text>
        </View>
      )}

      {!searchMutation.isPending && searchResults.length === 0 && searchQuery.trim() !== "" && (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <Text style={{ ...STYLES.paragraphText, color: COLORS.textSecondary }}>
            No se encontraron resultados
          </Text>
        </View>
      )}

      {!searchMutation.isPending && searchResults.length === 0 && searchQuery.trim() === "" && (
        <View style={{ paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ ...STYLES.paragraphText, color: COLORS.textPlaceholder, textAlign: "center" }}>
            Busca una canción de Spotify para agregarla como recuerdo.
          </Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          renderItem={renderTrackItem}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={true}
        />
      )}



      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
          paddingBottom: 20
        }}
      >
        <View style={{ width: 120 }}>
          <CancelButton onPress={onCancel} disabled={isUploading || searchMutation.isPending} />
        </View>
        <View style={{ width: 120 }}>
          <SaveButton
            onPress={handleContinueToDescription}
            text="Continuar"
            disabled={!selectedTrack || isUploading || searchMutation.isPending}
          />
        </View>
      </View>
    </View>
  );
}
