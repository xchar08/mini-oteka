import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female'): number {
  // Mifflin-St Jeor Equation
  const bmr = gender === 'male' 
    ? (10 * weight) + (6.25 * height) - (5 * age) + 5
    : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  
  return Math.round(bmr);
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
  };
  
  return Math.round(bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2));
}

export function adjustCaloriesForGoal(tdee: number, goal: 'cutting' | 'maintenance' | 'bulking'): number {
  switch (goal) {
    case 'cutting':
      return Math.round(tdee - 500); // 1 lb per week deficit
    case 'bulking':
      return Math.round(tdee + 300); // Conservative surplus
    case 'maintenance':
    default:
      return tdee;
  }
}
