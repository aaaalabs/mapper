import React, { useState } from 'react';
import { Button } from './ui/Button';
import { submitMapFeedback } from '../services/mapService';
import { cn } from '../lib/utils';

interface FeedbackFormProps {
  mapId: string;
  onClose: () => void;
}

const communityTypes = [
  'Alumni Network',
  'Remote Team',
  'Professional Association',
  'Educational Institution',
  'Nonprofit Organization',
  'Other'
];

export function FeedbackForm({ mapId, onClose }: FeedbackFormProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState<number>(0);
  const [communityType, setCommunityType] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [canFeature, setCanFeature] = useState(false);
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await submitMapFeedback({
        map_id: mapId,
        satisfaction_rating: rating,
        community_type: communityType,
        testimonial: testimonial || undefined,
        can_feature: canFeature,
        organization: organization || undefined,
        email: email || undefined
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-auto">
      <h3 className="text-xl font-semibold mb-4">
        Help Us Improve
      </h3>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How satisfied are you with your map?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-colors",
                    rating === value
                      ? "bg-accent text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What type of community are you mapping?
            </label>
            <select
              value={communityType}
              onChange={(e) => setCommunityType(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select type...</option>
              {communityTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {rating > 3 && (
            <Button
              variant="primary"
              onClick={() => setStep(2)}
              disabled={!rating || !communityType}
              className="w-full"
            >
              Next
            </Button>
          )}

          {rating <= 3 && (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!rating || !communityType}
              className="w-full"
            >
              Submit Feedback
            </Button>
          )}
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Would you like to share your experience? (Optional)
            </label>
            <textarea
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              className="w-full p-2 border rounded-md h-24"
              placeholder="Share how you're using the map..."
            />
          </div>

          {testimonial && (
            <>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={canFeature}
                    onChange={(e) => setCanFeature(e.target.checked)}
                    className="rounded text-accent"
                  />
                  <span className="text-sm text-gray-600">
                    Allow us to feature your feedback
                  </span>
                </label>

                {canFeature && (
                  <>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Organization name (optional)"
                      className="w-full p-2 border rounded-md"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="w-full p-2 border rounded-md"
                    />
                  </>
                )}
              </div>
            </>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1"
            >
              Submit Feedback
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 