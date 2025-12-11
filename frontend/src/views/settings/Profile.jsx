import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ProfileAlert from './components/ProfileAlert';
import ProfileHeader from './components/ProfileHeader';
import ProfileAvatarCard from './components/ProfileAvatarCard';
import ProfileInfoView from './components/ProfileInfoView';
import ProfileEditForm from './components/ProfileEditForm';
import ProfileCropperModal from './components/ProfileCropperModal';
import ThemeToggle from '../../ui/ThemeToggle';
import { apiUrl, parseJsonResponse, extractErrorMessage } from '../../utils/api';

const TRACK_LABELS = {
  lgs: 'LGS',
  sayisal: 'Sayısal',
  sozel: 'Sözel',
  dil: 'Dil',
};

const trackLabel = (t) => TRACK_LABELS[t] || t;

const trackOptions = [
  {
    value: 'sayisal',
    title: 'Sayısal',
    accent: {
      border: 'border-emerald-400/70',
      ring: 'ring-emerald-200/70',
      dot: 'bg-emerald-500',
    },
  },
  {
    value: 'sozel',
    title: 'Sözel',
    accent: {
      border: 'border-sky-400/70',
      ring: 'ring-sky-200/70',
      dot: 'bg-sky-500',
    },
  },
  {
    value: 'dil',
    title: 'Dil',
    accent: {
      border: 'border-amber-400/70',
      ring: 'ring-amber-200/70',
      dot: 'bg-amber-500',
    },
  },
];

const gradeOptions = [
  { value: '5', label: '5. Sınıf' },
  { value: '6', label: '6. Sınıf' },
  { value: '7', label: '7. Sınıf' },
  { value: '8', label: '8. Sınıf' },
  { value: '9', label: '9. Sınıf' },
  { value: '10', label: '10. Sınıf' },
  { value: '11', label: '11. Sınıf' },
  { value: '12', label: '12. Sınıf' },
  { value: 'mezun', label: 'Mezun' },
];

const languageOptions = [
  { value: 'almanca', label: 'Almanca' },
  { value: 'arapca', label: 'Arapça' },
  { value: 'fransizca', label: 'Fransızca' },
  { value: 'ingilizce', label: 'İngilizce' },
  { value: 'rusca', label: 'Rusça' },
];

const languageLabelMap = languageOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const gradeToNumber = (value) => {
  if (value === 'mezun' || value === 13) return 13;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeGradeValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (value === 'mezun') return 'mezun';
  return String(value);
};

const gradeLabel = (value) => {
  if (value === 'mezun' || Number(value) === 13) {
    return 'Mezun';
  }
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return `${value}. Sınıf`;
};

