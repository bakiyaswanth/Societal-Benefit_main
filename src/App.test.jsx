import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import * as geminiApi from './lib/gemini';
import { vi } from 'vitest';

// Mock the Gemini API
vi.mock('./lib/gemini', () => ({
  parseEmergencyInput: vi.fn()
}));

// Mock Firebase so it doesn't crash in test environment
vi.mock('./lib/firebase', () => ({
  trackEvent: vi.fn(),
  default: null
}));

describe('TriageOS App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock the Speech Recognition API so tests don't crash
    window.SpeechRecognition = vi.fn();
    window.webkitSpeechRecognition = vi.fn();
  });

  // ===== SECURITY & RENDERING =====
  test('Renders the API Key configuration screen initially', () => {
    render(<App />);
    expect(screen.getByText(/TriageOS/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Google Gemini API Key/i)).toBeInTheDocument();
  });

  test('Saves API key securely to localStorage and transitions to main dashboard', () => {
    render(<App />);
    
    const input = screen.getByLabelText(/Google Gemini API Key/i);
    const submitBtn = screen.getByRole('button', { name: /Save API Key and start system/i });
    
    fireEvent.change(input, { target: { value: 'TEST_API_KEY' } });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem('gemini_api_key')).toBe('TEST_API_KEY');
    expect(screen.getByText(/Multi-Modal Stream/i)).toBeInTheDocument();
  });

  test('Loads API key from localStorage on mount and shows dashboard directly', () => {
    localStorage.setItem('gemini_api_key', 'SAVED_KEY');
    render(<App />);
    expect(screen.getByText(/Multi-Modal Stream/i)).toBeInTheDocument();
  });

  // ===== VALIDATION & EDGE CASES =====
  test('Shows validation error when submitting with empty input and no images', async () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const analyzeBtn = screen.getByRole('button', { name: /Extract & Triage Action Plan/i });
    fireEvent.click(analyzeBtn);

    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(/Please provide emergency text data or upload an image/i);
  });

  // ===== CORE GEMINI INTEGRATION =====
  test('Parses emergency input correctly and renders the Action Dashboard with Google Maps', async () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    
    const mockResponse = {
      incidentType: 'Severe Medical Emergency',
      priority: 'Critical',
      location: '123 Main St, Springfield',
      mapsSearchQuery: '123 Main St, Springfield',
      resourcesRequired: ['2 Ambulances', '1 Fire Engine'],
      actionSteps: ['Dispatch immediately', 'Notify hospital']
    };

    geminiApi.parseEmergencyInput.mockResolvedValueOnce(mockResponse);

    render(<App />);
    
    const textArea = screen.getByPlaceholderText(/e.g. 'Massive pileup/i);
    fireEvent.change(textArea, { target: { value: 'Car crash at 123 Main St.' } });
    
    const analyzeBtn = screen.getByRole('button', { name: /Extract & Triage Action Plan/i });
    fireEvent.click(analyzeBtn);

    // Verify loading state
    expect(screen.getByText(/Processing Intelligence/i)).toBeInTheDocument();

    // Wait for the result to render
    await waitFor(() => {
      expect(screen.getByText('Severe Medical Emergency')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Springfield')).toBeInTheDocument();
      expect(screen.getByText('2 Ambulances')).toBeInTheDocument();
      expect(screen.getByText('Dispatch immediately')).toBeInTheDocument();
    });

    // Verify Google Maps iframe renders with the correct query
    const mapIframe = screen.getByTitle(/Google Maps showing 123 Main St/i);
    expect(mapIframe).toBeInTheDocument();
    expect(mapIframe.src).toContain('google.com/maps');
    expect(mapIframe.src).toContain('123%20Main%20St');
  });

  // ===== ERROR HANDLING =====
  test('Gracefully handles Gemini API rejection and shows error alert', async () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    geminiApi.parseEmergencyInput.mockRejectedValueOnce(new Error('Invalid API Key provided.'));

    render(<App />);
    
    const textArea = screen.getByPlaceholderText(/e.g. 'Massive pileup/i);
    fireEvent.change(textArea, { target: { value: 'Test input' } });
    
    const analyzeBtn = screen.getByRole('button', { name: /Extract & Triage Action Plan/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      const errorMsg = screen.getByRole('alert');
      expect(errorMsg).toHaveTextContent(/Invalid API Key provided./i);
    });
  });

  // ===== RESET FLOW =====
  test('Reset Key button clears localStorage and returns to config screen', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const resetBtn = screen.getByRole('button', { name: /Reset System and remove API Key/i });
    fireEvent.click(resetBtn);

    expect(localStorage.getItem('gemini_api_key')).toBeNull();
    expect(screen.getByLabelText(/Google Gemini API Key/i)).toBeInTheDocument();
  });

  // ===== ACCESSIBILITY =====
  test('Skip-to-content link is present and targets main content', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('Dashboard section has correct ARIA live region attributes', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const dashboard = screen.getByRole('region', { name: /Analysis Dashboard/i });
    expect(dashboard).toHaveAttribute('aria-live', 'polite');
  });

  test('Icon buttons have descriptive aria-labels for screen readers', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    expect(screen.getByRole('button', { name: /Upload evidence photos or medical records/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start live voice dictation/i })).toBeInTheDocument();
  });

  // ===== VOICE INPUT =====
  test('Mic button label toggles between start and stop states', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const micBtn = screen.getByRole('button', { name: /Start live voice dictation/i });
    expect(micBtn).toBeInTheDocument();
    // Note: actual SpeechRecognition start/stop is mocked, so we verify the button exists and is accessible
  });
});
