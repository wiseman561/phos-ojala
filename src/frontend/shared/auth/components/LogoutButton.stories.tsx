import type { Meta, StoryObj } from '@storybook/react';
import { LogoutButton } from './LogoutButton';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

const meta: Meta<typeof LogoutButton> = {
  title: 'Auth/LogoutButton',
  component: LogoutButton,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LogoutButton>;

export const Default: Story = {
  args: {
    variant: 'contained',
    color: 'primary',
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    color: 'primary',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    color: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'contained',
    color: 'secondary',
  },
};

export const Error: Story = {
  args: {
    variant: 'contained',
    color: 'error',
  },
}; 