import { useState } from "react";
import { View, FlatList, Pressable, Image } from "react-native";
import {
  Text,
  ActivityIndicator,
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
  onTrackSelected: (trackId: string, trackData: SpotifyTrack) => void;
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

  const handleSaveTrack = () => {
    if (selectedTrack) {
      onTrackSelected(selectedTrack.id, selectedTrack);
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
          padding: 10,
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

  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        padding: 20,
        borderRadius: 20,
      }}
    >
      <Text style={{ ...STYLES.heading, marginBottom: 16 }}>Buscar en Spotify</Text>

      <StyledTextInput
        label="Nombre de la canción"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
        disabled={searchMutation.isPending || isUploading}
        marginBottom={16}
      />

      {searchMutation.isPending && (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{  marginTop: 12, color: COLORS.textSecondary }}>
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

      {isUploading && (
        <View style={{ paddingVertical: 32, alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{  marginTop: 12, color: COLORS.textSecondary }}>
            Guardando recuerdo...
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 16,
        }}
      >
        <View style={{ width: 120 }}>
          <CancelButton onPress={onCancel} disabled={isUploading || searchMutation.isPending} />
        </View>
        <View style={{ width: 120 }}>
          <SaveButton
            onPress={handleSaveTrack}
            text="Guardar"
            disabled={!selectedTrack || isUploading || searchMutation.isPending}
            loading={isUploading}
          />
        </View>
      </View>
    </View>
  );
}
