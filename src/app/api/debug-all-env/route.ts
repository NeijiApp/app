export async function GET() {
  return Response.json({
    // Check all possible variations
    ASSEMBLY_SERVICE_URL: process.env.ASSEMBLY_SERVICE_URL,
    assembly_service_url: process.env.assembly_service_url,
    
    // Check if it's in different formats
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.toLowerCase().includes('assembly') || 
      key.toLowerCase().includes('service') ||
      key.toLowerCase().includes('railway')
    ),
    
    // Node environment info
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    
    // Check our env.js file import
    message: "Complete environment diagnostic for Vercel"
  });
}
