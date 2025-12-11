import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import GraphPage from '../views/graph/Graph.jsx';

// Simple mock for window.location.replace so we can assert redirects
const originalLocation = window.location;

beforeAll(() => {
  // @ts-ignore
  delete window.location;
  // @ts-ignore
  window.location = { ...originalLocation, replace: vi.fn() };
});

afterAll(() => {
  window.location = originalLocation;
});

// Helper: build a sources payload compatible with new backend format
// Backend now returns: { "matematik": [{slug, label}, ...], "turk_dili_ve_edebiyati": [...] }
function buildSourcesPayload(subjects) {
  const result = {};
  for (const [key, labels] of Object.entries(subjects)) {
    result[key] = labels.map((label) => ({ slug: label, label }));
  }
  return result;
}

function buildFilterPayload({ konular = [], gruplar = [], altGruplar = [] }) {
  return {
    konular: konular.map((label) => ({ slug: label, label })),
    gruplar: gruplar.map((label) => ({ slug: label, label })),
    alt_gruplar: altGruplar.map((label) => ({ slug: label, label })),
  };
}

function countFetchCalls(substring) {
  return global.fetch.mock.calls.filter(([url]) => url.includes(substring)).length;
}

describe('GraphPage', () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-ignore
    window.location.replace.mockClear();
  });

  it('redirects to /login if no authToken is present', () => {
    render(<GraphPage />);
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });

  it('loads sources and graph data when token exists', async () => {
    localStorage.setItem('authToken', 'test-token');

    // mock fetch for sources then graph data (new sources shape)
    const sourcesResponse = buildSourcesPayload({ matematik: ['sayilar-ve-cebir'] });
    const graphResponse = {
      data: {
        subject: 'matematik',
        file: 'matematik_kazanimlari.json',
        nodes: [],
        links: [],
      },
    };

    global.fetch = vi
      .fn()
      // first call: /api/graph/sources/
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => sourcesResponse,
      })
      // second call: /api/graph/sources/?subject=
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildFilterPayload({ konular: ['sayilar-ve-cebir'] }),
      })
      // third call: /api/graph/data/
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => graphResponse,
      });

    render(<GraphPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // we expect at least the first call to be to the sources endpoint
    const firstCallUrl = global.fetch.mock.calls[0][0];
    expect(firstCallUrl).toContain('/api/graph/sources/');
  });

  it('clears token and redirects on 401 from graph data', async () => {
    localStorage.setItem('authToken', 'test-token');

    global.fetch = vi
      .fn()
      // sources (new format)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildSourcesPayload({ matematik: ['sayilar-ve-cebir'] }),
      })
      // filtered source options
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildFilterPayload({ konular: ['sayilar-ve-cebir'] }),
      })
      // graph data 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

    render(<GraphPage />);

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith('/login');
    });

    expect(localStorage.getItem('authToken')).toBeNull();
  });
});

describe('GraphPage interactions', () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-ignore
    window.location.replace.mockClear();
    global.fetch = vi.fn();
  });

  it('refetches graph data when subject changes', async () => {
    localStorage.setItem('authToken', 'test-token');

    global.fetch
      // sources: two subjects (new format)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () =>
          buildSourcesPayload({
            matematik: ['sayilar-ve-cebir'],
            turk_dili_ve_edebiyati: ['turk-dili-ve-edebiyati'],
          }),
      })
      // initial filter options
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildFilterPayload({ konular: ['sayilar-ve-cebir'] }),
      })
      // first graph call
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { subject: 'matematik', nodes: [], links: [] } }),
      })
      // filter options after subject change
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildFilterPayload({ konular: ['turk-dili-ve-edebiyati'] }),
      })
      // second graph call after subject change
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { subject: 'turk_dili_ve_edebiyati', nodes: [], links: [] } }),
      });

    render(<GraphPage />);

    await waitFor(() => {
      expect(countFetchCalls('/api/graph/data/')).toBe(1);
    });

    const subjectSelect = screen.getByLabelText(/Ders \(subject\)/i);
    fireEvent.change(subjectSelect, { target: { value: 'turk_dili_ve_edebiyati' } });

    await waitFor(() => {
      expect(countFetchCalls('/api/graph/data/')).toBe(2);
    });
  });

  it('shows error banner when graph API returns an error', async () => {
    localStorage.setItem('authToken', 'test-token');

    global.fetch
      // sources
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildSourcesPayload({ matematik: ['sayilar-ve-cebir'] }),
      })
      // filter options
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildFilterPayload({ konular: ['sayilar-ve-cebir'] }),
      })
      // graph data: 500 error
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal error' }),
      });

    render(<GraphPage />);

    await waitFor(() => {
      const errors = screen.getAllByText(/Internal error/);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('keeps selected konu and grup when deeper filter responses omit parent options', async () => {
    localStorage.setItem('authToken', 'test-token');

    global.fetch
      // initial sources
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => buildSourcesPayload({ matematik: ['sayilar-ve-cebir'] }),
      })
      // initial filter options
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () =>
          buildFilterPayload({ konular: ['sayilar-ve-cebir'], gruplar: ['ustel-ve-log'] }),
      })
      // initial graph data
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { subject: 'matematik', nodes: [], links: [] } }),
      })
      // filter options after konu selection
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () =>
          buildFilterPayload({ konular: ['sayilar-ve-cebir'], gruplar: ['ustel-ve-log'] }),
      })
      // graph data after konu selection
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { subject: 'matematik', nodes: [], links: [] } }),
      })
      // filter options after grup selection (konular omitted)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () =>
          buildFilterPayload({ konular: [], gruplar: ['ustel-ve-log'], altGruplar: ['alt-a'] }),
      })
      // graph data after grup selection
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { subject: 'matematik', nodes: [], links: [] } }),
      });

    render(<GraphPage />);

    const konuSelect = await screen.findByLabelText(/Konu \(opsiyonel\)/i);
    await waitFor(() => {
      expect(konuSelect).not.toHaveAttribute('disabled');
    });
    fireEvent.change(konuSelect, { target: { value: 'sayilar-ve-cebir' } });

    const grupSelect = await screen.findByLabelText(/^Grup \(opsiyonel\)$/i);
    await waitFor(() => {
      expect(grupSelect).not.toHaveAttribute('disabled');
    });
    fireEvent.change(grupSelect, { target: { value: 'ustel-ve-log' } });

    await waitFor(() => {
      expect(grupSelect.value).toBe('ustel-ve-log');
      expect(konuSelect.value).toBe('sayilar-ve-cebir');
    });
  });
});
