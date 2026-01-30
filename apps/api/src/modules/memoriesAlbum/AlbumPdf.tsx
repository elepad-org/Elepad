import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { AlbumWithPages } from "./schema";

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    backgroundColor: "#faf8f5",
    position: "relative",
  },
  coverPage: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#424a70",
    padding: 60,
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: "bold",
    color: "white",
    marginBottom: 30,
    textAlign: "center",
  },
  coverDescription: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 1.6,
    marginBottom: 15,
  },
  coverFamily: {
    fontSize: 14,
    color: "white",
    fontStyle: "italic",
    marginTop: 30,
  },
  imageSection: {
    width: "50%",
    padding: 30,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  polaroidFrame: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    maxWidth: "90%",
    alignItems: "center",
  },
  image: {
    width: 260,
    height: 260,
    objectFit: "cover",
    borderRadius: 2,
  },
  polaroidText: {
    marginTop: 12,
    minHeight: 22,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2c2416",
  },
  textSection: {
    width: "50%",
    padding: 40,
    flexDirection: "column",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 22,
    color: "#424a70",
    marginBottom: 20,
    fontWeight: "bold",
    lineHeight: 1.3,
  },
  pageDescription: {
    fontSize: 13,
    color: "#2c2416",
    lineHeight: 1.8,
    textAlign: "justify",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 30,
    fontSize: 10,
    color: "#7374a7",
    fontStyle: "italic",
  },
});

interface Props {
  album: AlbumWithPages;
  familyName: string;
}

export function AlbumPDF({ album, familyName }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.coverPage}>
        <Text style={styles.coverTitle}>{album.title}</Text>
        <Text style={styles.coverDescription}>
          {album.description || "Un álbum de recuerdos familiares"}
        </Text>
        <Text style={styles.coverFamily}>{familyName}</Text>
      </Page>

      {album.pages.map((page, index) => (
        <Page
          key={page.id}
          size="A4"
          orientation="landscape"
          style={styles.page}
        >
              <View style={styles.imageSection}>
                {page.imageUrl && (
                  <View style={styles.polaroidFrame}>
                    <Image src={page.imageUrl} style={styles.image} />
                    <Text style={styles.polaroidText}>{page.title}</Text>
                  </View>
                )}
              </View>
              <View style={styles.textSection}>
                <Text style={styles.pageTitle}>{page.title}</Text>
                <Text style={styles.pageDescription}>{page.description}</Text>
                <Text style={styles.pageNumber}>Página {index + 1} de {album.pages.length}</Text>
              </View>
        </Page>
      ))}
    </Document>
  );
}
