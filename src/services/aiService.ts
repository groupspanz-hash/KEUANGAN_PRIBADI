export async function getAIInsights(transactions: any[], userProfile: any) {
  try {
    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions, userProfile }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI insights');
    }

    return await response.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    return [];
  }
}
