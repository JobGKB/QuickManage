// ===========================
// FME Server Conversion Service
// ===========================
// Uploads a zipped .gdb to the Laravel backend proxy, which forwards it to FME Server.
// FME converts the File Geodatabase to GeoPackage (.gpkg) and returns it.

/**
 * Upload a zipped .gdb file to FME Server (via backend proxy) and receive a .gpkg back.
 * @param {File} file - The zipped .gdb file
 * @param {function} setLoadingFn - Loading state callback
 * @returns {Promise<ArrayBuffer>} - The .gpkg file as an ArrayBuffer
 */
export const convertGdbToGpkg = async (file, setLoadingFn) => {
  setLoadingFn(true, "GDB uploaden naar FME Server…");

  const formData = new FormData();
  formData.append("file", file);

  // Get CSRF token from meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const response = await fetch("/api/quickdataviewer/convert-gdb", {
    method: "POST",
    headers: {
      ...(csrfToken ? { "X-CSRF-TOKEN": csrfToken } : {}),
      "Accept": "application/octet-stream",
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `Server fout (${response.status})`;
    } catch {
      errorMessage = `FME Server fout (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  setLoadingFn(true, "GPKG ontvangen, verwerken…");
  const gpkgBuffer = await response.arrayBuffer();

  if (!gpkgBuffer || gpkgBuffer.byteLength === 0) {
    throw new Error("FME Server gaf een leeg bestand terug.");
  }

  return gpkgBuffer;
};
