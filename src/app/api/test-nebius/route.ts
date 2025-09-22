import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEBIUS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'NEBIUS_API_KEY not found in environment variables',
      solution: 'Add NEBIUS_API_KEY=your_api_key to your .env.local file'
    }, { status: 500 });
  }

  try {
    console.log('Testing Nebius API connection...');
    console.log('API Key prefix:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch('https://api.studio.nebius.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    console.log('Test response status:', response.status);

    if (response.ok) {
      const models = await response.json();
      return NextResponse.json({ 
        status: 'API key works!', 
        keyPrefix: apiKey.substring(0, 10) + '...',
        modelsCount: models.data?.length || 0
      });
    } else {
      const errorText = await response.text();
      console.error('API test failed:', errorText);
      
      return NextResponse.json({ 
        error: 'API key invalid or expired', 
        status: response.status,
        message: errorText,
        solution: 'Get a new API key from https://studio.nebius.com'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json({ 
      error: 'Connection failed', 
      message: error instanceof Error ? error.message : 'Unknown error',
      solution: 'Check your internet connection and API endpoint'
    }, { status: 500 });
  }
}
