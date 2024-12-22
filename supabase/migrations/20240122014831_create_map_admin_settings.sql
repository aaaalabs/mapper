-- Drop existing type and trigger if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'map_admin_settings') THEN
        DROP TRIGGER IF EXISTS update_map_admin_settings_updated_at ON public.map_admin_settings;
    END IF;
EXCEPTION
    WHEN undefined_table THEN NULL;
END $$;

-- Create type for analytics display level if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_display_level') THEN
        CREATE TYPE analytics_display_level AS ENUM ('minimal', 'conversion', 'detailed');
    END IF;
END $$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.map_admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    settings JSONB NOT NULL DEFAULT jsonb_build_object(
        -- Payment Settings
        'paymentEnvironment', 'sandbox',
        'enablePaymentLogging', true,
        
        -- Analytics Settings
        'analyticsDisplayLevel', 'conversion',
        'conversionGoalValue', 100,
        
        -- Cookie Settings
        'cookieSettings', jsonb_build_object(
            'enableCookieBanner', true,
            'allowAnalyticsCookies', true,
            'cookieExpiryDays', 30
        ),
        
        -- Social Proof Settings
        'socialProof', jsonb_build_object(
            'enableTestimonialToasts', true,
            'showPurchaseNotifications', true
        ),
        
        -- Performance Settings
        'maxMarkersPerMap', 1000,
        'requestsPerMinuteLimit', 60,
        'mapCacheDurationMinutes', 15
    )
);

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS update_map_admin_settings_updated_at ON public.map_admin_settings;
CREATE TRIGGER update_map_admin_settings_updated_at
    BEFORE UPDATE ON public.map_admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.map_admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to admin" ON public.map_admin_settings;

-- Create new policies
CREATE POLICY "Allow full access to admin" ON public.map_admin_settings
    FOR ALL USING (auth.jwt()->>'email' = 'admin@libralab.ai');

-- Insert default settings if not exists
INSERT INTO public.map_admin_settings (settings)
SELECT jsonb_build_object(
    -- Payment Settings
    'paymentEnvironment', 'sandbox',
    'enablePaymentLogging', true,
    
    -- Analytics Settings
    'analyticsDisplayLevel', 'conversion',
    'conversionGoalValue', 100,
    
    -- Cookie Settings
    'cookieSettings', jsonb_build_object(
        'enableCookieBanner', true,
        'allowAnalyticsCookies', true,
        'cookieExpiryDays', 30
    ),
    
    -- Social Proof Settings
    'socialProof', jsonb_build_object(
        'enableTestimonialToasts', true,
        'showPurchaseNotifications', true
    ),
    
    -- Performance Settings
    'maxMarkersPerMap', 1000,
    'requestsPerMinuteLimit', 60,
    'mapCacheDurationMinutes', 15
)
WHERE NOT EXISTS (SELECT 1 FROM public.map_admin_settings LIMIT 1);
