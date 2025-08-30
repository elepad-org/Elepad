/**
 * Converts a URI to a Blob object so it can be uploaded.
 * This is useful for the web, where for some reason creating an object with { uri, name, type } did not work.
 */
export async function uriToBlob(uri: string) {
  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new TypeError("uriToBlob failed"));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}
