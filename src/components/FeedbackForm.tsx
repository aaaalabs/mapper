import { useState } from 'react';
import { cn } from '../utils/cn';
import { saveInitialRating, updateWithDetailedFeedback } from '../services/feedbackService';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';

interface FeedbackFormProps {
  mapId: string;
  onClose: () => void;
}

const PAIN_POINTS = [
  'Upload issues',
  'Visualization',
  'Missing feature',
  'Other'
];

const USE_CASES = [
  'Business',
  'Community',
  'Education',
  'Personal',
  'Other'
];

export function FeedbackForm({ mapId, onClose }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [painPoint, setPainPoint] = useState('');
  const [useCase, setUseCase] = useState('');
  const [feedback, setFeedback] = useState('');
  const [canFeature, setCanFeature] = useState(false);
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const isPositiveRating = rating !== null && rating >= 4;

  const handleSubmit = async () => {
    if (!rating) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      if (!feedbackId) {
        const initialFeedback = await saveInitialRating({
          mapId,
          rating
        });
        setFeedbackId(initialFeedback.id);
      }

      if (feedbackId) {
        await updateWithDetailedFeedback(feedbackId, {
          feedbackText: feedback,
          useCase: isPositiveRating ? useCase : undefined,
          organization: canFeature ? organization : undefined,
          email: canFeature ? email : undefined,
          canFeature: isPositiveRating && feedback ? canFeature : undefined
        });

        await trackEvent({
          event_name: ANALYTICS_EVENTS.FEEDBACK.RATING,
          event_data: { rating, map_id: mapId }
        });
      }

      onClose();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback. Please try again.');
      
      await trackEvent({
        event_name: ANALYTICS_EVENTS.FEEDBACK.COMMENT,
        event_data: { error: err instanceof Error ? err.message : 'Unknown error' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto p-6">
      {/* Rating Section - Always visible */}
      <div className="text-center">
        <h3 className="text-lg font-medium mb-3">How was your experience?</h3>
        <div className="flex justify-center gap-4">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              className={cn(
                "text-3xl transition-transform hover:scale-110",
                rating === value
                  ? "opacity-100"
                  : "opacity-60 hover:opacity-100"
              )}
              aria-label={`Rate ${value} stars`}
            >
              {value <= (hoverRating || rating || 0) ? "⭐" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* Progressive Feedback Sections */}
      {rating && (
        <div className="space-y-4">
          {/* For negative ratings, show pain points */}
          {!isPositiveRating && (
            <div>
              <label className="block text-sm font-medium mb-2">
                What could be improved?
              </label>
              <select
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              >
                <option value="">Select...</option>
                {PAIN_POINTS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          {/* For positive ratings, show use case first */}
          {isPositiveRating && (
            <div>
              <label className="block text-sm font-medium mb-2">
                What are you using this for?
              </label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              >
                <option value="">Select...</option>
                {USE_CASES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          {/* Optional feedback field */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isPositiveRating
                ? "Would you like to share your success story? (Optional)"
                : "Any specific suggestions? (Optional)"}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 min-h-[80px]"
              placeholder={isPositiveRating
                ? "Tell us how you're using the map..."
                : "Share your ideas for improvement..."}
            />
          </div>

          {/* Feature Permission - Only for positive ratings with feedback */}
          {isPositiveRating && feedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="canFeature"
                  checked={canFeature}
                  onChange={(e) => setCanFeature(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-700"
                />
                <label htmlFor="canFeature" className="text-sm">
                  I allow featuring my feedback as a testimonial
                </label>
              </div>

              {/* Progressive organization fields - Only if canFeature is checked */}
              {canFeature && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {useCase === 'Business' ? 'Company Name' : 'Name'} (Optional)
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                      placeholder={useCase === 'Business' ? 'Enter company name...' : 'Enter your name...'}
                    />
                  </div>
                  {organization && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Contact Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                        placeholder="Enter your email..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {/* Submit Section */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !rating}
              className={cn(
                "px-4 py-2 text-sm font-medium text-white rounded-md",
                "bg-accent hover:bg-accent/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 