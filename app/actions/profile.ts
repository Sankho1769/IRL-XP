"use server";

import { createClient } from "@/lib/supabase/server";

export type ThemeKey = "dark" | "crimson" | "arcane";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  theme: ThemeKey;
  created_at?: string;
  updated_at?: string;
};

type ActionResult<T> =
  | { data: T; error?: undefined }
  | { data?: undefined; error: string };

const VALID_THEMES: ThemeKey[] = ["dark", "crimson", "arcane"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validates image buffer magic bytes against allowed image formats (JPEG, PNG, WebP)
 * and ensures executable files or scripts are strictly rejected.
 */
function validateImageMagicBytes(
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } {
  if (buffer.length < 12) {
    return { valid: false, error: "Invalid image file: file too small or corrupted." };
  }

  // Explicitly reject executable / script headers
  // PE executable (Windows .exe, .dll): "MZ"
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return { valid: false, error: "Executable files are strictly forbidden." };
  }
  // ELF executable (Linux): "\x7fELF"
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return { valid: false, error: "Executable files are strictly forbidden." };
  }
  // Script shebang: "#!"
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return { valid: false, error: "Script files are strictly forbidden." };
  }

  // Magic byte checks
  // JPEG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  // WebP: RIFF....WEBP
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    return {
      valid: false,
      error: "Invalid image format. Magic bytes do not match JPEG, PNG, or WebP.",
    };
  }

  // Verify consistency with declared MIME type
  if (mimeType === "image/jpeg" && !isJpeg) {
    return { valid: false, error: "File content does not match declared JPEG format." };
  }
  if (mimeType === "image/png" && !isPng) {
    return { valid: false, error: "File content does not match declared PNG format." };
  }
  if (mimeType === "image/webp" && !isWebp) {
    return { valid: false, error: "File content does not match declared WebP format." };
  }

  return { valid: true };
}

function formatProfileError(error: any, fallbackMessage: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && error) {
    const code = error.code ? ` [${error.code}]` : "";
    const msg = error.message || error.details || fallbackMessage;
    return `Database Error${code}: ${msg}`;
  }
  return fallbackMessage;
}

/**
 * Retrieves the profile for the authenticated user.
 */
export async function getProfile(): Promise<ActionResult<Profile>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "UNAUTHENTICATED" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, theme, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116" || error.code === "42703" || error.code === "PGRST204") {
      // Row doesn't exist yet or columns not migrated; try querying base columns
      const defaultName = user.email ? user.email.split("@")[0] : "Player";
      
      const { data: baseRow } = await supabase
        .from("profiles")
        .select("id, display_name, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (baseRow) {
        return {
          data: {
            id: baseRow.id,
            display_name: baseRow.display_name || defaultName,
            avatar_url: null,
            theme: "dark",
            created_at: baseRow.created_at,
            updated_at: baseRow.updated_at,
          },
        };
      }

      // If no row exists at all, provide safe fallback
      return {
        data: {
          id: user.id,
          display_name: defaultName,
          avatar_url: null,
          theme: "dark",
        },
      };
    }
    console.error("[getProfile] Supabase error:", error);
    return {
      error: formatProfileError(
        error,
        "Unable to load adventurer profile. Please refresh the page."
      ),
    };
  }

  return {
    data: {
      id: data.id,
      display_name: data.display_name || (user.email ? user.email.split("@")[0] : "Player"),
      avatar_url: data.avatar_url || null,
      theme: (VALID_THEMES.includes(data.theme as ThemeKey) ? data.theme : "dark") as ThemeKey,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  };
}

/**
 * Updates profile fields: display_name, avatar_url, and/or theme.
 * Rejects base64/data URLs strictly.
 * Uses upsert with fallback to ensure rows are created if missing.
 */
