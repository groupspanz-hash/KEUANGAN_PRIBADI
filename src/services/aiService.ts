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
      let errMessage = 'Failed to fetch AI insights';
      try {
        const errorData = await response.json();
        if (errorData.error) errMessage = errorData.error;
      } catch (e) {}
      throw new Error(errMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}
