interface MealRecommendationRequest {
    familyMembers: {
      name: string;
      goal: string;
      targetCalories: number;
    }[];
    pantryItems: {
      name: string;
      quantity: number;
    }[];
    preferences: {
      cuisineType: string;
      dietaryRestrictions: string;
    };
    nutritionPlan: string;
  }
  
  export async function generateMealRecommendations(request: MealRecommendationRequest): Promise<string> {
    try {
      console.log('Calling meal recommendations API...');
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error('Error calling meal recommendations API:', error);
      throw new Error('Failed to generate meal recommendations');
    }
  }
  