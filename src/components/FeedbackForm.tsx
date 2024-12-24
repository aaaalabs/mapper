import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Star } from 'lucide-react';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../services/analytics';
import { ANALYTICS_EVENTS } from '../services/analytics';
import { createLead } from '../services/leadService';
import { saveInitialRating, updateWithDetailedFeedback, getFeedbackStats, getRandomTestimonial } from '../services/feedbackService';
import { FeedbackError } from '../types/feedback';

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
  const [stats, setStats] = useState<{
    totalCount: number;
    averageRating: number;
    typeDistribution: Record<string, number>;
    ratingDistribution: Record<number, number>;
    statusDistribution: Record<string, number>;
  } | null>(null);
  const [testimonial, setTestimonial] = useState<{ feedback_text: string; rating: number; } | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

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
    setError(null);

    try {
      const sessionId = localStorage.getItem('currentSessionId');
      
      const id = await saveInitialRating(
        mapId,
        value,
        sessionId,
        context
      );
      
      setFeedbackId(id);
      setShowDetails(true);
    } catch (error) {
      console.error('Error saving rating:', error);
      setError(error instanceof FeedbackError ? error.message : 'Failed to save rating');
      await trackError(error instanceof Error ? error : new Error('Failed to save rating'), {
        category: ERROR_CATEGORY.FEEDBACK,
        severity: ERROR_SEVERITY.HIGH,
        metadata: { mapId, rating: value, context }
      });
    }
  };

  const handleSubmitDetails = async () => {
    if (!rating || !feedbackId) {
      setError('Unable to submit feedback. Please try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('currentSessionId');

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
      if (feedback || email || name || canFeature) {
        await updateWithDetailedFeedback(feedbackId, {
          feedback_text: feedback || null,
          email: email || null,
          name: name || null,
          can_feature: canFeature,
          testimonial: canFeature ? feedback : null
        });
      }

      await trackEvent({
        event_name: ANALYTICS_EVENTS.FEEDBACK.SUBMITTED,
        event_data: {
          rating,
          has_feedback: !!feedback,
          has_email: !!email,
          context,
          session_id: sessionId
        }
      });

      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error instanceof FeedbackError ? error.message : 'Failed to submit feedback');
      setIsLoading(false);
      
      await trackError(error instanceof Error ? error : new Error('Failed to submit feedback'), {
        category: ERROR_CATEGORY.FEEDBACK,
        severity: ERROR_SEVERITY.HIGH,
        metadata: { 
          feedbackId,
          rating,
          has_feedback: !!feedback,
          has_email: !!email,
          context,
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  };

  const renderSocialProof = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
        <div>
          <div className="font-semibold text-primary dark:text-dark-primary">{stats.totalCount.toLocaleString()}</div>
          <div className="text-gray-500 dark:text-gray-400">Maps Created</div>
        </div>
        <div>
          <div className="font-semibold text-primary dark:text-dark-primary">{stats.averageRating.toFixed(1)}/5</div>
          <div className="text-gray-500 dark:text-gray-400">Avg Rating</div>
        </div>
        <div>
          <div className="font-semibold text-primary dark:text-dark-primary">
            {Object.values(stats.typeDistribution).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">Testimonials</div>
        </div>
      </div>
    );
  };

  if (!showDetails) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold mb-2">
          {context === 'download' ? 'How was your map creation experience?' : 'Would you recommend this to others?'}
        </h3>

        {/* Social Proof */}
        {renderSocialProof()}

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
            "{testimonial.feedback_text}"
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