const languageLabel = (value) => languageLabelMap[value] || '-';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user: authUser, token: authToken, setAuthData, clearAuth } = useAuth();
  const { palette, theme, mode, toggleTheme, setTheme, setSystemMode } = useTheme();
  const token = authToken || localStorage.getItem('authToken') || '';
  const [user, setUser] = useState(authUser);
  const [alertState, setAlertState] = useState({ type: '', message: '', show: false });
  const [edit, setEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('9');
  const [editTrack, setEditTrack] = useState('lgs');
  const [editLanguage, setEditLanguage] = useState('');

  const fileInputRef = useRef(null);

  // Cropper refs/state (imperative, mirrors template logic)
  const [circleD, setCircleD] = useState(240);
  const frameRef = useRef(null);
  const maskRef = useRef(null);
  const cropRef = useRef({
    url: null,
    imgEl: null,
    frameEl: null,
    maskEl: null,
    d: 240,
    naturalW: 0,
    naturalH: 0,
    scale: 1,
    minScale: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [cropUrl, setCropUrl] = useState(null);
  const gradeNumeric = gradeToNumber(editGrade);
  const isLgsLocked = gradeNumeric !== null && gradeNumeric <= 8;
  const initialLetter = useMemo(() => {
    const identity = user?.name || user?.email || 'K';
    return identity.trim().charAt(0).toUpperCase();
  }, [user?.name, user?.email]);
  const themeStatusLabel =
    mode === 'system' ? 'Sistem Modu' : theme === 'dark' ? 'Karanlık Mod' : 'Aydınlık Mod';
  const themeDescription =
    mode === 'system'
      ? 'Cihazının tema ayarına otomatik uyum sağlıyoruz.'
      : theme === 'dark'
        ? 'Düşük ışıklı ortamlar için koyu tonlar etkin.'
        : 'Parlak yüzeyler ve ferah bir görünüm kullanılıyor.';
  const themeCards = [
    {
      key: 'light',
      title: 'Aydınlık',
      subtitle: 'Gündüz ve yüksek kontrastlı kullanım',
      active: mode !== 'system' && theme === 'light',
      action: () => setTheme('light'),
    },
    {
      key: 'dark',
      title: 'Karanlık',
      subtitle: 'Gece ve düşük ışık için ideal',
      active: mode !== 'system' && theme === 'dark',
      action: () => setTheme('dark'),
    },
    {
      key: 'system',
      title: 'Sistem',
      subtitle: 'Cihaz ayarınla senkron',
      active: mode === 'system',
      action: setSystemMode,
    },
  ];

  function showAlert(message, type = 'success') {
    setAlertState({ message, type, show: true });
    setTimeout(() => setAlertState((a) => ({ ...a, show: false })), 5000);
  }

  // DRY helper to load current user (memoized for hooks)
  const fetchUser = useCallback(
    async (currentToken) => {
      try {
        const res = await fetch(apiUrl('/api/users/me/'), {
          headers: { Authorization: `Token ${currentToken}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          localStorage.removeItem('authToken');
          clearAuth();
          navigate('/login', { replace: true });
          return null;
        }
        const payload = await parseJsonResponse(res);
        if (!payload || typeof payload !== 'object') {
          showAlert('Kullanıcı bilgileri alınamadı. Lütfen tekrar deneyin.', 'error');
          return null;
        }
        setUser(payload);
        setAuthData(currentToken, payload);
        return payload;
      } catch (err) {
        showAlert(
          'Kullanıcı bilgileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.',
          'error',
        );
        return null;
      }
    },
    [navigate, setAuthData, clearAuth],
  );

  // initial user load
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    (async () => {
      await fetchUser(token);
    })();
  }, [token, fetchUser, navigate]);

  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  const closeCropper = () => {
    setCropUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setModalOpen(false);
    const crop = cropRef.current;
    if (crop) {
      crop.url = null;
      crop.imgEl = null;
      crop.naturalW = 0;
      crop.naturalH = 0;
      crop.scale = 1;
      crop.minScale = 1;
      crop.offsetX = 0;
      crop.offsetY = 0;
      crop.dragging = false;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  function toggleEdit() {
    if (!user) return;
    setEditName(user.name || '');
    const normalizedGrade = normalizeGradeValue(user.grade ?? '');
    const gradeValue = normalizedGrade || '9';
    setEditGrade(gradeValue);
    const existingGradeNumber = gradeToNumber(user.grade);
    const fallbackTrack =
      user.track || (existingGradeNumber !== null && existingGradeNumber <= 8 ? 'lgs' : 'sayisal');
    setEditTrack(fallbackTrack);
    setEditLanguage(fallbackTrack === 'dil' ? user.language || '' : '');
    setEdit(true);
  }
  function cancelEdit() {
    setEdit(false);
  }

  async function saveProfile() {
    try {
      const name = editName.trim();
      const track = isLgsLocked ? 'lgs' : editTrack;
      if (!name) {
        showAlert('İsim boş bırakılamaz', 'error');
        return;
      }
      if (!editGrade) {
        showAlert('Sınıf bilgisi zorunludur', 'error');
        return;
      }
      if (track === 'dil' && !editLanguage) {
        showAlert('Dil alanı için yabancı dil seçmelisiniz', 'error');
        return;
      }
      const payload = {
        name,
        grade: editGrade,
        track,
        language: track === 'dil' ? editLanguage : null,
      };
      const res = await fetch(apiUrl('/api/users/me/'), {
        method: 'PUT',
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('authToken');
        navigate('/login', { replace: true });
        return;
      }
      const responseBody = await parseJsonResponse(res);
      if (!res.ok || !responseBody || typeof responseBody !== 'object') {
        const errorSource =
          (typeof responseBody === 'object' && responseBody !== null &&
            (responseBody.message ||
              responseBody.track?.[0] ||
              responseBody.grade?.[0] ||
              responseBody.language?.[0])) ||
          extractErrorMessage(responseBody, 'Profil güncellenirken bir hata oluştu');
        showAlert(errorSource, 'error');
        return;
      }
      const updated = responseBody;
      setUser(updated);
      setAuthData(token, updated);
      setEdit(false);
      showAlert('Profil başarıyla güncellendi! ✓', 'success');
    } catch (e) {
      showAlert('Profil güncellenirken bir hata oluştu', 'error');
    }
  }

  // Open file -> open modal and initialize cropper
  function openCropper(file) {
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    const url = URL.createObjectURL(file);
    setCropUrl(url);
    setModalOpen(true);
  }

  // Move helpers above their first usage
  function clampOffsets(crop, x, y) {
    const W = crop.naturalW * crop.scale;
    const H = crop.naturalH * crop.scale;
    const maxX = Math.max(0, (W - crop.d) / 2);
    const maxY = Math.max(0, (H - crop.d) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) };
  }
  function updateCropTransform(crop) {
    const img = crop.imgEl;
    if (!img) return;
    img.style.transform = `translate(-50%, -50%) scale(${crop.scale}) translate(${crop.offsetX / crop.scale}px, ${crop.offsetY / crop.scale}px)`;
  }

  useEffect(() => {
    if (!modalOpen) return;
    const crop = cropRef.current;
    crop.frameEl = frameRef.current;
    crop.maskEl = maskRef.current;
    crop.imgEl = document.getElementById('crop-image');

    if (!crop.frameEl || !crop.maskEl || !crop.imgEl) return;

    // Compute diameter and set frame height + CSS var like template
    const rect = crop.frameEl.getBoundingClientRect();
    const frameW = rect.width || crop.frameEl.clientWidth || 560;
    crop.d = Math.floor(frameW - 80);
    crop.d = Math.max(160, Math.min(320, crop.d));
    setCircleD(crop.d);
    crop.frameEl.style.height = crop.d + 'px';
    crop.frameEl.style.position = 'relative';
    crop.maskEl.style.setProperty('--d', crop.d + 'px');

    // Load image and initialize scales/offsets
    if (crop.url) {
      URL.revokeObjectURL(crop.url);
    }
    crop.url = cropUrl;
    crop.imgEl.onload = () => {
      crop.naturalW = crop.imgEl.naturalWidth || crop.imgEl.width;
      crop.naturalH = crop.imgEl.naturalHeight || crop.imgEl.height;
      const needW = crop.d / crop.naturalW;
      const needH = crop.d / crop.naturalH;
      crop.minScale = Math.max(needW, needH);
      // Start slightly zoomed in so the image appears larger initially (preserve full functionality)
      const initialFactor = 1.3; // 130% of minScale
      crop.scale = crop.minScale * initialFactor;
      // Reset offsets to center and clamp to ensure image stays within the circular mask
      crop.offsetX = 0;
      crop.offsetY = 0;
      // ensure offsets are integers to avoid subpixel rounding issues
      crop.offsetX = Math.round(crop.offsetX);
      crop.offsetY = Math.round(crop.offsetY);
      const clamped = clampOffsets(crop, crop.offsetX, crop.offsetY);
      crop.offsetX = clamped.x;
      crop.offsetY = clamped.y;

      // Make sure the image element uses its intrinsic size so transforms are predictable
      try {
        crop.imgEl.style.width = crop.naturalW + 'px';
        crop.imgEl.style.height = crop.naturalH + 'px';
        crop.imgEl.style.maxWidth = 'none';
        crop.imgEl.style.maxHeight = 'none';
      } catch (e) {
        // ignore if DOM manipulation fails
      }

      const zoom = document.getElementById('zoom-range');
      const zoomLabel = document.getElementById('zoom-label');
      if (zoom) {
        zoom.value = String(Math.round(initialFactor * 100)); // e.g. '130'
      }
      if (zoomLabel) {
        zoomLabel.textContent = Math.round(initialFactor * 100) + '%';
      }
      updateCropTransform(crop);
    };
    crop.imgEl.src = cropUrl;

    // Drag handlers
    const onDown = (cx, cy) => {
      crop.dragging = true;
      crop.dragStartX = cx;
      crop.dragStartY = cy;
      crop.startOffsetX = crop.offsetX;
      crop.startOffsetY = crop.offsetY;
    };
    const onMove = (cx, cy) => {
      if (!crop.dragging) return;
      const dx = cx - crop.dragStartX;
      const dy = cy - crop.dragStartY;
      const nextX = crop.startOffsetX + dx;
      const nextY = crop.startOffsetY + dy;
      const clamped = clampOffsets(crop, nextX, nextY);
      crop.offsetX = clamped.x;
      crop.offsetY = clamped.y;
      updateCropTransform(crop);
    };
    const onUp = () => {
      crop.dragging = false;
    };

    const frame = crop.frameEl;
    frame.onmousedown = (e) => onDown(e.clientX, e.clientY);
    window.onmousemove = (e) => onMove(e.clientX, e.clientY);
    window.onmouseup = onUp;

    frame.ontouchstart = (e) => {
      if (e.touches[0]) onDown(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.ontouchmove = (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.ontouchend = onUp;

    // Zoom range
    const zoom = document.getElementById('zoom-range');
    const zoomLabel = document.getElementById('zoom-label');
    if (zoom) {
      zoom.oninput = (e) => {
        const factor = Number(e.target.value) / 100;
        crop.scale = crop.minScale * factor;
        if (zoomLabel) {
          zoomLabel.textContent = Math.round(factor * 100) + '%';
        }
        // keep image within circle after zoom
        const clamped = clampOffsets(crop, crop.offsetX, crop.offsetY);
        crop.offsetX = clamped.x;
        crop.offsetY = clamped.y;
        updateCropTransform(crop);
      };
    }

    // Mouse wheel zoom like template
    frame.onwheel = (e) => {
      e.preventDefault();
      const zoomInput = document.getElementById('zoom-range');
      if (!zoomInput) return;
      const min = Number(zoomInput.min) || 100;
      const max = Number(zoomInput.max) || 300;
      const step = e.ctrlKey ? 10 : 5;
      let val = Number(zoomInput.value) || 100;
      val += e.deltaY < 0 ? step : -step;
      val = Math.max(min, Math.min(max, val));
      zoomInput.value = String(val);
      const factor = val / 100;
      crop.scale = crop.minScale * factor;
      if (zoomLabel) {
        zoomLabel.textContent = Math.round(factor * 100) + '%';
      }
      const clamped = clampOffsets(crop, crop.offsetX, crop.offsetY);
      crop.offsetX = clamped.x;
      crop.offsetY = clamped.y;
      updateCropTransform(crop);
    };

    return () => {
      window.onmousemove = null;
      window.onmouseup = null;
      window.ontouchmove = null;
      window.ontouchend = null;
      if (frame) frame.onwheel = null;
    };
  }, [modalOpen, cropUrl]);

  async function saveCropped() {
    const crop = cropRef.current;
    const d = crop.d;
    const canvas = document.createElement('canvas');
    canvas.width = d;
    canvas.height = d;
    const ctx = canvas.getContext('2d');

    const W = crop.naturalW * crop.scale;
    const H = crop.naturalH * crop.scale;
    const x = d / 2 - W / 2 + crop.offsetX;
    const y = d / 2 - H / 2 + crop.offsetY;

    ctx.fillStyle = palette?.surface || '#ffffff';
    ctx.fillRect(0, 0, d, d);

    const img = crop.imgEl;
    ctx.drawImage(img, x, y, W, H);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      showAlert('Blob oluşturulamadı', 'error');
      return;
    }

    const form = new FormData();
    form.append('profile_picture', blob, 'profile.jpg');

    try {
      showAlert('Profil resmi yükleniyor...', 'success');
      const res = await fetch(apiUrl('/api/users/me/'), {
        method: 'PATCH',
        headers: { Authorization: `Token ${token}` },
        body: form,
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('authToken');
        navigate('/login', { replace: true });
        return;
      }
      const responseBody = await parseJsonResponse(res);
      if (!res.ok || !responseBody || typeof responseBody !== 'object') {
        const message = extractErrorMessage(
          responseBody,
          'Profil resmi yüklenirken bir hata oluştu',
        );
        showAlert(message, 'error');
        return;
      }
      const updated = responseBody;
      setUser(updated);
      setAuthData(token, updated);
      setModalOpen(false);
      await fetchUser(token); // ensure latest profile is loaded
      showAlert('Profil resmi başarıyla güncellendi! ✓', 'success');
    } catch (e) {
      showAlert('Profil resmi yüklenirken bir hata oluştu', 'error');
    }
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert('Lütfen bir resim dosyası seçin', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Dosya boyutu en fazla 5MB olabilir', 'error');
      return;
    }
    openCropper(file);
  }

  const handleGradeChange = (value) => {
    setEditGrade(value);
    const numeric = gradeToNumber(value);
    if (numeric !== null && numeric <= 8) {
      setEditTrack('lgs');
      setEditLanguage('');
    } else if (editTrack === 'lgs') {
      setEditTrack('sayisal');
    }
  };

  const handleTrackChange = (value) => {
    setEditTrack(value);
    if (value !== 'dil') {
      setEditLanguage('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 py-10 px-4">
      <ProfileAlert alertState={alertState} />

      <ProfileHeader onBack={() => navigate(-1)} />

      <div className="max-w-5xl mx-auto grid gap-8 items-start lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <ProfileAvatarCard
            user={user}
            initialLetter={initialLetter}
            onTriggerUpload={triggerFilePicker}
            fileInputRef={fileInputRef}
            onFileChange={onFileChange}
          />

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Görünüm</p>
                <h2 className="mt-1 text-lg font-semibold">Tema Tercihi</h2>
                <p className="mt-1 text-sm text-slate-500">{themeDescription}</p>
              </div>
              <ThemeToggle className="scale-110" />
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeCards.map(({ key, title, subtitle, active, action }) => (
                <button
                  key={key}
                  type="button"
                  onClick={action}
                  aria-pressed={active}
                  className={`rounded-2xl border px-4 py-3 text-left transition shadow-sm ${
                    active
                      ? 'border-indigo-400 bg-white/60'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-white/40'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-900">{title}</span>
                  <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-white/60 px-3 py-1 font-semibold text-slate-700">
                {themeStatusLabel}
              </span>
              <p className="flex-1 min-w-[200px]">
                Tema ayarların profilinden yönetilir ve tüm cihazlarında geçerlidir.
              </p>
              {mode !== 'system' ? (
                <button
                  type="button"
                  onClick={setSystemMode}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Sistem varsayılanını kullan
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Manuel moda geç
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Profil Bilgileri</h1>
              <p className="mt-1 text-sm text-slate-500">
                İsim, sınıf ve alan bilgilerinizi güncelleyebilirsiniz.
              </p>
            </div>
            {!edit ? (
              <button
                type="button"
                onClick={toggleEdit}
                className="inline-flex items-center rounded-full bg-indigo-500/90 px-4 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Düzenle
              </button>
            ) : null}
          </div>

          {!edit && user && (
            <ProfileInfoView
              user={user}
              trackLabel={trackLabel}
              gradeLabel={gradeLabel}
              languageLabel={languageLabel}
            />
          )}

          {edit && (
            <ProfileEditForm
              editName={editName}
              setEditName={setEditName}
              gradeOptions={gradeOptions}
              editGrade={editGrade}
              handleGradeChange={handleGradeChange}
              isLgsLocked={isLgsLocked}
              editTrack={editTrack}
              handleTrackChange={handleTrackChange}
              trackOptions={trackOptions}
              editLanguage={editLanguage}
              setEditLanguage={setEditLanguage}
              languageOptions={languageOptions}
              onCancel={cancelEdit}
              onSave={saveProfile}
            />
          )}
        </div>
      </div>

      <ProfileCropperModal
        modalOpen={modalOpen}
        circleD={circleD}
        frameRef={frameRef}
        maskRef={maskRef}
        onClose={closeCropper}
        onSave={saveCropped}
        onReselect={triggerFilePicker}
      />
    </div>
  );
}
