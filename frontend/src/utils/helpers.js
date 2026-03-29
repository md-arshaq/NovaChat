export const getAvatarUrl = (path, backendUrl) => {
  if (!path) return null;
  // If the path is already an absolute URL (like Cloudinary), return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Otherwise, it's a local relative path, prepend the backend URL
  return `${backendUrl}${path}`;
};
