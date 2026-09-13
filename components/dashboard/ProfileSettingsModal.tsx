// components/dashboard/ProfileSettingsModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2, Check, Loader2, User, Palette, Shield } from "lucide-react";
import { useDashboard } from "@/app/protected/DashboardContext";
import { updateProfile, uploadAvatar, type ThemeKey } from "@/app/actions/profile";
import SignOutButton from "@/app/protected/sign-out-button";

function formatProfileModalError(err: string): string {
  if (err === "DATABASE_ERROR") {
    const isDev = process.env.NODE_ENV !== "production";
    return isDev
      ? "Database Error: The profiles table or columns (theme, avatar_url) need migration in Supabase. Please apply migration 010."
      : "Unable to save profile changes right now. Please try again or refresh the page.";
  }
  return err;
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: {
  key: ThemeKey;
  name: string;
  subtitle: string;
  palette: string[];
}[] = [
  {
    key: "dark",
    name: "IRL XP Dark",
    subtitle: "Midnight Navy & Warm Gold",
    palette: ["#080C14", "#162035", "#F5C362"],
  },
  {
    key: "crimson",
    name: "Crimson Knight",
    subtitle: "Dark Charcoal & Blood Red",
    palette: ["#0D080C", "#2C1829", "#EF4444"],
  },
  {
    key: "arcane",
    name: "Arcane Night",
    subtitle: "Deep Midnight & Arcane Violet",
    palette: ["#090714", "#221B48", "#A78BFA"],
  },
];

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { displayName, avatarUrl, theme, updateProfileState } = useDashboard();

  const [name, setName] = useState(displayName);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>(theme);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(displayName);
      setSelectedTheme(theme);
      setAvatarPreview(avatarUrl);
      setAvatarFile(null);
      setError(null);
    }
  }, [isOpen, displayName, theme, avatarUrl]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar file size must be less than 5MB.");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Display name must be between 2 and 50 characters.");
      return;
    }

    setSaving(true);

    try {
      let finalAvatarUrl = avatarPreview;

      // If user uploaded a new avatar file
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const uploadRes = await uploadAvatar(formData);
        if (uploadRes.error) {
          setError(formatProfileModalError(uploadRes.error));
          setSaving(false);
          return;
        }
        finalAvatarUrl = uploadRes.data?.avatarUrl || null;
      } else if (avatarPreview === null && avatarUrl !== null) {
        // User explicitly removed avatar
        finalAvatarUrl = null;
      }

      // Update profile in Supabase
      const updateRes = await updateProfile({
        display_name: trimmedName,
        theme: selectedTheme,
        avatar_url: finalAvatarUrl,
      });

      if (updateRes.error) {
        setError(formatProfileModalError(updateRes.error));
        setSaving(false);
        return;
      }

      // Update application state
      updateProfileState({
        display_name: trimmedName,
        theme: selectedTheme,
        avatar_url: finalAvatarUrl,
      });

      onClose();
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="xp-panel w-full max-w-lg p-6 sm:p-7 relative border border-[var(--xp-border-gold)] shadow-2xl my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          aria-label="Close settings"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[var(--xp-text-muted)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-6 pb-3 border-b border-white/[0.08]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/10 text-[var(--xp-gold)]">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 id="profile-settings-title" className="font-rpg text-lg font-bold tracking-wide text-white">
              Adventurer Profile & Settings
            </h2>
            <p className="text-xs text-[var(--xp-text-muted)] font-serif italic">
              Customize your identity and visual realm.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-xs text-red-300 font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* 1. Avatar Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Portrait Avatar</span>
            </label>

            <div className="flex items-center gap-4 p-3.5 rounded-xl border border-white/[0.08] bg-[var(--xp-void-raised)]">
              {/* Avatar Preview */}
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--xp-border-gold)] overflow-hidden bg-black/50 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreview || "/assets/character_portrait.jpg"}
                  alt="Portrait Preview"
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Upload / Remove Actions */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="avatar-file-input"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--xp-border-gold)]/60 bg-[var(--xp-gold)]/10 hover:bg-[var(--xp-gold)]/20 text-xs font-semibold text-[var(--xp-gold)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Portrait</span>
                  </button>

                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/30 hover:bg-red-950/50 text-xs font-semibold text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-[var(--xp-text-faint)]">
                  Supports JPG, PNG, WebP (Max 5MB).
                </span>
              </div>
            </div>
          </div>

          {/* 2. Display Name Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="display-name" className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Display Name
              </label>
              <span className="text-[10px] text-[var(--xp-text-faint)]">{name.length}/50</span>
            </div>
            <input
              id="display-name"
              type="text"
              required
              disabled={saving}
              minLength={2}
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Shubham Banerjee"
              className="w-full rounded-xl border border-white/10 bg-[#0D1322] px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:border-[var(--xp-border-gold)] focus:outline-none transition-colors"
            />
          </div>

          {/* 3. Theme Customization Section */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              <span>Theme Atmosphere</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {THEME_OPTIONS.map((item) => {
                const isSelected = selectedTheme === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedTheme(item.key)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-[var(--xp-border-gold)] bg-[var(--xp-gold)]/15 shadow-md shadow-[var(--xp-gold)]/10"
                        : "border-white/[0.08] bg-[var(--xp-void-raised)] hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Palette Dots */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {item.palette.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-3.5 w-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      {isSelected && (
                        <div className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[var(--xp-gold)] text-[#080C14]">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] text-[var(--xp-text-muted)] mt-0.5 leading-tight">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
            <SignOutButton />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-[var(--xp-text-muted)] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="xp-btn-gold px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSettingsModal;