export async function updateProfile(input: {
  display_name?: string;
  avatar_url?: string | null;
  theme?: ThemeKey;
}): Promise<ActionResult<Profile>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "UNAUTHENTICATED" };
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // 1. Validate display_name
  if (input.display_name !== undefined) {
    const trimmed = input.display_name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      return { error: "Display name must be between 2 and 50 characters." };
    }
    updates.display_name = trimmed;
  }

  // 2. Validate theme
  if (input.theme !== undefined) {
    if (!VALID_THEMES.includes(input.theme)) {
      return { error: "Invalid theme selection." };
    }
    updates.theme = input.theme;
  }

  // 3. Validate avatar_url (strictly no data URLs)
  if (input.avatar_url !== undefined) {
    if (input.avatar_url === null || input.avatar_url === "") {
      updates.avatar_url = null;
    } else {
      if (input.avatar_url.startsWith("data:")) {
        return {
          error: "Direct image data URLs are not allowed. Please upload your avatar via storage.",
        };
      } else if (
        input.avatar_url.startsWith("https://") ||
        input.avatar_url.startsWith("http://") ||
        input.avatar_url.startsWith("/")
      ) {
        updates.avatar_url = input.avatar_url;
      } else {
        return { error: "Invalid avatar format." };
      }
    }
  }

  // First attempt: upsert with full fields (idempotent for existing and newly created profiles)
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        ...updates,
      },
      { onConflict: "id" }
    )
    .select("id, display_name, avatar_url, theme, created_at, updated_at")
    .single();

  if (error) {
    // If avatar_url or theme columns are not yet present in the schema cache (code 42703 or PGRST204)
    if (error.code === "42703" || error.code === "PGRST204") {
      console.warn("[updateProfile] Columns not yet migrated, saving base profile fields:", error.message);
      
      const fallbackUpdates: Record<string, any> = {
        id: user.id,
        updated_at: updates.updated_at,
      };
      if (updates.display_name !== undefined) {
        fallbackUpdates.display_name = updates.display_name;
      }

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("profiles")
        .upsert(fallbackUpdates, { onConflict: "id" })
        .select("id, display_name, created_at, updated_at")
        .single();

      if (!fallbackError && fallbackData) {
        return {
          data: {
            id: fallbackData.id,
            display_name: fallbackData.display_name || "Player",
            avatar_url: input.avatar_url || null,
            theme: input.theme || "dark",
            created_at: fallbackData.created_at,
            updated_at: fallbackData.updated_at,
          },
        };
      }
    }

    console.error("[updateProfile] Supabase error:", error);
    return {
      error: formatProfileError(
        error,
        "Unable to save profile changes. Please try again."
      ),
    };
  }

  return {
    data: {
      id: data.id,
      display_name: data.display_name || "Player",
      avatar_url: data.avatar_url || null,
      theme: (VALID_THEMES.includes(data.theme as ThemeKey) ? data.theme : "dark") as ThemeKey,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  };
}

/**
 * Handles avatar image upload via FormData.
 * Strictly uploads to Supabase Storage. Does NOT fall back to base64 data URLs.
 * If storage upload fails, returns a clear error and leaves avatar_url unchanged.
 */
export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult<{ avatarUrl: string }>> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "UNAUTHENTICATED" };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { error: "No image file provided." };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: "Only JPG, PNG, and WebP images are allowed." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File size exceeds 5MB limit." };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate magic bytes against header signatures and reject executables/scripts
  const magicValidation = validateImageMagicBytes(buffer, file.type);
  if (!magicValidation.valid) {
    return { error: magicValidation.error || "Invalid image file format." };
  }

  const fileExt = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filePath = `${user.id}/avatar.${fileExt}`;

  // Attempt upload to Supabase storage bucket 'avatars'
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[uploadAvatar] Storage upload failed:", uploadError);
    const isDev = process.env.NODE_ENV !== "production";
    const userError = isDev
      ? `Storage Error: ${uploadError.message}. Ensure the 'avatars' bucket is created in Supabase.`
      : "Failed to upload avatar to storage. Please check permissions and try again.";
    return {
      error: userError,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Append a cache-busting timestamp so browser re-fetches updated image
  const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

  // Save publicUrl in profiles table
  const updated = await updateProfile({ avatar_url: publicUrlWithTimestamp });
  if (updated.error) {
    return { error: updated.error };
  }

  return { data: { avatarUrl: publicUrlWithTimestamp } };
}
