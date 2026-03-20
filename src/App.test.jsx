import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import * as geminiApi from './lib/gemini';
import { sanitizeInput, validateApiKey } from './lib/security';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock the Gemini API
vi.mock('./lib/gemini', () => ({
  parseEmergencyInput: vi.fn()
}));

// Mock Firebase so it doesn't crash in test environment
vi.mock('./lib/firebase', () => ({
  trackEvent: vi.fn(),
  saveTriageToDatabase: vi.fn().mockResolvedValue(true),
  authenticateUser: vi.fn().mockResolvedValue({ uid: 'mock-user-123' }),
  uploadImageToCloudStorage: vi.fn().mockResolvedValue('https://storage.googleapis.com/demo/image.png'),
  default: null
}));

describe('TriageOS App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
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
    
    fireEvent.change(input, { target: { value: 'AIzaSyC_valid_test_key_1234567890' } });
    fireEvent.click(submitBtn);

    expect(localStorage.getItem('gemini_api_key')).toBe('AIzaSyC_valid_test_key_1234567890');
    expect(screen.getByText(/Multi-Modal Stream/i)).toBeInTheDocument();
  });

  test('Rejects API key that is too short', () => {
    render(<App />);
    
    const input = screen.getByLabelText(/Google Gemini API Key/i);
    const submitBtn = screen.getByRole('button', { name: /Save API Key and start system/i });
    
    fireEvent.change(input, { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/too short/i);
    expect(localStorage.getItem('gemini_api_key')).toBeNull();
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

    expect(screen.getByText(/Processing Intelligence/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Severe Medical Emergency')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, Springfield')).toBeInTheDocument();
    }, { timeout: 3000 });

    const mapDiv = await screen.findByTitle(/Google Maps showing 123 Main St/i);
    expect(mapDiv).toBeInTheDocument();
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

  test('Mic button has correct aria-pressed attribute', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const micBtn = screen.getByRole('button', { name: /Start live voice dictation/i });
    expect(micBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('Input toolbar has correct ARIA role', () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const toolbar = screen.getByRole('toolbar', { name: /Input tools/i });
    expect(toolbar).toBeInTheDocument();
  });
});

// ===== SECURITY UNIT TESTS =====
describe('Security Utilities', () => {
  test('sanitizeInput strips HTML tags to prevent XSS', () => {
    expect(sanitizeInput('<script>alert("xss")</script>Hello')).toBe('Hello');
    expect(sanitizeInput('<img src=x onerror=alert(1)>')).toBe('');
    expect(sanitizeInput('Normal text input')).toBe('Normal text input');
  });

  test('sanitizeInput handles non-string input gracefully', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
  });

  test('validateApiKey rejects empty keys', () => {
    expect(validateApiKey('')).toEqual({ valid: false, message: 'API key is required.' });
    expect(validateApiKey(null)).toEqual({ valid: false, message: 'API key is required.' });
  });

  test('validateApiKey rejects short keys', () => {
    const result = validateApiKey('short');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('too short');
  });

  test('validateApiKey accepts valid-format keys', () => {
    const result = validateApiKey('AIzaSyC_valid_test_key_1234567890');
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  test('validateApiKey rejects keys with special characters', () => {
    const result = validateApiKey('AIzaSy<script>alert(1)</script>');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('invalid characters');
  });
});
