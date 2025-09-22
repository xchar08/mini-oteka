export interface User {
    id: string;
    email: string;
    displayName: string;
    createdAt: Date;
  }
  
  export interface FamilyMember {
    id: string;
    userId: string;
    name: string;
    age: number;
    height: number; // cm
    weight: number; // kg
    gender: 'male' | 'female';
    activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
    goal: 'cutting' | 'maintenance' | 'bulking';
    dietaryRestrictions: string;
    bmr: number; // Made required
    tdee: number; // Made required
    targetCalories: number; // Made required
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface PantryItem {
    id: string;
    userId: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    expirationDate?: Date;
    nutritionPer100g?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Recipe {
    name: string;
    description?: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: string;
    ingredients: {
      name: string;
      amount: string;
      unit: string;
    }[];
    instructions: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    tips?: string[];
    tags?: string[];
  }
  
  export interface Meal {
    id: string;
    name: string;
    description: string;
    prepTime: number;
    cookTime: number;
    servings: number;
    difficulty: string;
    ingredients: {
      name: string;
      amount: string;
      unit: string;
    }[];
    instructions: string[];
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    tips?: string[];
    tags: string[];
  }
  
  export interface MealPlan {
    id: string;
    userId: string;
    weekOf: Date;
    familyMemberIds: string[];
    meals: {
      [day: string]: {
        breakfast: Meal;
        lunch: Meal;
        dinner: Meal;
        snacks: Meal[];
      };
    };
    shoppingList: ShoppingListItem[];
    preferences: {
      cuisineType: string;
      dietaryRestrictions: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface ShoppingListItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    estimated_cost?: number;
    purchased: boolean;
    notes?: string;
  }
  
  export interface FoodLog {
    id: string;
    userId: string;
    familyMemberId: string;
    date: Date;
    meals: {
      breakfast?: { items: FoodItem[]; calories: number; };
      lunch?: { items: FoodItem[]; calories: number; };
      dinner?: { items: FoodItem[]; calories: number; };
      snacks?: { items: FoodItem[]; calories: number; };
    };
    totalCalories: number;
    totalMacros: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface FoodItem {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  }
  