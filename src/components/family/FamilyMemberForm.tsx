'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilyMember } from '@/types';
import { calculateBMR, calculateTDEE, adjustCaloriesForGoal } from '@/lib/utils';

const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(1).max(120),
  weight: z.number().min(20).max(500),
  weightUnit: z.enum(['kg', 'lbs']),
  height: z.number().min(50).max(300),
  heightUnit: z.enum(['cm', 'ft']),
  heightFeet: z.number().min(3).max(8).optional(),
  heightInches: z.number().min(0).max(11).optional(),
  gender: z.enum(['male', 'female']),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
  goal: z.enum(['cutting', 'maintenance', 'bulking']),
  dietaryRestrictions: z.string(),
});

type FamilyMemberForm = z.infer<typeof familyMemberSchema>;

interface Props {
  onSubmit: (member: Omit<FamilyMember, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Partial<FamilyMember>;
  onCancel?: () => void;
}

// Conversion functions
const lbsToKg = (lbs: number) => lbs * 0.453592;
const kgToLbs = (kg: number) => kg / 0.453592;
const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
const cmToFeetInches = (cm: number) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export function FamilyMemberForm({ onSubmit, initialData, onCancel }: Props) {
  const [loading, setLoading] = useState(false);

  // Convert initial data for form defaults
  const getDefaultValues = () => {
    if (!initialData) {
      return {
        name: '',
        age: 25,
        weight: 70,
        weightUnit: 'kg' as const,
        height: 170,
        heightUnit: 'cm' as const,
        heightFeet: 5,
        heightInches: 7,
        gender: 'male' as const,
        activityLevel: 'moderately_active' as const,
        goal: 'maintenance' as const,
        dietaryRestrictions: '',
      };
    }

    const { feet, inches } = cmToFeetInches(initialData.height || 170);
    
    return {
      name: initialData.name || '',
      age: initialData.age || 25,
      weight: initialData.weight || 70,
      weightUnit: 'kg' as const,
      height: initialData.height || 170,
      heightUnit: 'cm' as const,
      heightFeet: feet,
      heightInches: inches,
      gender: initialData.gender || 'male' as const,
      activityLevel: initialData.activityLevel || 'moderately_active' as const,
      goal: initialData.goal || 'maintenance' as const,
      dietaryRestrictions: initialData.dietaryRestrictions || '',
    };
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FamilyMemberForm>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedValues = watch();

  // Convert displayed values to metric for calculations
  const getMetricValues = () => {
    const weightInKg = watchedValues.weightUnit === 'lbs' 
      ? lbsToKg(watchedValues.weight || 70)
      : watchedValues.weight || 70;

    const heightInCm = watchedValues.heightUnit === 'ft'
      ? feetInchesToCm(watchedValues.heightFeet || 5, watchedValues.heightInches || 7)
      : watchedValues.height || 170;

    return { weightInKg, heightInCm };
  };

  const { weightInKg, heightInCm } = getMetricValues();

  // Calculate preview values in metric
  const bmr = calculateBMR(weightInKg, heightInCm, watchedValues.age || 25, watchedValues.gender || 'male');
  const tdee = calculateTDEE(bmr, watchedValues.activityLevel || 'moderately_active');
  const targetCalories = adjustCaloriesForGoal(tdee, watchedValues.goal || 'maintenance');

  const handleFormSubmit = async (data: FamilyMemberForm) => {
    setLoading(true);
    try {
      // Convert everything to metric for storage
      const weightInKg = data.weightUnit === 'lbs' ? lbsToKg(data.weight) : data.weight;
      const heightInCm = data.heightUnit === 'ft' 
        ? feetInchesToCm(data.heightFeet || 5, data.heightInches || 7)
        : data.height;

      const bmr = calculateBMR(weightInKg, heightInCm, data.age, data.gender);
      const tdee = calculateTDEE(bmr, data.activityLevel);
      const targetCalories = adjustCaloriesForGoal(tdee, data.goal);

      onSubmit({
        name: data.name,
        age: data.age,
        height: Math.round(heightInCm), // Store in cm
        weight: Math.round(weightInKg * 10) / 10, // Store in kg, rounded to 1 decimal
        gender: data.gender,
        activityLevel: data.activityLevel,
        goal: data.goal,
        dietaryRestrictions: data.dietaryRestrictions,
        bmr,
        tdee,
        targetCalories,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
    setLoading(false);
  };

  const handleWeightUnitChange = (newUnit: 'kg' | 'lbs') => {
    const currentWeight = watchedValues.weight || 70;
    if (newUnit !== watchedValues.weightUnit) {
      const convertedWeight = newUnit === 'lbs' 
        ? Math.round(kgToLbs(currentWeight))
        : Math.round(lbsToKg(currentWeight) * 10) / 10;
      
      setValue('weight', convertedWeight);
      setValue('weightUnit', newUnit);
    }
  };

  const handleHeightUnitChange = (newUnit: 'cm' | 'ft') => {
    if (newUnit !== watchedValues.heightUnit) {
      if (newUnit === 'ft') {
        const { feet, inches } = cmToFeetInches(watchedValues.height || 170);
        setValue('heightFeet', feet);
        setValue('heightInches', inches);
      } else {
        const cmHeight = feetInchesToCm(watchedValues.heightFeet || 5, watchedValues.heightInches || 7);
        setValue('height', Math.round(cmHeight));
      }
      setValue('heightUnit', newUnit);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit' : 'Add'} Family Member</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Age</label>
              <Input
                type="number"
                {...register('age', { valueAsNumber: true })}
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
            </div>

            {/* Weight with Unit Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Weight</label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.1"
                  {...register('weight', { valueAsNumber: true })}
                  className="flex-1"
                />
                <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => handleWeightUnitChange('kg')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      watchedValues.weightUnit === 'kg'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWeightUnitChange('lbs')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                      watchedValues.weightUnit === 'lbs'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    lbs
                  </button>
                </div>
              </div>
              {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>}
            </div>

            {/* Height with Unit Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Height</label>
              <div className="space-y-2">
                <div className="flex border border-gray-300 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => handleHeightUnitChange('cm')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      watchedValues.heightUnit === 'cm'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHeightUnitChange('ft')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                      watchedValues.heightUnit === 'ft'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    ft/in
                  </button>
                </div>
                
                {watchedValues.heightUnit === 'cm' ? (
                  <Input
                    type="number"
                    {...register('height', { valueAsNumber: true })}
                    placeholder="170"
                  />
                ) : (
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        {...register('heightFeet', { valueAsNumber: true })}
                        placeholder="5"
                        min="3"
                        max="8"
                      />
                      <label className="text-xs text-gray-500 mt-1 block">feet</label>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        {...register('heightInches', { valueAsNumber: true })}
                        placeholder="7"
                        min="0"
                        max="11"
                      />
                      <label className="text-xs text-gray-500 mt-1 block">inches</label>
                    </div>
                  </div>
                )}
              </div>
              {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>}
              {errors.heightFeet && <p className="text-red-500 text-sm mt-1">{errors.heightFeet.message}</p>}
              {errors.heightInches && <p className="text-red-500 text-sm mt-1">{errors.heightInches.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                {...register('gender')}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Activity Level</label>
              <select
                {...register('activityLevel')}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
              >
                <option value="sedentary">Sedentary (desk job, no exercise)</option>
                <option value="lightly_active">Lightly Active (light exercise 1-3x/week)</option>
                <option value="moderately_active">Moderately Active (moderate exercise 3-5x/week)</option>
                <option value="very_active">Very Active (heavy exercise 6-7x/week)</option>
                <option value="extremely_active">Extremely Active (heavy exercise + physical job)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Goal</label>
              <select
                {...register('goal')}
                className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md"
              >
                <option value="cutting">Cutting (Fat Loss)</option>
                <option value="maintenance">Maintenance</option>
                <option value="bulking">Bulking (Muscle Gain)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
              <Input
                {...register('dietaryRestrictions')}
                placeholder="e.g., vegetarian, gluten-free, no dairy, etc."
              />
            </div>
          </div>

          {/* Calculated Values Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Calculated Values</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">BMR:</span>
                <div className="font-medium">{bmr} calories</div>
              </div>
              <div>
                <span className="text-gray-600">TDEE:</span>
                <div className="font-medium">{tdee} calories</div>
              </div>
              <div>
                <span className="text-gray-600">Target:</span>
                <div className="font-medium">{targetCalories} calories</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Metric equivalent: {Math.round(weightInKg * 10) / 10} kg, {Math.round(heightInCm)} cm
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
