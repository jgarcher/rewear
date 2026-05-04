"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeAvatar, updateProfile } from "@/app/profile/actions";

type Props = {
  initialName: string;
  initialAvatarUrl: string | null;
};

export function ProfileEditForm({ initialName, initialAvatarUrl }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleFile(file: File | null) {
    setError(null);
    setPendingFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSave() {
    setError(null);
    setDone(false);
    if (!name.trim()) {
      setError("Pick a name people will recognise.");
      return;
    }
    const fd = new FormData();
    fd.set("display_name", name.trim());
    if (pendingFile) fd.set("photo", pendingFile);
    startTransition(async () => {
      try {
        await updateProfile(fd);
        setDone(true);
        setPendingFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        // Server has updated avatar_url; pull the fresh value via revalidation
        router.refresh();
        setTimeout(() => setDone(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  }

  function handleRemovePhoto() {
    setError(null);
    startTransition(async () => {
      try {
        await removeAvatar();
        setAvatarUrl(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        setPendingFile(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't remove");
      }
    });
  }

  const display = previewUrl || avatarUrl;

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-linen-200">
          {display ? (
            <Image
              src={display}
              alt={name || "Profile"}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized={display.startsWith("blob:")}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-heading text-3xl font-medium text-charcoal-muted">
              {(name[0] ?? "?").toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-full border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal-soft transition-colors hover:border-forest-500 hover:text-forest-700"
          >
            {avatarUrl || previewUrl ? "Change photo" : "Add a photo"}
          </button>
          {(avatarUrl || previewUrl) && (
            <button
              type="button"
              onClick={previewUrl ? () => handleFile(null) : handleRemovePhoto}
              disabled={pending}
              className="ml-2 rounded-full px-4 py-2 text-sm font-medium text-charcoal-muted hover:text-error disabled:opacity-60"
            >
              Remove
            </button>
          )}
          <p className="mt-2 text-xs text-charcoal-muted">
            JPG or PNG, up to 8 MB.
          </p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-xs font-medium uppercase tracking-wider text-charcoal-muted"
        >
          Display name
        </label>
        <input
          id="display_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="What should friends call you?"
          className="mt-2 w-full rounded-2xl border border-linen-200 bg-linen-50 px-4 py-3 text-base text-charcoal placeholder:text-charcoal-placeholder focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
        />
      </div>

      {/* Save */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-full bg-forest-500 px-6 py-3 text-sm font-medium text-linen-100 transition-colors hover:bg-forest-600 disabled:opacity-60"
        >
          {pending ? "Saving…" : done ? "Saved ✓" : "Save"}
        </button>
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    </div>
  );
}
