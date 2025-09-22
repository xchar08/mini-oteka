'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Clock, Users, ChefHat } from 'lucide-react';

interface Recipe {
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

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="relative">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl pr-10">{recipe.name}</CardTitle>
            {recipe.description && (
              <p className="text-gray-600 mt-2">{recipe.description}</p>
            )}
            
            {/* Recipe Meta Info */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{recipe.prepTime + recipe.cookTime} min total</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{recipe.servings} servings</span>
              </div>
              <div className="flex items-center">
                <ChefHat className="w-4 h-4 mr-1" />
                <span>{recipe.difficulty}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, idx) => (
                    <li key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <span>{ingredient.name}</span>
                      <span className="text-gray-600 text-sm">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nutrition Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Nutrition (per serving)</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span>Calories:</span>
                      <span className="font-medium">{recipe.nutrition.calories}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Protein:</span>
                      <span className="font-medium">{recipe.nutrition.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carbs:</span>
                      <span className="font-medium">{recipe.nutrition.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fat:</span>
                      <span className="font-medium">{recipe.nutrition.fat}g</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span>Fiber:</span>
                      <span className="font-medium">{recipe.nutrition.fiber}g</span>
                    </div>
                  </div>
                </div>

                {/* Prep/Cook Times */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Prep Time:</span>
                    <span>{recipe.prepTime} minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cook Time:</span>
                    <span>{recipe.cookTime} minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((instruction, idx) => (
                  <li key={idx} className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {idx + 1}
                    </span>
                    <span className="pt-1">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {recipe.tips && recipe.tips.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Chef's Tips</h3>
                <ul className="space-y-2">
                  {recipe.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
