// Helper function to trigger file download from a data string
export const downloadFile = (filename: string, content: string, mimeType: string) => {
  const element = document.createElement('a');
  element.setAttribute('href', `${mimeType},${encodeURIComponent(content)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Helper function to trigger file download from a Blob
export const downloadBlob = (filename: string, blob: Blob) => {
  const element = document.createElement('a');
  const url = URL.createObjectURL(blob);
  element.setAttribute('href', url);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url);
};
