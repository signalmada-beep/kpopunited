// ========== src/utils/analytics.ts ==========
export const logAnalyticsEvent = (eventName: string, eventParams?: any) => {
  console.log(`📊 Analytics: ${eventName}`, eventParams || '');
 
};