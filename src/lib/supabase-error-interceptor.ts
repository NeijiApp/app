// Real-time Supabase error interceptor
// Add this to your app to catch SASL_SIGNATURE_MISMATCH exactly when it happens

export function initSupabaseErrorInterceptor() {
    console.log('🔍 Supabase Error Interceptor initialized');
    
    // Intercept fetch requests to Supabase
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
        const [url, options] = args;
        
        // Only intercept Supabase requests
        if (typeof url === 'string' && url.includes('.supabase.co')) {
            console.log('🌐 SUPABASE REQUEST INTERCEPTED:');
            console.log('   URL:', url);
            console.log('   Method:', options?.method || 'GET');
            console.log('   Headers:', options?.headers);
            console.log('   Body:', options?.body);
            
            try {
                const response = await originalFetch(...args);
                
                if (!response.ok) {
                    console.log('❌ SUPABASE REQUEST FAILED:');
                    console.log('   Status:', response.status);
                    console.log('   StatusText:', response.statusText);
                    
                    // Clone response to read body without consuming it
                    const responseClone = response.clone();
                    try {
                        const errorBody = await responseClone.text();
                        console.log('   Error Body:', errorBody);
                        
                        if (errorBody.includes('SASL_SIGNATURE_MISMATCH')) {
                            console.log('🚨 FOUND SASL_SIGNATURE_MISMATCH ERROR!');
                            console.log('   URL that failed:', url);
                            console.log('   Headers sent:', options?.headers);
                            console.log('   Full error:', errorBody);
                            
                            // Trigger debugger to inspect
                            debugger;
                        }
                    } catch (e) {
                        console.log('   Could not read error body:', e);
                    }
                }
                
                return response;
            } catch (error) {
                console.log('❌ SUPABASE REQUEST CRASHED:');
                console.log('   Error:', error);
                
                if (error instanceof Error && error.message.includes('SASL_SIGNATURE_MISMATCH')) {
                    console.log('🚨 FOUND SASL_SIGNATURE_MISMATCH IN FETCH ERROR!');
                    console.log('   URL that failed:', url);
                    console.log('   Headers sent:', options?.headers);
                    
                    // Trigger debugger to inspect
                    debugger;
                }
                
                throw error;
            }
        }
        
        return originalFetch(...args);
    };
    
    // Also intercept console errors
    const originalError = console.error;
    console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('SASL_SIGNATURE_MISMATCH')) {
            console.log('🚨 CONSOLE ERROR WITH SASL_SIGNATURE_MISMATCH:');
            console.log('   Full message:', message);
            console.log('   Stack trace:', new Error().stack);
            
            // Trigger debugger
            debugger;
        }
        
        return originalError(...args);
    };
}

// Call this in your app's root component or layout
export function enableSupabaseDebugging() {
    if (typeof window !== 'undefined') {
        initSupabaseErrorInterceptor();
        
        // Also add global error handler
        window.addEventListener('unhandledrejection', (event) => {
            if (event.reason?.message?.includes('SASL_SIGNATURE_MISMATCH')) {
                console.log('🚨 UNHANDLED PROMISE REJECTION WITH SASL_SIGNATURE_MISMATCH:');
                console.log('   Reason:', event.reason);
                console.log('   Stack:', event.reason?.stack);
                
                // Trigger debugger
                debugger;
            }
        });
    }
}
