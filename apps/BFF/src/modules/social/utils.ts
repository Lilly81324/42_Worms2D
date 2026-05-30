type UploadedMemoryFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

export function uploadedMemoryFileToForm(
  file: UploadedMemoryFile,
  fieldName = 'file',
  fallbackName = 'avatar.png',
) {
  const form = new FormData();
  const arrayBuffer = file.buffer!.buffer.slice(
    file.buffer!.byteOffset,
    file.buffer!.byteOffset + file.buffer!.byteLength,
  ) as ArrayBuffer;
  form.append(
    fieldName,
    new Blob([arrayBuffer], { type: file.mimetype ?? 'application/octet-stream' }),
    file.originalname ?? fallbackName,
  );
  return form;
}

export function sanitizeMetadata(input: unknown): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  if (typeof input === 'object' && input !== null) {
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value === undefined || value === null || value === '') continue;
      metadata[key] = value;
    }
  }
  return metadata;
}

/**
 * Build a FormData object from file buffer and metadata + file name.
 * Used by BFF to forward avatar uploads with combined metadata.
 */
export async function buildAvatarFormData(
  file: UploadedMemoryFile,
  fallbackName?: string,
): Promise<FormData> {
  return uploadedMemoryFileToForm(file, 'file', fallbackName ?? 'avatar.png');
}

/**
 * Persist profile metadata (via PATCH), then upload avatar if provided.
 * Returns updated profile.
 */
export async function saveProfileWithAvatar(
  userId: string,
  input: unknown,
  file: UploadedMemoryFile | undefined,
  callSocialService: (opts: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    data?: unknown;
    context: { requestId?: string; authorization?: string };
  }) => Promise<any>,
  context: { requestId?: string; authorization?: string },
): Promise<any> {
  const metadata = sanitizeMetadata(input);

  // Persist profile metadata through the JSON endpoint first.
  if (Object.keys(metadata).length > 0) {
    await callSocialService({
      method: 'PATCH',
      path: `/internal/users/${encodeURIComponent(userId)}/profile`,
      data: metadata,
      context,
    });
  }

  // If no avatar was uploaded, return current profile after metadata update.
  if (!file?.buffer) {
    return callSocialService({
      method: 'GET',
      path: `/internal/users/${encodeURIComponent(userId)}/profile`,
      context,
    });
  }

  const form = uploadedMemoryFileToForm(file, 'file', file.originalname ?? 'avatar.png');

  // Reuse avatar endpoint that is known to persist file and profile avatar id.
  return callSocialService({
    method: 'POST',
    path: `/internal/users/${encodeURIComponent(userId)}/avatar`,
    data: form,
    context,
  });
}

/**
 * Upload avatar file as multipart form.
 */
export async function uploadAvatarFile(
  userId: string,
  file: UploadedMemoryFile,
  callSocialService: (opts: {
    method: 'POST';
    path: string;
    data: FormData;
    context: { requestId?: string; authorization?: string };
    extraHeaders?: Record<string, string>;
  }) => Promise<any>,
  context: { requestId?: string; authorization?: string },
): Promise<any> {
  const form = uploadedMemoryFileToForm(file, 'file', file.originalname ?? 'avatar');
  return callSocialService({
    method: 'POST',
    path: `/internal/users/${encodeURIComponent(userId)}/avatar`,
    data: form,
    context,
    extraHeaders: {},
  });
}
