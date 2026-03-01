import { useState } from "react";
import { View, FlatList, Pressable, Image } from "react-native";
import {
  Dialog,
  Text,
  ActivityIndicator,
  IconButton,
} from "react-native-paper";
import { STYLES, COLORS } from "@/styles/base";
import { StyledTextInput } from "../shared";
import CancelButton from "../shared/CancelButton";
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

  const searchMutation = usePostSpotifySearch();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await searchMutation.mutateAsync({
        data: {
          query: searchQuery,
          limit: 20,
        },
      });

      // El resultado viene en result.tracks.items (la API siempre devolverá `tracks`)
      if (result && 'tracks' in result) {
        const tracks = (result as any).tracks?.items ?? [];
        setSearchResults(tracks);
      }

      console.log("Spotify search results:", result);
      
    } catch (error) {
      console.error("Error searching Spotify:", error);
      setSearchResults([]);
    }
  };

  const renderTrackItem = ({ item }: { item: SpotifyTrack }) => {
    const albumCover = item.album?.images?.[2]?.url || item.album?.images?.[0]?.url;
    const artistsText = item.artists?.map((a) => a.name).join(", ") || "Artista desconocido";

    return (
      <Pressable
        onPress={() => onTrackSelected(item.id, item)}
        style={({ pressed }) => ({
          flexDirection: "row",
          padding: 12,
          backgroundColor: pressed
            ? COLORS.backgroundSecondary
            : "transparent",
          borderRadius: 8,
          marginBottom: 8,
        })}
        disabled={isUploading}
      >
        {albumCover && (
          <Image
            source={{ uri: albumCover }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 4,
              marginRight: 12,
            }}
          />
        )}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text
            style={STYLES.paragraphText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <Text
            style={{
            
              color: COLORS.textSecondary,
              marginTop: 2,
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
        <View style={{ justifyContent: "center" }}>
          <IconButton
            icon="music"
            size={20}
            iconColor={COLORS.primary}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Dialog.Title style={STYLES.heading}>Buscar en Spotify</Dialog.Title>
      <Dialog.Content style={{ paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <StyledTextInput
              label="Buscar canción o artista"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              autoFocus
              returnKeyType="search"
            />
          </View>
          <IconButton
            icon="magnify"
            size={28}
            iconColor={COLORS.primary}
            onPress={handleSearch}
            disabled={searchMutation.isPending || isUploading}
          />
        </View>

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
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <Text style={{ ...STYLES.paragraphText, color: COLORS.textPlaceholder, textAlign: "center" }}>
              Busca tu canción favorita en Spotify para agregarla como recuerdo
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
      </Dialog.Content>
      <Dialog.Actions
        style={{
          paddingBottom: 12,
          paddingHorizontal: 24,
          justifyContent: "center",
        }}
      >
        <CancelButton onPress={onCancel} disabled={isUploading} />
      </Dialog.Actions>
    </>
  );
}
