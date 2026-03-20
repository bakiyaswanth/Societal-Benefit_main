import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import * as geminiApi from './lib/gemini';
import { vi } from 'vitest';

// Mock the Gemini API
vi.mock('./lib/gemini', () => ({
  parseEmergencyInput: vi.fn()
}));

describe('TriageOS App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock the Speech Recognition API so tests don't crash
    window.SpeechRecognition = vi.fn();
    window.webkitSpeechRecognition = vi.fn();
  });

  test('Renders the API Key configuration screen initially (Security handling)', () => {
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

  test('Handles empty input validation securely (Efficiency/Validation)', async () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    render(<App />);
    
    const analyzeBtn = screen.getByRole('button', { name: /Extract & Triage Action Plan/i });
    fireEvent.click(analyzeBtn);

    expect(screen.getByText(/Please provide emergency text data or upload an image/i)).toBeInTheDocument();
  });

  test('Parses emergency input correctly and renders the Action Dashboard (Core Logic)', async () => {
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
  });

  test('Gracefully handles Gemini API rejection (Security/Edge Cases)', async () => {
    localStorage.setItem('gemini_api_key', 'TEST_KEY');
    geminiApi.parseEmergencyInput.mockRejectedValueOnce(new Error('Invalid API Key provided.'));

    render(<App />);
    
    const textArea = screen.getByPlaceholderText(/e.g. 'Massive pileup/i);
    fireEvent.change(textArea, { target: { value: 'Test input' } });
    
    const analyzeBtn = screen.getByRole('button', { name: /Extract & Triage Action Plan/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid API Key provided./i)).toBeInTheDocument();
    });
  });
});
