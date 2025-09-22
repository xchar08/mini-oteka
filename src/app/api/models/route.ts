import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEBIUS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'NEBIUS_API_KEY not found in environment variables'
    }, { status: 500 });
  }

  try {
    console.log('Fetching available models from Nebius API...');
    
    const response = await fetch('https://api.studio.nebius.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('Models API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Models API error:', errorText);
      return NextResponse.json({ 
        error: `Failed to fetch models: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const models = await response.json();
    console.log('Available models:', models.data?.length || 0);
    
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
