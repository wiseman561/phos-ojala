import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../../../../theme';
import ProgramEffectivenessCard from '../ProgramEffectivenessCard';

// Define types for the component data
interface ProgramComparison {
  name: string;
  participants: number;
  enrollmentRate: number;
  enrollmentRank: number;
  engagementRate: number;
  engagementRank: number;
  healthImpactRate: number;
  healthImpactRank: number;
  roiRate: number;
  roiRank: number;
}

interface Recommendation {
  title: string;
  description: string;
  impact: string;
}

interface ProgramData {
  periodStart: string;
  periodEnd: string;
  lastUpdated: string;
  enrollmentRate: number;
  enrollmentTarget: number;
  enrollmentTrend: number;
  activeParticipationRate: number;
  participationTarget: number;
  participationTrend: number;
  avgWeeklyEngagement: number;
  engagementTarget: number;
  engagementTrend: number;
  completionRate: number;
  completionTarget: number;
  completionTrend: number;
  avgHealthScoreImprovement: number;
  healthScoreTarget: number;
  healthScoreTrend: number;
  riskReductionRate: number;
  riskReductionTarget: number;
  riskReductionTrend: number;
  biometricImprovementRate: number;
  biometricTarget: number;
  biometricTrend: number;
  preventiveCareRate: number;
  preventiveCareTarget: number;
  preventiveCareTrend: number;
  programComparison?: ProgramComparison[];
  recommendations?: Recommendation[];
}

// Mock data with proper typing
const mockProgramData: ProgramData = {
  periodStart: '2024-01-01',
  periodEnd: '2024-03-31',
  lastUpdated: '2024-04-01',

  // Enrollment & Engagement metrics
  enrollmentRate: 85,
  enrollmentTarget: 90,
  enrollmentTrend: 5,

  activeParticipationRate: 75,
  participationTarget: 80,
  participationTrend: 3,

  avgWeeklyEngagement: 4.5,
  engagementTarget: 5,
  engagementTrend: -1,

  completionRate: 70,
  completionTarget: 75,
  completionTrend: 2,

  // Health Outcomes metrics
  avgHealthScoreImprovement: 8.5,
  healthScoreTarget: 10,
  healthScoreTrend: 4,

  riskReductionRate: 25,
  riskReductionTarget: 30,
  riskReductionTrend: 6,

  biometricImprovementRate: 65,
  biometricTarget: 70,
  biometricTrend: 3,

  preventiveCareRate: 80,
  preventiveCareTarget: 85,
  preventiveCareTrend: 5,

  // Program comparison data
  programComparison: [
    {
      name: 'Wellness Program A',
      participants: 500,
      enrollmentRate: 85,
      enrollmentRank: 1,
      engagementRate: 75,
      engagementRank: 2,
      healthImpactRate: 70,
      healthImpactRank: 1,
      roiRate: 3.5,
      roiRank: 2
    }
  ],

  // Recommendations
  recommendations: [
    {
      title: 'Increase Engagement',
      description: 'Implement weekly challenges to boost participation',
      impact: 'Medium'
    }
  ]
};

interface Props {
  programData?: ProgramData;
  onDownloadClick?: () => void;
  onMoreClick?: () => void;
}

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('ProgramEffectivenessCard', () => {
  const mockDownloadClick = jest.fn();
  const mockMoreClick = jest.fn();

  // Cleanup after each test
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const renderComponent = (props: Props = {}) => {
    return renderWithTheme(
      <ProgramEffectivenessCard
        programData={props.programData}
        onDownloadClick={props.onDownloadClick || mockDownloadClick}
        onMoreClick={props.onMoreClick || mockMoreClick}
      />
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner when no data is provided', () => {
      renderComponent();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Rendering with Data', () => {
    it('should render the card title', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Wellness Program Effectiveness')).toBeInTheDocument();
    });

    it('should render analysis period correctly', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText(/Analysis period:/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 1, 2024 - Mar 31, 2024/)).toBeInTheDocument();
    });

    it('should render last updated date', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      expect(screen.getByText(/Apr 1, 2024/)).toBeInTheDocument();
    });
  });

  describe('Enrollment & Engagement Section', () => {
    it('should render enrollment rate with trend', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Enrollment Rate')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });

    it('should render active participation rate', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Active Participation')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should render weekly engagement metric', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Avg. Weekly Engagement')).toBeInTheDocument();
      expect(screen.getByText('4.5 days')).toBeInTheDocument();
    });

    it('should render completion rate', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });
  });

  describe('Health Outcomes Section', () => {
    it('should render health metrics correctly', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Avg. Health Score Improvement')).toBeInTheDocument();
      expect(screen.getByText('+8.5 pts')).toBeInTheDocument();
    });

    it('should render risk reduction rate', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Risk Level Reduction')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should render biometric improvements', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Biometric Improvements')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });

  describe('Program Comparison Section', () => {
    it('should render program comparison row', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Wellness Program A')).toBeInTheDocument();
      expect(screen.getByText('500 participants')).toBeInTheDocument();
    });

    it('should render program metrics with ranks', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Rank badge
    });
  });

  describe('Recommendations Section', () => {
    it('should render recommendation cards', () => {
      renderComponent({ programData: mockProgramData });
      expect(screen.getByText('Increase Engagement')).toBeInTheDocument();
      expect(screen.getByText('Implement weekly challenges to boost participation')).toBeInTheDocument();
      expect(screen.getByText(/Expected impact: Medium/)).toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('should handle download button click', async () => {
      renderComponent({ programData: mockProgramData });
      const downloadButton = screen.getByTitle('Download Report');
      fireEvent.click(downloadButton);
      expect(mockDownloadClick).toHaveBeenCalledTimes(1);
    });

    it('should handle more options button click', async () => {
      renderComponent({ programData: mockProgramData });
      const moreButton = screen.getByTitle('More Options');
      fireEvent.click(moreButton);
      expect(mockMoreClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing program comparison data', () => {
      const dataWithoutComparison: ProgramData = {
        ...mockProgramData,
        programComparison: undefined
      };
      renderComponent({ programData: dataWithoutComparison });
      expect(screen.getByText('Program Comparison')).toBeInTheDocument();
    });

    it('should handle missing recommendations', () => {
      const dataWithoutRecommendations: ProgramData = {
        ...mockProgramData,
        recommendations: undefined
      };
      renderComponent({ programData: dataWithoutRecommendations });
      expect(screen.getByText('Recommendations')).toBeInTheDocument();
    });

    it('should handle zero values in metrics', () => {
      const dataWithZeros: ProgramData = {
        ...mockProgramData,
        enrollmentRate: 0,
        enrollmentTarget: 0,
        enrollmentTrend: 0
      };
      renderComponent({ programData: dataWithZeros });
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
