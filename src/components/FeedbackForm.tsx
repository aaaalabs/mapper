import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Star } from 'lucide-react';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../services/analytics';
import { ANALYTICS_EVENTS } from '../services/analytics';
import { createLead } from '../services/leadService';
import { saveInitialRating, updateWithDetailedFeedback, getFeedbackStats, getRandomTestimonial } from '../services/feedbackService';

interface FeedbackFormProps {
  onClose: () => void;
  mapId: string;
  context?: 'download' | 'share';
}

export function FeedbackForm({ onClose, mapId, context = 'download' }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canFeature, setCanFeature] = useState(false);
  const [stats, setStats] = useState<{ totalMaps: number; averageRating: number; testimonialCount: number } | null>(null);
  const [testimonial, setTestimonial] = useState<string | null>(null);

  useEffect(() => {
    // Load social proof data
    const loadStats = async () => {
      try {
        const [statsData, randomTestimonial] = await Promise.all([
          getFeedbackStats(),
          getRandomTestimonial()
        ]);
        setStats(statsData);
        setTestimonial(randomTestimonial);
      } catch (error) {
        console.error('Error loading stats:', error);
        await trackError(error instanceof Error ? error : new Error('Failed to load stats'), {
          category: ERROR_CATEGORY.FEEDBACK,
          severity: ERROR_SEVERITY.HIGH,
          metadata: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    };
    loadStats();
  }, []);

  const handleRatingClick = async (value: number) => {
    setRating(value);
    setShowDetails(true);

    try {
      const sessionId = localStorage.getItem('session_id');
      
      await saveInitialRating({
        map_id: mapId,
        rating: value,
        session_id: sessionId,
        context
      });
    } catch (error) {
      console.error('Error saving rating:', error);
      await trackError(error instanceof Error ? error : new Error('Failed to save rating'), {
        category: ERROR_CATEGORY.FEEDBACK,
        severity: ERROR_SEVERITY.HIGH,
        metadata: { mapId, rating: value, context }
      });
    }
  };

  const handleSubmitDetails = async () => {
    if (!rating) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('session_id');

      // Create lead if email is provided
      if (email && name) {
        await createLead({
          email,
          name,
          lead_type: 'feedback',
          status: 'pending',
          session_id: sessionId,
          event_data: {
            rating,
            can_feature: canFeature,
            context
          }
        });
      }

      // Save detailed feedback
      if (feedback) {
        await updateWithDetailedFeedback({
          map_id: mapId,
          feedback,
          canFeature
        });
      }

      await trackEvent({
        event_name: ANALYTICS_EVENTS.FEEDBACK.SUBMITTED,
        event_data: {
          rating,
          has_comment: Boolean(feedback),
          has_email: Boolean(email),
          map_id: mapId
        }
      });

      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback. Please try again.');
      await trackError(error instanceof Error ? error : new Error('Failed to submit feedback'), {
        category: ERROR_CATEGORY.FEEDBACK,
        severity: ERROR_SEVERITY.HIGH,
        metadata: { mapId, rating, hasEmail: Boolean(email), context, error: error instanceof Error ? error.message : String(error) }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showDetails) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold mb-2">
          {context === 'download' ? 'How was your map creation experience?' : 'Would you recommend this to others?'}
        </h3>

        {/* Social Proof */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <div className="font-semibold text-primary dark:text-dark-primary">{stats.totalMaps.toLocaleString()}</div>
              <div className="text-gray-500 dark:text-gray-400">Maps Created</div>
            </div>
            <div>
              <div className="font-semibold text-primary dark:text-dark-primary">{stats.averageRating}/5</div>
              <div className="text-gray-500 dark:text-gray-400">Avg Rating</div>
            </div>
            <div>
              <div className="font-semibold text-primary dark:text-dark-primary">{stats.testimonialCount}</div>
              <div className="text-gray-500 dark:text-gray-400">Reviews</div>
            </div>
          </div>
        )}

        {/* Star Rating */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => handleRatingClick(value)}
              className={`p-2 hover:scale-110 transition-transform ${
                rating === value ? 'text-yellow-400 scale-110' : 'text-gray-300 dark:text-gray-600'
              }`}
            >
              <Star className="w-8 h-8 fill-current" />
            </button>
          ))}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tap a star to rate
        </p>

        {/* Random Testimonial */}
        {testimonial && (
          <div className="mt-6 text-sm italic text-gray-600 dark:text-gray-300">
            "{testimonial}"
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {rating && rating >= 4 
              ? "Would you like to share your success story? (Optional)"
              : "What could be improved? (Optional)"}
          </label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={rating && rating >= 4 
              ? "Tell us how you're using the map and what you like about it..."
              : "Help us understand what we could do better..."}
            className="w-full"
          />
        </div>

        {/* Only show testimonial option for ratings >= 4 */}
        {rating && rating >= 4 && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="canFeature"
              checked={canFeature}
              onChange={(e) => setCanFeature(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="canFeature" className="text-sm">
              I allow featuring my feedback as a testimonial
            </label>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium">
            {rating && rating >= 4 
              ? "Stay updated on new features (Optional)"
              : "Get notified when we address this (Optional)"}
          </p>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2"
          />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button onClick={handleSubmitDetails} disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}