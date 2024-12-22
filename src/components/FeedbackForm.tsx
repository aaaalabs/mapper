import { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from '../services/analytics';
import { createLead } from '../services/leadService';
import { saveInitialRating, updateWithDetailedFeedback } from '../services/feedbackService';

interface FeedbackFormProps {
  onClose: () => void;
  mapId: string;
}

export function FeedbackForm({ onClose, mapId }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [organization, setOrganization] = useState('');
  const [canFeature, setCanFeature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitRating = async () => {
    if (!rating) return;

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('session_id');
      
      const feedbackData = await saveInitialRating({
        mapId,
        rating,
        session_id: sessionId
      });

      // Create lead if email is provided
      if (email && name) {
        await createLead({
          email,
          name,
          lead_type: 'feedback',
          status: 'pending',
          session_id: sessionId,
          event_data: {
            feedback_id: feedbackData.id,
            rating,
            can_feature: canFeature
          }
        });
      }

      // Update feedback with details
      await updateWithDetailedFeedback({
        feedbackId: feedbackData.id,
        feedback,
        painPoint,
        organization,
        email,
        canFeature,
        session_id: sessionId
      });

      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      const message = error instanceof Error ? error.message : 'Failed to submit feedback';
      setError(message);
      trackErrorWithContext(error instanceof Error ? error : new Error(message), {
        category: ErrorCategory.FEEDBACK,
        subcategory: 'SUBMIT',
        severity: ErrorSeverity.HIGH,
        metadata: {
          mapId,
          rating,
          error: message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium">Rate your experience</h3>
        <div className="mt-2">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                className={`w-10 h-10 rounded-full ${
                  rating === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {rating && (
        <div className="space-y-4">
          <Textarea
            placeholder="Tell us about your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email && (
            <>
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Organization (optional)"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
              <Input
                placeholder="What problem are you trying to solve? (optional)"
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={canFeature}
                  onChange={(e) => setCanFeature(e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Can we feature your feedback?
                </span>
              </label>
            </>
          )}

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSubmitRating} disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}