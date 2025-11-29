export const sendLocationToServer = async (data: any) => {
  try {
    await fetch('/api/track-loc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.log("❌ Error sending background location:", error);
  }
};
