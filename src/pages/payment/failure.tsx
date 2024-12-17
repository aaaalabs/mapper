import { useEffect } from 'react';
import { useRouter } from 'next/router';

const PaymentFailurePage = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/subscription');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Payment Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sorry, there was an error processing your payment. You will be redirected back to try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
