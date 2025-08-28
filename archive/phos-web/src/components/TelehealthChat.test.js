import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TelehealthChat from './TelehealthChat';
import * as signalR from '@microsoft/signalr';

// Mock the SignalR library
jest.mock('@microsoft/signalr', () => {
  const mockConnection = {
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue(),
    on: jest.fn(),
    invoke: jest.fn().mockResolvedValue(),
  };

  return {
    HubConnectionBuilder: jest.fn().mockImplementation(() => {
      return {
        withUrl: jest.fn().mockReturnThis(),
        configureLogging: jest.fn().mockReturnThis(),
        withAutomaticReconnect: jest.fn().mockReturnThis(),
        build: jest.fn().mockImplementation(() => mockConnection),
      };
    }),
    LogLevel: {
      Information: 1
    },
    mockConnection
  };
});

describe('TelehealthChat Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the chat component with the provider name', () => {
    render(<TelehealthChat providerName="Dr. Johnson" />);
    expect(screen.getByText(/Telehealth Chat with Dr. Johnson/i)).toBeInTheDocument();
  });

  test('displays a loading indicator initially', () => {
    render(<TelehealthChat />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('user can type and send a message', async () => {
    render(<TelehealthChat username="TestUser" />);

    // Simulate connection complete
    signalR.mockConnection.on.mockImplementation((event, callback) => {
      if (event === 'ReceiveMessage') {
        setTimeout(() => {
          callback('TestUser', 'Hello, doctor!');
        }, 100);
      }
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Type a message
    const inputField = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(inputField, { target: { value: 'Hello, doctor!' } });
    expect(inputField.value).toBe('Hello, doctor!');

    // Send the message
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);

    // Verify the message was sent
    await waitFor(() => {
      expect(signalR.mockConnection.invoke).toHaveBeenCalledWith(
        'SendMessage', 
        'TestUser', 
        'Hello, doctor!'
      );
    });

    // Check that the message appears in the UI
    await waitFor(() => {
      expect(screen.getByText('Hello, doctor!')).toBeInTheDocument();
      expect(screen.getByText('You')).toBeInTheDocument();
    });
  });

  test('received messages are rendered correctly', async () => {
    render(<TelehealthChat username="TestUser" />);

    // Mock receiving a message
    signalR.mockConnection.on.mockImplementation((event, callback) => {
      if (event === 'ReceiveMessage') {
        // Simulate receiving a message from the doctor
        setTimeout(() => {
          callback('Dr. Smith', 'How are you feeling today?');
        }, 100);
      }
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check that the received message appears in the UI
    await waitFor(() => {
      expect(screen.getByText('How are you feeling today?')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
  });

  test('connection is established with auth token header', async () => {
    render(<TelehealthChat />);

    // Check that the connection was built with the right parameters
    expect(signalR.HubConnectionBuilder).toHaveBeenCalled();
    
    const mockBuild = signalR.HubConnectionBuilder().build;
    expect(mockBuild).toHaveBeenCalled();
    
    const mockWithUrl = signalR.HubConnectionBuilder().withUrl;
    expect(mockWithUrl).toHaveBeenCalledWith('/hubs/chat', {
      headers: {
        'X-Auth-Token': 'mock-auth-token-123'
      }
    });
  });
  
  test('connection is properly disposed on unmount', async () => {
    const { unmount } = render(<TelehealthChat />);
    
    // Simulate connection completion
    await waitFor(() => {
      expect(signalR.mockConnection.start).toHaveBeenCalled();
    });
    
    // Unmount the component
    unmount();
    
    // Check that the connection was stopped
    expect(signalR.mockConnection.stop).toHaveBeenCalled();
  });
}); 