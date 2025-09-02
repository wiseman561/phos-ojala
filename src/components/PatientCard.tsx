import React from 'react';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string;
  phone?: string;
  status?: string;
}

export interface PatientCardProps {
  patient: Patient;
  onClick?: (patient: Patient) => void;
  className?: string;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  onClick,
  className = ''
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(patient);
    }
  };

  return (
    <div
      className={`patient-card ${className}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="patient-card__header">
        <h3 className="patient-card__name">
          {patient.firstName} {patient.lastName}
        </h3>
        {patient.status && (
          <span className={`patient-card__status patient-card__status--${patient.status}`}>
            {patient.status}
          </span>
        )}
      </div>

      <div className="patient-card__details">
        {patient.email && (
          <div className="patient-card__detail">
            <span className="patient-card__label">Email:</span>
            <span className="patient-card__value">{patient.email}</span>
          </div>
        )}

        {patient.phone && (
          <div className="patient-card__detail">
            <span className="patient-card__label">Phone:</span>
            <span className="patient-card__value">{patient.phone}</span>
          </div>
        )}

        {patient.dateOfBirth && (
          <div className="patient-card__detail">
            <span className="patient-card__label">DOB:</span>
            <span className="patient-card__value">
              {new Date(patient.dateOfBirth).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCard;
