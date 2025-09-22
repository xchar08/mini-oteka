'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FamilyMember, PantryItem, MealPlan } from '@/types';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { generateMealRecommendations } from '@/lib/nebius';
import { RecipeModal } from './RecipeModal';
import { ChefHat, Calendar, ShoppingCart, Bug } from 'lucide-react';

export function MealPlanGenerator() {
  const { user } = useAuthContext();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [cuisineType, setCuisineType] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load family members
    const loadFamilyMembers = async () => {
      const q = query(
        collection(db, 'familyMembers'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const members = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as FamilyMember[];
      
      setFamilyMembers(members);
    };

    // Load pantry items
    const loadPantryItems = async () => {
      const q = query(
        collection(db, 'pantryItems'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
      })) as PantryItem[];
      
      setPantryItems(items);
    };

    loadFamilyMembers();
    loadPantryItems();
  }, [user]);

  const checkAvailableModels = async () => {
    try {
      console.log('Checking available models...');
      const response = await fetch('/api/models');
      const models = await response.json();
      
      if (models.data) {
        console.log('Available models:', models.data.map((m: any) => m.id));
        setAvailableModels(models.data);
        alert(`Found ${models.data.length} models. Check console for details.`);
      } else {
        console.log('Models response:', models);
        alert('Error fetching models. Check console for details.');
      }
    } catch (error) {
      console.error('Error checking models:', error);
      alert('Failed to check models. Check console for details.');
    }
  };

  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch('/api/test-nebius');
      const result = await response.json();
      console.log('API test result:', result);
      alert(`API test: ${result.status || result.error}. Check console for details.`);
    } catch (error) {
      console.error('API test failed:', error);
      alert('API test failed. Check console for details.');
    }
  };

  const handleRecipeClick = (recipe: any) => {
    if (recipe && recipe.name) {
      setSelectedRecipe(recipe);
      setIsRecipeModalOpen(true);
    }
  };

  const handleGenerateMealPlan = async () => {
    if (!user || familyMembers.length === 0) {
      alert('Please add family members first');
      return;
    }

    setLoading(true);
    try {
      const nutritionPlan = `
        Updated Nutrition Plan with Expanded Avoidance Guidelines
        I've incorporated your request to add more items to avoid, focusing on substances starting with "benz-" (like benzene, benzoates, and benzophenone) that can act as hormone disruptors or carcinogens. These have been integrated into the "Hormone-Disrupting Chemicals to Avoid" section and cross-referenced in relevant avoidance tables for completeness. The rest of the plan remains intact but refined for clarity.
        
        Caloric Requirements by Phase
        TDEE Calculation Framework
        Total Daily Energy Expenditure (TDEE) = BMR × Activity Factor
        Basal Metabolic Rate (BMR) components:
        Basic organ function (60-70% of total calories)
        Thermic Effect of Food (8-10% of total calories)
        Non-Exercise Activity Thermogenesis (15-20%)
        Exercise Activity Thermogenesis (15-30% for active individuals)
        
        Phase-Specific Caloric Targets
        Aggressive Cut: TDEE - 750-1000 cal, -1.5-2 lbs/week, Rapid fat loss, preserve muscle
        Moderate Cut: TDEE - 500-750 cal, -1-1.5 lbs/week, Steady fat loss, muscle retention
        Mini Cut: TDEE - 300-500 cal, -0.5-1 lb/week, Fine-tune physique
        Maintenance: TDEE ± 100 cal, 0 lbs/week, Body recomposition
        Lean Bulk: TDEE + 200-400 cal, +0.5-1 lb/week, Minimize fat gain
        Aggressive Bulk: TDEE + 500-800 cal, +1-2 lbs/week, Maximum muscle gain
        
        Macro Distribution by Phase
        Cutting: Protein 1.2-1.6g/lb (35-40% cal), Carbs 0.5-1.5g/lb (30-45% cal), Fat 0.2-0.4g/lb (20-30% cal)
        Maintenance: Protein 1.0-1.2g/lb (30-35% cal), Carbs 1.5-2.5g/lb (40-50% cal), Fat 0.3-0.5g/lb (25-30% cal)  
        Bulking: Protein 0.8-1.2g/lb (25-30% cal), Carbs 2.0-3.5g/lb (45-55% cal), Fat 0.4-0.7g/lb (25-30% cal)
        
        Foods to AVOID for Optimal Performance & Health
        High-Priority Avoidance: Industrial seed oils (canola, soybean, corn oils), Conventional animal products, Pesticide-heavy produce (dirty dozen), Processed soy products
        Moderate-Priority Avoidance: Refined sugars & sweeteners, Gluten-containing grains, Conventional dairy, Processed meats
        Hormone-Disrupting Chemicals: Benzene in beverages/smoked foods, Benzoates in preserved foods, Benzophenone in packaging, Phthalates, Parabens, Triclosan
        
        Smart Shopping Priorities: Organic for dirty dozen, grass-fed animal proteins, wild-caught fish, quality fats (avocado, olive oil, nuts), complex carbs (sweet potato, quinoa), anti-inflammatory herbs/spices
      `;

      const recommendationsResponse = await generateMealRecommendations({
        familyMembers,
        pantryItems,
        preferences: {
          cuisineType: cuisineType || 'Mediterranean',
          dietaryRestrictions: dietaryRestrictions || 'None',
        },
        nutritionPlan,
      });

      console.log('Raw response:', recommendationsResponse);

      let recommendations;
      try {
        // Try to parse the JSON
        recommendations = JSON.parse(recommendationsResponse);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.log('Response that failed to parse:', recommendationsResponse);
        
        // Try to fix common JSON issues
        let fixedResponse = recommendationsResponse;
        
        // Remove any text before the first {
        const firstBrace = fixedResponse.indexOf('{');
        if (firstBrace > 0) {
          fixedResponse = fixedResponse.substring(firstBrace);
        }
        
        // Remove any text after the last }
        const lastBrace = fixedResponse.lastIndexOf('}');
        if (lastBrace > 0) {
          fixedResponse = fixedResponse.substring(0, lastBrace + 1);
        }
        
        // Try to fix common issues
        fixedResponse = fixedResponse
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/,\s*}/g, '}') // Remove trailing commas before }
          .replace(/,\s*]/g, ']') // Remove trailing commas before ]
          .replace(/\n/g, ' ') // Replace newlines with spaces
          .replace(/\r/g, ' ') // Replace carriage returns with spaces
          .replace(/\t/g, ' ') // Replace tabs with spaces
          .replace(/  +/g, ' '); // Replace multiple spaces with single space
        
        try {
          recommendations = JSON.parse(fixedResponse);
          console.log('Successfully parsed fixed JSON');
        } catch (secondParseError) {
          console.error('Still failed to parse after fixes:', secondParseError);
          throw new Error('Failed to parse AI response as JSON. The AI returned malformed data.');
        }
      }

      setMealPlan(recommendations);

      // Save meal plan to Firebase
      await addDoc(collection(db, 'mealPlans'), {
        userId: user.uid,
        weekOf: new Date(),
        familyMemberIds: familyMembers.map(m => m.id),
        recommendations,
        preferences: {
          cuisineType: cuisineType || 'Mediterranean',
          dietaryRestrictions: dietaryRestrictions || 'None',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    } catch (error) {
      console.error('Error generating meal plan:', error);
      if (error instanceof Error) {
        alert(`Failed to generate meal plan: ${error.message}`);
      } else {
        alert('Failed to generate meal plan. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <ChefHat className="w-5 h-5 mr-2" />
              Generate Weekly Meal Plan
            </div>
            <Button
              onClick={() => setDebugMode(!debugMode)}
              variant="outline"
              size="sm"
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cuisine Type</label>
              <Input
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                placeholder="e.g., Mediterranean, Indian, Chinese, American"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Additional Dietary Restrictions</label>
              <Input
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="e.g., no nuts, low sodium, keto-friendly"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Current Family Members</h3>
            {familyMembers.length === 0 ? (
              <p className="text-sm text-gray-600">No family members added yet. Please add family members first.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {familyMembers.map((member) => (
                  <div key={member.id} className="text-sm">
                    <span className="font-medium">{member.name}</span>
                    <div className="text-gray-600 text-xs">
                      {member.goal} • {member.targetCalories} cal
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {debugMode && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-yellow-800">Debug Tools</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={testApiConnection}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test API Connection
                </Button>
                <Button
                  onClick={checkAvailableModels}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Check Available Models
                </Button>
              </div>
              {availableModels.length > 0 && (
                <div className="text-xs text-gray-600">
                  <p className="font-medium">Available Models ({availableModels.length}):</p>
                  <ul className="mt-1 space-y-1">
                    {availableModels.slice(0, 5).map((model: any, idx) => (
                      <li key={idx} className="font-mono">{model.id}</li>
                    ))}
                    {availableModels.length > 5 && (
                      <li className="italic">... and {availableModels.length - 5} more (check console for full list)</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleGenerateMealPlan}
            disabled={loading || familyMembers.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? 'Generating...' : 'Generate Meal Plan'}
          </Button>
        </CardContent>
      </Card>

      {mealPlan && (
        <div className="space-y-6">
          {/* Weekly Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Weekly Meal Plan
                <span className="text-sm font-normal text-gray-500 ml-2">(Click meal names for recipes)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {Object.entries(mealPlan.weeklyPlan || {}).map(([day, meals]: [string, any]) => (
                  <div key={day} className="space-y-2">
                    <h3 className="font-medium capitalize">{day}</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Breakfast:</span>
                        <button
                          onClick={() => handleRecipeClick(meals.breakfast)}
                          className="block text-gray-600 hover:text-blue-600 hover:underline cursor-pointer text-left disabled:cursor-default disabled:hover:text-gray-600 disabled:hover:no-underline"
                          disabled={!meals.breakfast?.name}
                        >
                          {meals.breakfast?.name || 'Not planned'}
                        </button>
                      </div>
                      <div>
                        <span className="font-medium">Lunch:</span>
                        <button
                          onClick={() => handleRecipeClick(meals.lunch)}
                          className="block text-gray-600 hover:text-blue-600 hover:underline cursor-pointer text-left disabled:cursor-default disabled:hover:text-gray-600 disabled:hover:no-underline"
                          disabled={!meals.lunch?.name}
                        >
                          {meals.lunch?.name || 'Not planned'}
                        </button>
                      </div>
                      <div>
                        <span className="font-medium">Dinner:</span>
                        <button
                          onClick={() => handleRecipeClick(meals.dinner)}
                          className="block text-gray-600 hover:text-blue-600 hover:underline cursor-pointer text-left disabled:cursor-default disabled:hover:text-gray-600 disabled:hover:no-underline"
                          disabled={!meals.dinner?.name}
                        >
                          {meals.dinner?.name || 'Not planned'}
                        </button>
                      </div>
                      {meals.snacks && meals.snacks.length > 0 && (
                        <div>
                          <span className="font-medium">Snacks:</span>
                          <div className="space-y-1">
                            {meals.snacks.map((snack: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => handleRecipeClick(snack)}
                                className="block text-gray-600 hover:text-blue-600 hover:underline cursor-pointer text-left"
                              >
                                {snack.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shopping List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Shopping List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(mealPlan.shoppingList || {}).map(([category, items]: [string, any]) => (
                  <div key={category}>
                    <h3 className="font-medium capitalize mb-2">{category}</h3>
                    <ul className="space-y-1">
                      {(items || []).map((item: any, idx: number) => (
                        <li key={idx} className="text-sm flex justify-between">
                          <span>{item.name || item}</span>
                          {item.quantity && <span className="text-gray-500">{item.quantity}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Macro Summary */}
          {mealPlan.macroSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Macro Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(mealPlan.macroSummary).map(([memberName, macros]: [string, any]) => (
                    <div key={memberName} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">{memberName}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Calories:</span>
                          <span className="font-medium">{macros.dailyTotals?.calories || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protein:</span>
                          <span className="font-medium">{macros.dailyTotals?.protein || 0}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbs:</span>
                          <span className="font-medium">{macros.dailyTotals?.carbs || 0}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fat:</span>
                          <span className="font-medium">{macros.dailyTotals?.fat || 0}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recipe Modal */}
      <RecipeModal 
        recipe={selectedRecipe}
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setSelectedRecipe(null);
        }}
      />
    </div>
  );
}
