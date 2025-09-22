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

    const prompt = `
Based on the following family information and nutrition plan, generate a comprehensive weekly meal plan with shopping list.

Family Members:
${JSON.stringify(body.familyMembers, null, 2)}

Current Pantry Items:
${JSON.stringify(body.pantryItems, null, 2)}

Preferences:
- Cuisine Type: ${body.preferences.cuisineType}
- Dietary Restrictions: ${body.preferences.dietaryRestrictions}

Nutrition Plan Guidelines:
${body.nutritionPlan}

Please provide:
1. 7-day meal plan with breakfast, lunch, dinner, and 2 snacks per day
2. Adjust portions and macros for each family member based on their goals (bulking/cutting/maintaining)
3. Complete shopping list organized by categories
4. Quantities needed accounting for current pantry items
5. Estimated prep time for each meal
6. Macro breakdown per meal per person

Format the response as JSON with the following structure:
{
  "weeklyPlan": {
    "monday": { "breakfast": {"name": "Greek Yogurt Bowl", "ingredients": ["greek yogurt", "berries", "honey"], "nutrition": {"calories": 300, "protein": 20, "carbs": 30, "fat": 8}}, "lunch": {"name": "Chicken Quinoa Salad", "ingredients": [], "nutrition": {}}, "dinner": {"name": "Salmon with Vegetables", "ingredients": [], "nutrition": {}}, "snacks": [{"name": "Apple with Almonds", "ingredients": ["apple", "almonds"]}] },
    "tuesday": { "breakfast": {}, "lunch": {}, "dinner": {}, "snacks": [] },
    "wednesday": { "breakfast": {}, "lunch": {}, "dinner": {}, "snacks": [] },
    "thursday": { "breakfast": {}, "lunch": {}, "dinner": {}, "snacks": [] },
    "friday": { "breakfast": {}, "lunch": {}, "dinner": {}, "snacks": [] },
    "saturday": { "breakfast": {}, "lunch": {}, "dinner": {}, "snacks": [] },
    "sunday": { "breakfast": {}, "lunch": {}, "dinner": {}, "snacks": [] }
  },
  "shoppingList": {
    "proteins": [{"name": "chicken breast", "quantity": "2 lbs"}],
    "vegetables": [{"name": "broccoli", "quantity": "1 lb"}],
    "grains": [{"name": "quinoa", "quantity": "1 bag"}],
    "dairy": [{"name": "greek yogurt", "quantity": "32 oz"}],
    "pantry": [{"name": "olive oil", "quantity": "1 bottle"}],
    "spices": [{"name": "turmeric", "quantity": "1 jar"}]
  },
  "macroSummary": {
    "John": {
      "dailyTotals": { "calories": 2500, "protein": 150, "carbs": 250, "fat": 80 }
    }
  }
}
`;

    console.log('Making request to Nebius API...');
    
    const response = await fetch('https://api.studio.nebius.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', // Changed to 8B model
        messages: [
          {
            role: 'system',
            content: 'You are a professional nutritionist and meal planning expert. Provide detailed, nutritionally balanced meal plans that optimize health and fitness goals. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4096,
        temperature: 0.7,
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

    const recommendations = data.choices[0].message.content;
    console.log('Successfully generated meal recommendations');
    
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal recommendations: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
