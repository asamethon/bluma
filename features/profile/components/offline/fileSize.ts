export const formatFileSize = (sizeInKB: number) => (
  sizeInKB < 1024 ? `${sizeInKB.toFixed(1)} KB` : `${(sizeInKB / 1024).toFixed(1)} MB`
);
