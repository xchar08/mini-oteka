import { NextRequest, NextResponse } from 'next/server';

interface NebiusResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface MealRecommendationRequest {
  familyMembers: any[];
  pantryItems: any[];
  preferences: {
    cuisineType: string;
    dietaryRestrictions: string;
  };
  nutritionPlan: string;
}

// Function to repair truncated JSON
function repairTruncatedJSON(jsonStr: string): string {
  let repaired = jsonStr.trim();
  
  // Count braces and brackets to understand truncation
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }
  }
  
  // Remove any incomplete final element if truncated mid-property
  if (repaired.endsWith(', "') || repaired.endsWith('", "') || repaired.endsWith(': "')) {
    const lastCompleteIndex = Math.max(
      repaired.lastIndexOf('},'),
      repaired.lastIndexOf('],'),
      repaired.lastIndexOf('"')
    );
    if (lastCompleteIndex > 0) {
      repaired = repaired.substring(0, lastCompleteIndex + 1);
    }
  }
  
  // Remove trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Close any unclosed structures
  while (bracketCount > 0) {
    repaired += ']';
    bracketCount--;
  }
  
  while (braceCount > 0) {
    repaired += '}';
    braceCount--;
  }
  
  return repaired;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEBIUS_API_KEY;
    
    if (!apiKey) {
      console.error('NEBIUS_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      );
    }

    const body: MealRecommendationRequest = await request.json();
    console.log('Received meal plan request for', body.familyMembers.length, 'family members');

    // Simplified prompt that generates fewer meals initially
    const prompt = `
Generate a 3-day meal plan for ${body.familyMembers.length} family member(s):

Family Members: ${body.familyMembers.map(m => `${m.name} (${m.goal}, ${m.targetCalories} calories)`).join(', ')}
Cuisine: ${body.preferences.cuisineType || 'Mediterranean'}
Restrictions: ${body.preferences.dietaryRestrictions || 'None'}

CRITICAL: Respond with ONLY valid JSON. Keep recipes concise but complete.

{
  "weeklyPlan": {
    "monday": {
      "breakfast": {
        "name": "Greek Yogurt Bowl",
        "description": "Protein-rich breakfast",
        "prepTime": 5,
        "cookTime": 0,
        "servings": 1,
        "difficulty": "Easy",
        "ingredients": [
          {"name": "greek yogurt", "amount": "1", "unit": "cup"},
          {"name": "honey", "amount": "1", "unit": "tbsp"}
        ],
        "instructions": [
          "Place yogurt in bowl",
          "Drizzle with honey"
        ],
        "nutrition": {"calories": 200, "protein": 20, "carbs": 15, "fat": 5, "fiber": 3},
        "tips": ["Use plain yogurt"],
        "tags": ["quick"]
      },
      "lunch": {
        "name": "Simple Salad",
        "description": "Fresh and healthy",
        "prepTime": 10,
        "cookTime": 0,
        "servings": 1,
        "difficulty": "Easy",
        "ingredients": [
          {"name": "lettuce", "amount": "2", "unit": "cups"}
        ],
        "instructions": ["Mix ingredients"],
        "nutrition": {"calories": 150, "protein": 5, "carbs": 10, "fat": 8, "fiber": 4},
        "tips": ["Use fresh ingredients"],
        "tags": ["healthy"]
      },
      "dinner": {
        "name": "Grilled Chicken",
        "description": "Lean protein",
        "prepTime": 10,
        "cookTime": 20,
        "servings": 1,
        "difficulty": "Medium",
        "ingredients": [
          {"name": "chicken breast", "amount": "6", "unit": "oz"}
        ],
        "instructions": ["Season and grill chicken"],
        "nutrition": {"calories": 300, "protein": 35, "carbs": 0, "fat": 8, "fiber": 0},
        "tips": ["Don't overcook"],
        "tags": ["protein"]
      },
      "snacks": [
        {
          "name": "Apple",
          "description": "Fresh fruit",
          "prepTime": 1,
          "cookTime": 0,
          "servings": 1,
          "difficulty": "Easy",
          "ingredients": [{"name": "apple", "amount": "1", "unit": "medium"}],
          "instructions": ["Wash and eat"],
          "nutrition": {"calories": 80, "protein": 0, "carbs": 21, "fat": 0, "fiber": 4},
          "tips": ["Choose organic"],
          "tags": ["fruit"]
        }
      ]
    },
    "tuesday": {
      "breakfast": {"name": "Oatmeal", "description": "Filling breakfast", "prepTime": 5, "cookTime": 5, "servings": 1, "difficulty": "Easy", "ingredients": [{"name": "oats", "amount": "0.5", "unit": "cup"}], "instructions": ["Cook oats with water"], "nutrition": {"calories": 150, "protein": 5, "carbs": 27, "fat": 3, "fiber": 4}, "tips": ["Add fruit"], "tags": ["filling"]},
      "lunch": {"name": "Soup", "description": "Warm lunch", "prepTime": 5, "cookTime": 15, "servings": 1, "difficulty": "Easy", "ingredients": [{"name": "broth", "amount": "1", "unit": "cup"}], "instructions": ["Heat and serve"], "nutrition": {"calories": 100, "protein": 8, "carbs": 5, "fat": 2, "fiber": 1}, "tips": ["Season well"], "tags": ["warm"]},
      "dinner": {"name": "Fish", "description": "Omega-3 rich", "prepTime": 10, "cookTime": 15, "servings": 1, "difficulty": "Medium", "ingredients": [{"name": "salmon", "amount": "6", "unit": "oz"}], "instructions": ["Bake until flaky"], "nutrition": {"calories": 250, "protein": 30, "carbs": 0, "fat": 12, "fiber": 0}, "tips": ["Check doneness"], "tags": ["omega3"]},
      "snacks": [{"name": "Nuts", "description": "Healthy fats", "prepTime": 0, "cookTime": 0, "servings": 1, "difficulty": "Easy", "ingredients": [{"name": "almonds", "amount": "1", "unit": "oz"}], "instructions": ["Eat handful"], "nutrition": {"calories": 160, "protein": 6, "carbs": 6, "fat": 14, "fiber": 3}, "tips": ["Watch portions"], "tags": ["nuts"]}]
    },
    "wednesday": {
      "breakfast": {"name": "Eggs", "description": "High protein", "prepTime": 5, "cookTime": 5, "servings": 1, "difficulty": "Easy", "ingredients": [{"name": "eggs", "amount": "2", "unit": "large"}], "instructions": ["Scramble eggs"], "nutrition": {"calories": 140, "protein": 12, "carbs": 1, "fat": 10, "fiber": 0}, "tips": ["Don't overcook"], "tags": ["protein"]},
      "lunch": {"name": "Wrap", "description": "Portable meal", "prepTime": 10, "cookTime": 0, "servings": 1, "difficulty": "Easy", "ingredients": [{"name": "tortilla", "amount": "1", "unit": "large"}], "instructions": ["Fill and roll"], "nutrition": {"calories": 300, "protein": 15, "carbs": 30, "fat": 12, "fiber": 5}, "tips": ["Use whole wheat"], "tags": ["portable"]},
      "dinner": {"name": "Stir Fry", "description": "Quick dinner", "prepTime": 15, "cookTime": 10, "servings": 1, "difficulty": "Medium", "ingredients": [{"name": "vegetables", "amount": "2", "unit": "cups"}], "instructions": ["Stir fry quickly"], "nutrition": {"calories": 200, "protein": 8, "carbs": 20, "fat": 8, "fiber": 6}, "tips": ["High heat"], "tags": ["quick"]},
      "snacks": [{"name": "Yogurt", "description": "Creamy snack", "prepTime": 0, "cookTime": 0, "servings": 1, "difficulty": "Easy", "ingredients": [{"name": "yogurt", "amount": "1", "unit": "cup"}], "instructions": ["Serve chilled"], "nutrition": {"calories": 100, "protein": 10, "carbs": 12, "fat": 0, "fiber": 0}, "tips": ["Choose plain"], "tags": ["dairy"]}]
    }
  },
  "shoppingList": {
    "proteins": [{"name": "chicken breast", "quantity": "1 lb"}, {"name": "salmon", "quantity": "6 oz"}, {"name": "eggs", "quantity": "1 dozen"}],
    "vegetables": [{"name": "lettuce", "quantity": "1 head"}, {"name": "mixed vegetables", "quantity": "2 cups"}],
    "grains": [{"name": "oats", "quantity": "1 container"}, {"name": "tortillas", "quantity": "1 pack"}],
    "dairy": [{"name": "greek yogurt", "quantity": "32 oz"}],
    "pantry": [{"name": "honey", "quantity": "1 jar"}],
    "snacks": [{"name": "almonds", "quantity": "1 bag"}, {"name": "apples", "quantity": "3 pieces"}]
  },
  "macroSummary": {
    "${body.familyMembers[0]?.name || 'Member1'}": {
      "dailyTotals": {"calories": 1200, "protein": 100, "carbs": 120, "fat": 40}
    }
  }
}`;

    console.log('Making request to Nebius API...');
    
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/Devstral-Small-2505', // Using faster model
        messages: [
          {
            role: 'system',
            content: 'You are a professional nutritionist. Generate meal plans as valid JSON only. Be concise but complete. No text outside JSON object.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000, // Increased token limit
        temperature: 0.2, // Lower temperature for consistency
        response_format: { type: 'json_object' }
      }),
    });

    console.log('Nebius API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nebius API Error:', errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check server configuration.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data: NebiusResponse = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response format from AI service' },
        { status: 500 }
      );
    }

    let recommendations = data.choices[0].message.content;
    console.log('Raw AI response length:', recommendations.length);
    
    // Enhanced JSON cleanup and repair
    try {
      // Remove markdown code blocks
      recommendations = recommendations.replace(/``````\n?/g, '');
      
      // Find JSON boundaries
      const firstBrace = recommendations.indexOf('{');
      const lastBrace = recommendations.lastIndexOf('}');
      
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        recommendations = recommendations.substring(firstBrace, lastBrace + 1);
      }
      
      // Try to repair if truncated
      recommendations = repairTruncatedJSON(recommendations);
      
      // Test if it's valid JSON
      const testParse = JSON.parse(recommendations);
      console.log('Successfully validated JSON response');
      
      // Extend to 7 days if we only got 3 days
      if (testParse.weeklyPlan && Object.keys(testParse.weeklyPlan).length < 7) {
        const days = ['thursday', 'friday', 'saturday', 'sunday'];
        const existingDays = Object.keys(testParse.weeklyPlan);
        
        days.forEach((day, index) => {
          if (!testParse.weeklyPlan[day]) {
            // Copy from existing days
            const copyFrom = existingDays[index % existingDays.length];
            testParse.weeklyPlan[day] = testParse.weeklyPlan[copyFrom];
          }
        });
      }
      
      recommendations = JSON.stringify(testParse);
      
    } catch (cleanupError) {
      console.error('Error cleaning up JSON response:', cleanupError);
      console.log('Problematic response:', recommendations.substring(0, 500) + '...');
      
      return NextResponse.json(
        { error: 'AI service returned invalid JSON format. The response was truncated.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal recommendations: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
