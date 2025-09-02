import React from 'react';
import { render, screen, waitFor, createEvent, waitMs, mockApiResponse } from '../../utils/test-utils';
// Import our custom matcher types
import '../../types/jest.d';

// Sample component for testing
const TestComponent: React.FC<{
  onClick: () => void;
  fetchData?: () => Promise<any>;
}> = ({ onClick, fetchData }) => {
  const [data, setData] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFetch = async () => {
    try {
      if (fetchData) {
        const result = await fetchData();
        setData(result.message);
      }
    } catch (err) {
      setError('Error fetching data');
    }
  };

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={onClick} data-testid="click-button">Click Me</button>
      <button onClick={handleFetch} data-testid="fetch-button">Fetch Data</button>
      {data && <div data-testid="data">{data}</div>}
      {error && <div data-testid="error">{error}</div>}
    </div>
  );
};

describe('Test Utilities', () => {
  test('renders component and handles clicks', async () => {
    // Setup
    const handleClick = jest.fn();
    const user = createEvent();

    // Render with custom utilities
    render(<TestComponent onClick={handleClick} />);

    // Assert component renders correctly
    expect(screen.getByText('Test Component')).toBeInTheDocument();

    // Use userEvent to click the button
    await user.click(screen.getByTestId('click-button'));

    // Assert the click handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('handles async operations with waitFor', async () => {
    // Setup mock function that will resolve after a delay
    const mockFetch = jest.fn().mockImplementation(async () => {
      await waitMs(100);
      return { message: 'Data loaded successfully' };
    });

    const handleClick = jest.fn();
    const user = createEvent();

    // Render the component
    render(<TestComponent onClick={handleClick} fetchData={mockFetch} />);

    // Click the fetch button
    await user.click(screen.getByTestId('fetch-button'));

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(screen.getByTestId('data')).toBeInTheDocument();
    });

    // Assert the data was loaded correctly
    expect(screen.getByTestId('data')).toHaveTextContent('Data loaded successfully');
  });

  test('uses custom matchers', () => {
    // Example of our custom matchers
    expect(10).toBeWithinRange(5, 15);
    expect('apple').toMatchOneOf(['banana', 'apple', 'orange']);

    // Standard Jest matchers
    expect('hello').toMatch(/^h/);
    expect([1, 2, 3]).toContain(1);
    expect([1, 2, 3]).toEqual(expect.arrayContaining([1, 2]));
  });

  test('mocks API responses', async () => {
    // Setup a mock fetch function using our utility
    const mockFetch = jest.fn().mockResolvedValue(
      mockApiResponse({ message: 'API response success' })
    );

    // Replace global fetch with our mock
    global.fetch = mockFetch;

    // Make a fetch call
    const response = await fetch('/api/data');
    const data = await response.json();

    // Assert the response is correct
    expect(data).toEqual({ message: 'API response success' });
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
});
