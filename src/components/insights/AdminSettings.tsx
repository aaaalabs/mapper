import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { Database } from '../../types/supabase';
import { settingsStyles as styles } from './styles/settingsStyles';

type MapSettings = Database['public']['Tables']['map_admin_settings']['Row'];
type SettingsType = MapSettings['settings'];

const DEFAULT_SETTINGS: SettingsType = {
  paymentEnvironment: 'sandbox' as const,
  enablePaymentLogging: true,
  analyticsDisplayLevel: 'conversion' as const,
  conversionGoalValue: 100,
  cookieSettings: {
    enableCookieBanner: true,
    allowAnalyticsCookies: true,
    cookieExpiryDays: 30,
  },
  socialProof: {
    enableTestimonialToasts: true,
    showPurchaseNotifications: true,
  },
  maxMarkersPerMap: 1000,
  requestsPerMinuteLimit: 60,
  mapCacheDurationMinutes: 15,
};

export function AdminSettings() {
  const [settings, setSettings] = useState<MapSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error: settingsError } = await supabase
        .from('map_admin_settings')
        .select('*')
        .single();

      if (settingsError) {
        if (settingsError.code === 'PGRST116') {
          // No settings found, create default
          const { data: newData, error: insertError } = await supabase
            .from('map_admin_settings')
            .insert({
              settings: DEFAULT_SETTINGS,
              user_id: null
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setSettings(newData);
        } else {
          throw settingsError;
        }
      } else {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async <K extends keyof SettingsType>(
    key: K,
    value: SettingsType[K]
  ) => {
    if (!settings) return;

    try {
      setSaving(true);
      const updatedSettings = {
        ...settings.settings,
        [key]: value
      };

      const { error: updateError } = await supabase
        .from('map_admin_settings')
        .update({ settings: updatedSettings })
        .eq('id', settings.id);

      if (updateError) throw updateError;

      setSettings({
        ...settings,
        settings: updatedSettings
      });
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchSettings}>Retry</Button>
      </div>
    );
  }

  const currentSettings = settings?.settings || DEFAULT_SETTINGS;
  const cookieSettings = currentSettings.cookieSettings || {
    enableCookieBanner: true,
    allowAnalyticsCookies: true,
    cookieExpiryDays: 30,
  };
  const socialProof = currentSettings.socialProof || {
    enableTestimonialToasts: true,
    showPurchaseNotifications: true,
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Admin Settings</h2>
      
      <div className={styles.settingsGrid}>
        {/* Payment Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Payment Settings</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Environment</h4>
                <p className={styles.settingDescription}>
                  Switch between test and live payment environments
                </p>
              </div>
              <div className={styles.settingControl}>
                <Select
                  value={currentSettings.paymentEnvironment}
                  onChange={(value) => updateSetting('paymentEnvironment', value as SettingsType['paymentEnvironment'])}
                  options={[
                    { label: 'Sandbox', value: 'sandbox' },
                    { label: 'Production', value: 'production' }
                  ]}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Payment Logging</h4>
                <p className={styles.settingDescription}>
                  Enable detailed payment logging for debugging
                </p>
              </div>
              <div className={styles.settingControl}>
                <Switch
                  checked={currentSettings.enablePaymentLogging}
                  onCheckedChange={(checked) => updateSetting('enablePaymentLogging', checked)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Analytics & Growth</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Analytics Display</h4>
                <p className={styles.settingDescription}>
                  Control how analytics are displayed (data collection remains detailed)
                </p>
              </div>
              <div className={styles.settingControl}>
                <Select
                  value={currentSettings.analyticsDisplayLevel}
                  onChange={(value) => updateSetting('analyticsDisplayLevel', value as SettingsType['analyticsDisplayLevel'])}
                  options={[
                    { label: 'Minimal', value: 'minimal' },
                    { label: 'Conversion Focus', value: 'conversion' },
                    { label: 'Detailed', value: 'detailed' }
                  ]}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Conversion Goal ($)</h4>
                <p className={styles.settingDescription}>
                  Target revenue for conversion tracking
                </p>
              </div>
              <div className={styles.settingControl}>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={currentSettings.conversionGoalValue}
                  onChange={(e) => updateSetting('conversionGoalValue', Number(e.target.value))}
                  disabled={saving}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cookie Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Cookie Settings</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Cookie Banner</h4>
                <p className={styles.settingDescription}>
                  Show cookie consent banner to new visitors
                </p>
              </div>
              <div className={styles.settingControl}>
                <Switch
                  checked={cookieSettings.enableCookieBanner}
                  onCheckedChange={(checked) => 
                    updateSetting('cookieSettings', {
                      ...cookieSettings,
                      enableCookieBanner: checked
                    })
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Analytics Cookies</h4>
                <p className={styles.settingDescription}>
                  Enable cookies for tracking user behavior
                </p>
              </div>
              <div className={styles.settingControl}>
                <Switch
                  checked={cookieSettings.allowAnalyticsCookies}
                  onCheckedChange={(checked) => 
                    updateSetting('cookieSettings', {
                      ...cookieSettings,
                      allowAnalyticsCookies: checked
                    })
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Cookie Expiry</h4>
                <p className={styles.settingDescription}>
                  Days before cookies expire
                </p>
              </div>
              <div className={styles.settingControl}>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={cookieSettings.cookieExpiryDays}
                  onChange={(e) => 
                    updateSetting('cookieSettings', {
                      ...cookieSettings,
                      cookieExpiryDays: Number(e.target.value)
                    })
                  }
                  disabled={saving}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Social Proof</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Testimonial Toasts</h4>
                <p className={styles.settingDescription}>
                  Show recent positive testimonials in bottom corner
                </p>
              </div>
              <div className={styles.settingControl}>
                <Switch
                  checked={socialProof.enableTestimonialToasts}
                  onCheckedChange={(checked) => 
                    updateSetting('socialProof', {
                      ...socialProof,
                      enableTestimonialToasts: checked
                    })
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Purchase Notifications</h4>
                <p className={styles.settingDescription}>
                  Show recent purchase notifications
                </p>
              </div>
              <div className={styles.settingControl}>
                <Switch
                  checked={socialProof.showPurchaseNotifications}
                  onCheckedChange={(checked) => 
                    updateSetting('socialProof', {
                      ...socialProof,
                      showPurchaseNotifications: checked
                    })
                  }
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Performance Settings</h3>
          
          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Max Markers</h4>
                <p className={styles.settingDescription}>
                  Maximum markers allowed per map
                </p>
              </div>
              <div className={styles.settingControl}>
                <Input
                  type="number"
                  min={100}
                  max={5000}
                  value={currentSettings.maxMarkersPerMap}
                  onChange={(e) => updateSetting('maxMarkersPerMap', Number(e.target.value))}
                  disabled={saving}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Rate Limit</h4>
                <p className={styles.settingDescription}>
                  API requests allowed per minute
                </p>
              </div>
              <div className={styles.settingControl}>
                <Input
                  type="number"
                  min={10}
                  max={300}
                  value={currentSettings.requestsPerMinuteLimit}
                  onChange={(e) => updateSetting('requestsPerMinuteLimit', Number(e.target.value))}
                  disabled={saving}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          <div className={styles.settingItem}>
            <div className={styles.settingHeader}>
              <div>
                <h4 className={styles.settingLabel}>Cache Duration</h4>
                <p className={styles.settingDescription}>
                  Minutes to cache map data
                </p>
              </div>
              <div className={styles.settingControl}>
                <Input
                  type="number"
                  min={5}
                  max={60}
                  value={currentSettings.mapCacheDurationMinutes}
                  onChange={(e) => updateSetting('mapCacheDurationMinutes', Number(e.target.value))}
                  disabled={saving}
                  className="w-24"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {saving && (
        <div className={styles.savingIndicator}>
          <LoadingSpinner size="sm" />
          <span>Saving changes...</span>
        </div>
      )}
    </div>
  );
}
