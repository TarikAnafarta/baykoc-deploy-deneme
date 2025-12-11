import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl, parseJsonResponse, extractErrorMessage } from '../utils/api';

export async function authFetch(path, options = {}) {
  const token = localStorage.getItem('authToken');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData
      ? { Accept: 'application/json' }
      : { 'Content-Type': 'application/json', Accept: 'application/json' }),
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Token ${token}`;
  const res = await fetch(apiUrl(path), { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('authToken');
    window.location.replace('/login');
  }
  return res;
}

function buildFilterParams({ subject, konu, grup, alt_grup, grades }) {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (konu) params.append('konu', konu);
  if (grup) params.append('grup', grup);
  if (alt_grup) params.append('alt_grup', alt_grup);
  if (Array.isArray(grades) && grades.length > 0) params.append('grade', grades.join(','));
  return params;
}

export default function useGraphData() {
  const [graphContext, setGraphContext] = useState({ nodes: [], links: [], filters: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sourcesLoading, setSourcesLoading] = useState(true);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [konuOptions, setKonuOptions] = useState([]);
  const [grupOptions, setGrupOptions] = useState([]);
  const [altGrupOptions, setAltGrupOptions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedKonu, setSelectedKonu] = useState('');
  const [selectedGrup, setSelectedGrup] = useState('');
  const [selectedAltGrup, setSelectedAltGrup] = useState('');
  const [selectedGrades, setSelectedGrades] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
      setLoading(false);
      setSourcesLoading(false);
      window.location.replace('/login');
      return;
    }
    const controller = new AbortController();
    async function loadSubjects() {
      setSourcesLoading(true);
      try {
        const res = await authFetch('/api/graph/sources/', { signal: controller.signal });
        if (!res.ok) throw new Error('Ders listesi yüklenemedi');
        const data = await parseJsonResponse(res);
        if (controller.signal.aborted) return;
        const subjectKeys = Object.keys(data || {});
        setSubjects(subjectKeys);
        if (subjectKeys.length > 0) {
          setSelectedSubject((prev) => prev || subjectKeys[0]);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || 'Kaynaklar yüklenirken hata oluştu');
        setSubjects([]);
      } finally {
        if (!controller.signal.aborted) setSourcesLoading(false);
      }
    }
    loadSubjects();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setKonuOptions([]);
      setGrupOptions([]);
      setAltGrupOptions([]);
      return;
    }
    const controller = new AbortController();
    async function loadFilterOptions() {
      setFilterOptionsLoading(true);
      try {
        const baseParams = buildFilterParams({
          subject: selectedSubject,
          grades: selectedGrades,
        });
        const baseRes = await authFetch(`/api/graph/sources/?${baseParams.toString()}`, {
          signal: controller.signal,
        });
        if (!baseRes.ok) throw new Error('Ders seçenekleri yüklenemedi');
        const baseData = await parseJsonResponse(baseRes);
        if (controller.signal.aborted) return;
        setKonuOptions(Array.isArray(baseData.konular) ? baseData.konular : []);

        if (selectedKonu) {
          const konuParams = buildFilterParams({
            subject: selectedSubject,
            konu: selectedKonu,
            grades: selectedGrades,
          });
          const konuRes = await authFetch(`/api/graph/sources/?${konuParams.toString()}`, {
            signal: controller.signal,
          });
          if (!konuRes.ok) throw new Error('Konu seçenekleri yüklenemedi');
          const konuData = await parseJsonResponse(konuRes);
          if (controller.signal.aborted) return;
          setGrupOptions(Array.isArray(konuData.gruplar) ? konuData.gruplar : []);
        } else {
          setGrupOptions([]);
        }

        if (selectedGrup) {
          const grupParams = buildFilterParams({
            subject: selectedSubject,
            grup: selectedGrup,
            grades: selectedGrades,
          });
          const grupRes = await authFetch(`/api/graph/sources/?${grupParams.toString()}`, {
            signal: controller.signal,
          });
          if (!grupRes.ok) throw new Error('Alt grup seçenekleri yüklenemedi');
          const grupData = await parseJsonResponse(grupRes);
          if (controller.signal.aborted) return;
          setAltGrupOptions(Array.isArray(grupData.alt_gruplar) ? grupData.alt_gruplar : []);
        } else {
          setAltGrupOptions([]);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        // Keep previous options if a fetch fails so the UI doesn't collapse unexpectedly
        setKonuOptions((prev) => prev);
        setGrupOptions((prev) => prev);
        setAltGrupOptions((prev) => prev);
      } finally {
        if (!controller.signal.aborted) setFilterOptionsLoading(false);
      }
    }
    loadFilterOptions();
    return () => controller.abort();
  }, [selectedSubject, selectedKonu, selectedGrup, selectedGrades]);

  useEffect(() => {
    if (!selectedKonu) return;
    const exists = konuOptions.some((konu) => konu.slug === selectedKonu);
    if (!exists) {
      setSelectedKonu('');
      setSelectedGrup('');
      setSelectedAltGrup('');
      setGrupOptions([]);
      setAltGrupOptions([]);
    }
  }, [konuOptions, selectedKonu]);

  useEffect(() => {
    if (!selectedGrup) return;
    const exists = grupOptions.some((grup) => grup.slug === selectedGrup);
    if (!exists) {
      setSelectedGrup('');
      setSelectedAltGrup('');
      setAltGrupOptions([]);
    }
  }, [grupOptions, selectedGrup]);

  useEffect(() => {
    if (!selectedAltGrup) return;
    const exists = altGrupOptions.some((alt) => alt.slug === selectedAltGrup);
    if (!exists) setSelectedAltGrup('');
  }, [altGrupOptions, selectedAltGrup]);

  useEffect(() => {
    if (!selectedSubject) return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Oturum bulunamadı. Lütfen yeniden giriş yapın.');
      setLoading(false);
      window.location.replace('/login');
      return;
    }
    const controller = new AbortController();
    const filterSnapshot = {
      subject: selectedSubject,
      konu: selectedKonu,
      grup: selectedGrup,
      alt_grup: selectedAltGrup,
      grades: [...selectedGrades],
    };
    async function loadGraph() {
      setLoading(true);
      setError('');
      try {
        const params = buildFilterParams(filterSnapshot);
        const res = await authFetch(`/api/graph/data/?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await parseJsonResponse(res);
        if (!res.ok) {
          const serverMessage = extractErrorMessage(payload, 'Grafik verisi yüklenemedi');
          throw new Error(serverMessage);
        }
        if (controller.signal.aborted) return;
        const data = payload.data || payload;
        const { nodes = [], links = [] } = data;
        setGraphContext({ nodes, links, filters: filterSnapshot });
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || 'Grafik yüklenirken hata oluştu');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadGraph();
    return () => controller.abort();
  }, [selectedSubject, selectedKonu, selectedGrup, selectedAltGrup, selectedGrades]);

  const handleSubjectChange = useCallback((e) => {
    const newSubject = e.target.value;
    setSelectedSubject(newSubject);
    setSelectedKonu('');
    setSelectedGrup('');
    setSelectedAltGrup('');
    setKonuOptions([]);
    setGrupOptions([]);
    setAltGrupOptions([]);
  }, []);

  const handleKonuChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedKonu(value);
    setSelectedGrup('');
    setSelectedAltGrup('');
    setGrupOptions([]);
    setAltGrupOptions([]);
  }, []);

  const handleGrupChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedGrup(value);
    setSelectedAltGrup('');
    setAltGrupOptions([]);
  }, []);

  const handleAltGrupChange = useCallback((e) => {
    setSelectedAltGrup(e.target.value);
  }, []);

  const handleGradeToggle = useCallback((grade) => {
    setSelectedGrades((prev) => {
      const exists = prev.includes(grade);
      if (exists) return prev.filter((g) => g !== grade);
      return [...prev, grade];
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedKonu('');
    setSelectedGrup('');
    setSelectedAltGrup('');
    setSelectedGrades([]);
    setGrupOptions([]);
    setAltGrupOptions([]);
  }, []);

  const handlers = useMemo(
    () => ({
      handleSubjectChange,
      handleKonuChange,
      handleGrupChange,
      handleAltGrupChange,
      handleGradeToggle,
      handleResetFilters,
    }),
    [
      handleSubjectChange,
      handleKonuChange,
      handleGrupChange,
      handleAltGrupChange,
      handleGradeToggle,
      handleResetFilters,
    ],
  );

  const filterState = useMemo(() => {
    const hasGradeFilter = selectedGrades.length > 0;
    const canSelectGrup = !!selectedKonu;
    const canSelectAltGrup = !!selectedKonu && !!selectedGrup;
    const hasAnyFilter = Boolean(selectedKonu || selectedGrup || selectedAltGrup || hasGradeFilter);
    return {
      selectedSubject,
      selectedKonu,
      selectedGrup,
      selectedAltGrup,
      selectedGrades,
      subjects,
      konuOptions,
      grupOptions,
      altGrupOptions,
      sourcesLoading,
      filterOptionsLoading,
      hasGradeFilter,
      canSelectGrup,
      canSelectAltGrup,
      hasAnyFilter,
    };
  }, [
    selectedSubject,
    selectedKonu,
    selectedGrup,
    selectedAltGrup,
    selectedGrades,
    subjects,
    konuOptions,
    grupOptions,
    altGrupOptions,
    sourcesLoading,
    filterOptionsLoading,
  ]);

  return { graphContext, filterState, handlers, loading, error };
}
