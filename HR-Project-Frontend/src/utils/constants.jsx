export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  EMPLOYEE: 'employee'
};

export const LEAVE_TYPES = [
  { value: 'Annual', label: 'Annual' },
  { value: 'Sick', label: 'Sick' },
  { value: 'Maternity', label: 'Maternity' },
  { value: 'Unpaid', label: 'Unpaid' }
];

export const GENDER_CHOICES = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

export const MARITAL_CHOICES = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Divorced', label: 'Divorced' }
];