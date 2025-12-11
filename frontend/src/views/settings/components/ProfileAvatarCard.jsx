import React from 'react';
import DefaultAvatar from '../../../assets/icons/user_default.svg';

export default function ProfileAvatarCard({
  user,
  initialLetter,
  onTriggerUpload,
  fileInputRef,
  onFileChange,
}) {
  const avatarSrc = user?.profile_picture || DefaultAvatar;
  const avatarAlt = user?.profile_picture
    ? 'Profile'
    : `Varsayılan profil ${initialLetter || ''}`.trim();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col items-center">
      <div className="relative inline-block">
        <div
          id="avatar"
          className="w-24 h-24 rounded-full avatar-glow flex items-center justify-center text-white text-3xl font-bold overflow-hidden"
        >
          <img
            src={avatarSrc}
            alt={avatarAlt || 'Profile'}
            className="w-full h-full object-cover object-center rounded-full"
          />
        </div>

        <button
          className="absolute -left-2 -bottom-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center p-0"
          id="avatar-camera-btn"
          type="button"
          title="Profil fotoğrafını değiştir"
          aria-label="Profil fotoğrafını değiştir"
          onClick={onTriggerUpload}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
            aria-hidden="true"
            className="w-4 h-4 text-gray-600"
          >
            <path d="M512 144v288c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V144c0-26.5 21.5-48 48-48h88l12.3-32.9c7-18.7 24.9-31.1 44.9-31.1h125.5c20 0 37.9 12.4 44.9 31.1L376 96h88c26.5 0 48 21.5 48 48zM376 288c0-66.2-53.8-120-120-120s-120 53.8-120 120 53.8 120 120 120 120-53.8 120-120zm-32 0c0 48.5-39.5 88-88 88s-88-39.5-88-88 39.5-88 88-88 88 39.5 88 88z" />
          </svg>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {user && (
        <div className="mt-4 text-center space-y-1">
          <div className="text-base font-semibold text-slate-900">{user.name || '-'}</div>
          <div className="text-xs text-slate-500 break-all">{user.email}</div>
        </div>
      )}
    </div>
  );
}
